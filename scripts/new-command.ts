#!/usr/bin/env bun
// Scaffolds a `bb <group> <verb>` command: writes the command, test and docs
// stubs, wires the DI token, bootstrap registration and Commander subcommand,
// and prints the steps that still need a human. Every edit is computed and
// validated in memory first, and a failed write rolls back the ones before it.
//
//   bun run new:command <group> <verb> [--list --wrapper-key <key>]
//                       [--description <text>] [--dry-run] [--root <dir>]

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import type { Command } from 'commander';
import * as prettier from 'prettier';

const USAGE =
  'Usage: bun run new:command <group> <verb> [--list --wrapper-key <key>] ' +
  '[--description <text>] [--dry-run] [--root <dir>]';

const VERIFY = 'bun run check';

// Keys every scaffolded JSON envelope already uses.
const ENVELOPE_KEYS = new Set([
  'workspace',
  'repoSlug',
  'count',
  'hasMore',
  'limit',
  'values',
]);

const NAME_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function fail(message: string): never {
  console.error(`new-command: ${message}`);
  process.exit(1);
}

const pascal = (name: string): string =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const camel = (name: string): string =>
  pascal(name).charAt(0).toLowerCase() + pascal(name).slice(1);

const words = (name: string): string =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const escapeRe = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const { values: flags, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    list: { type: 'boolean', default: false },
    'wrapper-key': { type: 'string' },
    description: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    root: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (flags.help) {
  console.log(USAGE);
  process.exit(0);
}

const [group, verb, ...extra] = positionals;
if (!group || !verb || extra.length > 0) fail(USAGE);
if (!NAME_RE.test(group)) fail(`group "${group}" must be kebab-case`);
if (!NAME_RE.test(verb)) fail(`verb "${verb}" must be kebab-case`);
if (group === 'help' || verb === 'help') fail('"help" is reserved');

const isList = flags.list ?? false;
// The wrapper key is a public JSON contract, so it is never guessed.
const wrapperKey = flags['wrapper-key'] ?? '';
if (isList !== Boolean(wrapperKey)) {
  fail('--list and --wrapper-key <key> go together (e.g. --wrapper-key tags)');
}
if (isList && !/^[a-z][A-Za-z0-9]*$/.test(wrapperKey)) {
  fail(`wrapper key "${wrapperKey}" must be camelCase`);
}
if (ENVELOPE_KEYS.has(wrapperKey)) {
  fail(`wrapper key "${wrapperKey}" collides with an envelope field`);
}

// `list` commands name the class after the collection (`ListWebhooksCommand`),
// everything else after the resource (`ViewWebhookCommand`).
const className = `${pascal(verb)}${
  isList && verb === 'list' ? pascal(wrapperKey) : pascal(group)
}Command`;
const optionsName = `${className.slice(0, -'Command'.length)}Options`;
const description = (
  flags.description ?? `TODO(scaffold): describe what bb ${group} ${verb} does`
).replace(/\.$/, '');
// The text lands in TypeScript strings (quoted via JSON.stringify) and in MDX,
// where these characters would start JSX, an expression or code.
if (/[<>{}`\n]/.test(description)) {
  fail('--description cannot contain <, >, {, }, backticks or newlines');
}
const quotedDescription = JSON.stringify(description);

const root = resolve(flags.root ?? join(import.meta.dir, '..'));
const paths = {
  container: 'src/core/container.ts',
  bootstrap: 'src/bootstrap.ts',
  topRegister: 'src/commands/register.ts',
  groupRegister: `src/commands/${group}/register.ts`,
  leafRegister: `src/commands/${group}.register.ts`,
  command: `src/commands/${group}/${verb}.command.ts`,
  // Groups with many subcommands keep one test file each in a folder.
  test: existsSync(join(root, 'tests/commands', group))
    ? `tests/commands/${group}/${verb}.test.ts`
    : `tests/commands/${group}-${verb}.test.ts`,
  docs: `docs/src/content/docs/commands/${group}.mdx`,
  docsFolder: `docs/src/content/docs/commands/${group}/index.mdx`,
  outputService: 'src/services/output.service.ts',
  driftTest: 'tests/cli-completion-drift.test.ts',
  alias: 'src/alias.ts',
  cliTest: 'tests/cli.test.ts',
  registerTest: 'tests/commands/register.test.ts',
};

const originals = new Map<string, string>();
const changes = new Map<string, string>();

function read(path: string): string {
  const pending = changes.get(path);
  if (pending !== undefined) return pending;
  const full = join(root, path);
  if (!existsSync(full)) fail(`${path} not found under ${root}`);
  const text = readFileSync(full, 'utf8');
  originals.set(path, text);
  return text;
}

function create(path: string, content: string): void {
  if (existsSync(join(root, path))) fail(`${path} already exists`);
  changes.set(path, content);
}

function insertAt(path: string, text: string, index: number): void {
  const source = read(path);
  changes.set(path, source.slice(0, index) + text + source.slice(index));
}

/** Insert `text` before the line containing the last match of `anchor`. */
function insertBeforeLast(path: string, anchor: RegExp, text: string): void {
  const source = read(path);
  const matches = [...source.matchAll(new RegExp(anchor, 'gm'))];
  const last = matches.at(-1);
  if (!last) fail(`${path}: anchor ${anchor} not found`);
  insertAt(path, text, source.lastIndexOf('\n', last.index) + 1);
}

/** Insert `text` after the line containing `index`. */
function insertAfterLineAt(path: string, index: number, text: string): void {
  const source = read(path);
  insertAt(path, text, source.indexOf('\n', index) + 1);
}

/** Rewrite the `toEqual([...])` string list in the test named `testName`. */
function rewritePinnedList(
  path: string,
  testName: string,
  update: (names: string[]) => string[]
): void {
  const source = read(path);
  const testStart = source.indexOf(`it('${testName}`);
  const listStart = source.indexOf('toEqual([', testStart) + 'toEqual('.length;
  const listEnd = source.indexOf(']);', listStart);
  if (testStart < 0 || listStart < testStart || listEnd < 0) {
    fail(`${path}: list in test "${testName}" not found`);
  }
  const names = [...source.slice(listStart, listEnd).matchAll(/'([\w-]+)'/g)];
  const lines = update(names.map((match) => match[1]!)).map((n) => `'${n}',`);
  changes.set(
    path,
    `${source.slice(0, listStart)}[${lines.join('\n')}${source.slice(listEnd)}`
  );
}

// The real command tree catches every collision: nested groups registered
// from their own module, aliases, and top-level leaf commands.
const { cli } = (await import(
  pathToFileURL(join(root, 'src/cli.ts')).href
)) as { cli: Command };
const named = (commands: readonly Command[], name: string) =>
  commands.find((c) => c.name() === name || c.aliases().includes(name));
const groupCommand = named(cli.commands, group);
const isNewGroup = !groupCommand;
if (groupCommand && groupCommand.commands.length === 0) {
  fail(`"${group}" is a top-level command, not a command group`);
}
if (groupCommand && named(groupCommand.commands, verb)) {
  fail(`bb ${group} ${verb} already exists`);
}
if (groupCommand && !existsSync(join(root, paths.groupRegister))) {
  fail(`${paths.groupRegister} not found; wire this group by hand`);
}
if (isNewGroup && existsSync(join(root, paths.leafRegister))) {
  fail(`${paths.leafRegister} exists but is not registered`);
}

const token = className;
if (new RegExp(`^\\s*${token}:`, 'm').test(read(paths.container))) {
  fail(`ServiceTokens.${token} already exists`);
}

// --- Command and test stubs -------------------------------------------------

const commandHeader = `/**
 * ${words(verb)} ${group} command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
`;

const constructorBlock = `  // TODO(scaffold): inject the generated API client this command calls and
  // add its ServiceTokens entry to the registerCommand deps in bootstrap.ts.
  constructor(
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }`;

const commandSource = isList
  ? `${commandHeader}
// TODO(scaffold): replace with the generated API type of one list item.
interface ${pascal(group)}Item {
  id?: string;
}

export interface ${optionsName} {
  workspace?: string;
  repo?: string;
  limit?: string;
  all?: boolean;
}

export class ${className} extends BaseCommand<${optionsName}, void> {
  public readonly name = '${verb}';
  public readonly description = ${quotedDescription};

${constructorBlock}

  public async execute(
    options: ${optionsName},
    context: CommandContext
  ): Promise<void> {
    const { workspace, repoSlug } =
      await this.contextService.requireRepoContextFor(options, context);

    await this.runList<${pascal(group)}Item>(
      {
        options,
        // TODO(scaffold): fetch one page from the generated API client.
        fetchPage: async () => ({ values: [] }),
        wrapperKey: '${wrapperKey}',
        jsonMetadata: { workspace, repoSlug },
        emptyMessage: 'No ${words(group).toLowerCase()}s found',
        tableHeaders: ['ID'],
        mapRow: (item) => [item.id ?? ''],
        noun: '${words(group).toLowerCase()}s',
      },
      context
    );
  }
}
`
  : `${commandHeader}
export interface ${optionsName} {
  workspace?: string;
  repo?: string;
}

export class ${className} extends BaseCommand<${optionsName}, void> {
  public readonly name = '${verb}';
  public readonly description = ${quotedDescription};

${constructorBlock}

  public async execute(
    options: ${optionsName},
    context: CommandContext
  ): Promise<void> {
    const { workspace, repoSlug } =
      await this.contextService.requireRepoContextFor(options, context);

    // TODO(scaffold): call the API and build the real result.
    const result = { workspace, repoSlug };

    if (context.globalOptions.json) {
      await this.output.json(result);
      return;
    }

    this.output.info(\`\${workspace}/\${repoSlug}\`);
  }
}
`;
create(paths.command, commandSource);

const fromTest = (path: string): string =>
  relative(dirname(paths.test), path).replaceAll('\\', '/');
const testSource = `/**
 * bb ${group} ${verb} command tests
 */

import { describe, it, expect } from 'bun:test';
import { ${className} } from '${fromTest(`src/commands/${group}/${verb}.command.js`)}';
import { getJsonPayload } from '${fromTest('tests/helpers/output-logs.js')}';
import { createMockContextService, createMockOutputService } from '${fromTest('tests/setup.js')}';

// TODO(scaffold): test against the mock Bitbucket server with
// startCommandHarness() from tests/helpers/mock-bitbucket.ts (tests/AGENTS.md).
describe('${className}', () => {
  it('emits the JSON envelope', async () => {
    const output = createMockOutputService();
    const command = new ${className}(createMockContextService(), output);

    await command.execute(
      {},
      { globalOptions: { workspace: 'acme', repo: 'demo', json: true } }
    );

    expect(getJsonPayload(output.logs)).toEqual(${
      isList
        ? `{ workspace: 'acme', repoSlug: 'demo', count: 0, hasMore: false, limit: 25, ${wrapperKey}: [] }`
        : `{ workspace: 'acme', repoSlug: 'demo' }`
    });
  });
});
`;
create(paths.test, testSource);

// --- DI token and bootstrap registration ------------------------------------

const groupTokens = new Set<string>();
if (!isNewGroup) {
  const groupDir = join(root, 'src/commands', group);
  for (const file of readdirSync(groupDir)) {
    if (!file.endsWith('register.ts')) continue;
    const source = read(`src/commands/${group}/${file}`);
    for (const match of source.matchAll(/ServiceTokens\.(\w+)/g)) {
      groupTokens.add(match[1]!);
    }
  }
}

/** Index of the last occurrence of any `pattern(token)` in `source`. */
function lastTokenIndex(
  source: string,
  pattern: (t: string) => string
): number {
  let last = -1;
  for (const t of groupTokens) {
    for (const match of source.matchAll(new RegExp(pattern(t), 'gm'))) {
      last = Math.max(last, match.index);
    }
  }
  return last;
}

const containerSource = read(paths.container);
const tokenLine = `  ${token}: '${token}',\n`;
const lastContainerToken = lastTokenIndex(
  containerSource,
  (t) => `^\\s*${escapeRe(t)}:`
);
if (lastContainerToken >= 0) {
  insertAfterLineAt(paths.container, lastContainerToken, tokenLine);
} else {
  insertBeforeLast(
    paths.container,
    /^} as const;/,
    `\n  // Commands - ${words(group)}\n${tokenLine}`
  );
}

const importLine = `import { ${className} } from './commands/${group}/${verb}.command.js';\n`;
const bootstrapImports = [
  ...read(paths.bootstrap).matchAll(
    new RegExp(`^import .* from '\\./commands/${escapeRe(group)}/`, 'gm')
  ),
];
const lastImport = bootstrapImports.at(-1);
if (lastImport) {
  insertAfterLineAt(paths.bootstrap, lastImport.index, importLine);
} else {
  insertBeforeLast(
    paths.bootstrap,
    /^export interface BootstrapOptions/,
    `// ${words(group)} commands\n${importLine}\n`
  );
}

const registration = `  registerCommand(container, ServiceTokens.${token}, ${className}, [
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);
`;
const bootstrapSource = read(paths.bootstrap);
const lastRegistration = lastTokenIndex(
  bootstrapSource,
  (t) => `ServiceTokens\\.${escapeRe(t)},`
);
if (lastRegistration >= 0) {
  // A registerCommand call ends on a 2-space-indented `);` or `]);` line.
  const statementEnd = /^ {2}\]?\);$/gm;
  statementEnd.lastIndex = lastRegistration;
  const end = statementEnd.exec(bootstrapSource);
  if (!end) fail(`${paths.bootstrap}: cannot find end of registerCommand`);
  insertAfterLineAt(paths.bootstrap, end.index, registration);
} else {
  insertBeforeLast(
    paths.bootstrap,
    /^ {2}return container;$/,
    `  // ${words(group)} commands\n${registration}\n`
  );
}

// --- Commander wiring -------------------------------------------------------

const listOptions = isList
  ? `
    .option('--limit <number>', 'Maximum number of items to list', '25')
    .option('--all', 'List all items (overrides --limit)')`
  : '';

function subcommandBlock(groupVar: string): string {
  return `
  ${groupVar}
    .command('${verb}')
    .description(${quotedDescription})${listOptions}
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb ${group} ${verb}', 'bb ${group} ${verb} --json'],${
          isList ? `\n        defaults: { limit: '25' },` : ''
        }
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.${token},
        options
      );
    });

`;
}

const registerFn = `register${pascal(group)}Commands`;
if (isNewGroup) {
  const groupVar = `${camel(group)}Cmd`;
  create(
    paths.groupRegister,
    `import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function ${registerFn}(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  // TODO(scaffold): describe the command group.
  const ${groupVar} = new Command('${group}').description(
    'Manage ${words(group).toLowerCase()}s'
  );
${subcommandBlock(groupVar)}
  parent.addCommand(${groupVar});
}
`
  );

  const imports = [
    ...read(paths.topRegister).matchAll(/^import \{ register\w+ \} from .*$/gm),
  ];
  const lastTopImport = imports.at(-1);
  if (!lastTopImport) fail(`${paths.topRegister}: no register imports found`);
  insertAfterLineAt(
    paths.topRegister,
    lastTopImport.index,
    `import { ${registerFn} } from './${group}/register.js';\n`
  );
  insertBeforeLast(paths.topRegister, /^\];$/, `  ${registerFn},\n`);

  // Lists that pin the top-level command set.
  insertBeforeLast(paths.alias, /^ {2}'help',$/, `  '${group}',\n`);
  rewritePinnedList(
    paths.registerTest,
    'registers the top-level commands',
    (names) => [...names, group]
  );
  rewritePinnedList(
    paths.cliTest,
    'should register all top-level commands',
    (names) => [...names, group].sort()
  );
} else {
  const source = read(paths.groupRegister);
  const groupVar = source.match(
    new RegExp(`const (\\w+) = new Command\\('${escapeRe(group)}'\\)`)
  )?.[1];
  if (!groupVar) {
    fail(`${paths.groupRegister}: cannot find new Command('${group}')`);
  }
  insertBeforeLast(
    paths.groupRegister,
    new RegExp(`^\\s*parent\\.addCommand\\(${groupVar}\\);`),
    subcommandBlock(groupVar)
  );
}

// --- JSON wrapper key -------------------------------------------------------

const wrapperKeysBlock =
  read(paths.outputService).match(
    /WRAPPER_ARRAY_KEYS: readonly string\[\] = \[([^\]]*)\]/
  )?.[1] ?? fail(`${paths.outputService}: WRAPPER_ARRAY_KEYS not found`);
const registeredKeys = [...wrapperKeysBlock.matchAll(/'(\w+)'/g)].map(
  (match) => match[1]
);
const newWrapperKey = isList && !registeredKeys.includes(wrapperKey);
if (newWrapperKey) {
  insertBeforeLast(
    paths.outputService,
    /^ {2}'values', \/\/ generic fallback/,
    `  '${wrapperKey}', // ${group} ${verb}\n`
  );
  insertBeforeLast(
    paths.driftTest,
    /^ {6}'values',$/,
    `      '${wrapperKey}',\n`
  );
}
if (isList) {
  const driftSource = read(paths.driftTest);
  const mapEnd = driftSource.indexOf(
    '    };',
    driftSource.indexOf('COLLECTION_COMMAND_KEYS')
  );
  if (mapEnd < 0) fail(`${paths.driftTest}: COLLECTION_COMMAND_KEYS not found`);
  insertAt(
    paths.driftTest,
    `      '${group} ${verb}': '${wrapperKey}',\n`,
    mapEnd
  );
}

// --- Docs -------------------------------------------------------------------

const docsSection = `## \`bb ${group} ${verb}\`

${description}.

\`\`\`bash
bb ${group} ${verb} [options]
\`\`\`
${
  isList
    ? `
### Options

| Option             | Description                                   |
| ------------------ | --------------------------------------------- |
| \`--limit <number>\` | Maximum number of items to list (default: 25) |
| \`--all\`            | List all items (overrides \`--limit\`)         |
`
    : ''
}
### Examples

\`\`\`bash
bb ${group} ${verb}
bb ${group} ${verb} --json
\`\`\`
`;

// A group documented as a folder of pages (`pr/`) needs a human to pick the
// page; see `docsFolder` in the next steps.
const docsInFolder = existsSync(join(root, paths.docsFolder));
if (docsInFolder) {
  // Nothing to write.
} else if (existsSync(join(root, paths.docs))) {
  // After the last command section, ahead of trailing "See also"-style ones.
  const source = read(paths.docs);
  const sections = [...source.matchAll(/^## `bb /gm)];
  const lastSection = sections.at(-1)?.index ?? 0;
  const next = /^(?:---\n\n)?## /gm;
  next.lastIndex = source.indexOf('\n', lastSection);
  const trailing = next.exec(source);
  changes.set(
    paths.docs,
    trailing
      ? `${source.slice(0, trailing.index)}---\n\n${docsSection}\n${source.slice(trailing.index)}`
      : `${source.trimEnd()}\n\n---\n\n${docsSection}`
  );
} else {
  create(
    paths.docs,
    `---
title: ${words(group)} Commands
description: TODO(scaffold) one-line summary of bb ${group} for search results.
---

TODO(scaffold): introduce the ${group} commands.

---

${docsSection}`
  );
}

// --- Write ------------------------------------------------------------------

for (const [path, content] of changes) {
  if (!path.endsWith('.ts')) continue;
  const full = join(root, path);
  const config = await prettier.resolveConfig(full);
  changes.set(
    path,
    await prettier.format(content, { ...config, filepath: full })
  );
}

const created = [...changes.keys()].filter((path) => !originals.has(path));
const edited = [...changes.keys()].filter((path) => originals.has(path));

if (!flags['dry-run']) {
  const written: string[] = [];
  try {
    for (const [path, content] of changes) {
      const full = join(root, path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
      written.push(path);
    }
  } catch (error) {
    for (const path of written) {
      const original = originals.get(path);
      if (original === undefined) rmSync(join(root, path));
      else writeFileSync(join(root, path), original);
    }
    fail(`write failed, changes rolled back: ${String(error)}`);
  }
}

const steps = [
  'Fill in every TODO(scaffold) marker: grep -rn "TODO(scaffold)" src tests docs',
  'Add arguments and options in the register.ts block, and inject the API client',
  'Refresh the help snapshot and review its diff: bun test --update-snapshots tests/commands/register.test.ts',
  ...(!isNewGroup && read(paths.cliTest).includes(`requireCommand('${group}')`)
    ? [
        `Add '${verb}' to the pinned ${group} subcommand list in ${paths.cliTest}`,
      ]
    : []),
  ...(docsInFolder
    ? [
        `Document the command on the right page under ${dirname(paths.docsFolder)}/`,
      ]
    : []),
  ...(isNewGroup
    ? [
        `Add commands/${group} to the "Command Reference" sidebar in docs/astro.config.mjs, the README command table and docs/src/components/CommandIndex.astro`,
        `Move ${registerFn} in src/commands/register.ts (and the pinned order in ${paths.registerTest}) if it belongs elsewhere in bb --help`,
      ]
    : []),
  ...(newWrapperKey
    ? [
        `Add '${wrapperKey}' to the wrapper key list in docs/src/content/docs/reference/json-output.mdx`,
      ]
    : []),
  'New ErrorCode or env var? Document it (bun run lint:docs checks), plus any new token scope in reference/token-scopes.mdx',
  'Add a changeset: bun run changeset (minor for a new command)',
  `Verify: ${VERIFY}`,
];

const label = flags['dry-run'] ? 'Would ' : '';
console.log(`${label}${label ? 'create' : 'Created'}:`);
for (const path of created) console.log(`  ${path}`);
console.log(`${label}${label ? 'edit' : 'Edited'}:`);
for (const path of edited) console.log(`  ${path}`);
console.log('\nNext steps (src/commands/AGENTS.md has the full checklist):');
steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
