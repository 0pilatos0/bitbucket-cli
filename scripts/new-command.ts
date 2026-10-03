#!/usr/bin/env bun
// Scaffolds a `bb <group> <verb>` command: writes the command, test and docs
// stubs, wires the DI token, bootstrap registration and Commander subcommand,
// and prints the steps that still need a human. Every edit is computed and
// validated in memory first, so a failed anchor leaves the tree untouched.
//
//   bun run new:command <group> <verb> [--list] [--wrapper-key <key>]
//                       [--description <text>] [--dry-run] [--root <dir>]

import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import * as prettier from 'prettier';

const USAGE =
  'Usage: bun run new:command <group> <verb> [--list] [--wrapper-key <key>] ' +
  '[--description <text>] [--dry-run] [--root <dir>]';

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
if (flags['wrapper-key'] && !flags.list) {
  fail('--wrapper-key only applies with --list');
}

const isList = flags.list ?? false;
const wrapperKey = flags['wrapper-key'] ?? `${camel(group)}s`;
if (isList && !/^[a-z][A-Za-z0-9]*$/.test(wrapperKey)) {
  fail(`wrapper key "${wrapperKey}" must be camelCase`);
}

// List commands name the class after the collection (`ListWebhooksCommand`),
// everything else after the resource (`ViewWebhookCommand`).
const className = `${pascal(verb)}${isList ? pascal(wrapperKey) : pascal(group)}Command`;
const optionsName = `${className.slice(0, -'Command'.length)}Options`;
const description =
  flags.description ?? `TODO(scaffold): describe what bb ${group} ${verb} does`;
if (/['`\\\n]/.test(description)) {
  fail('--description cannot contain quotes, backticks or newlines');
}

const root = resolve(flags.root ?? join(import.meta.dir, '..'));
const paths = {
  container: 'src/core/container.ts',
  bootstrap: 'src/bootstrap.ts',
  topRegister: 'src/commands/register.ts',
  groupRegister: `src/commands/${group}/register.ts`,
  leafRegister: `src/commands/${group}.register.ts`,
  command: `src/commands/${group}/${verb}.command.ts`,
  test: `tests/commands/${group}-${verb}.test.ts`,
  docs: `docs/src/content/docs/commands/${group}.mdx`,
  outputService: 'src/services/output.service.ts',
  driftTest: 'tests/cli-completion-drift.test.ts',
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

const isNewGroup = !existsSync(join(root, paths.groupRegister));
if (isNewGroup && existsSync(join(root, paths.leafRegister))) {
  fail(`"${group}" is a top-level command, not a command group`);
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
  public readonly description = '${description}';

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
  public readonly description = '${description}';

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

const testSource = `/**
 * bb ${group} ${verb} command tests
 */

import { describe, it, expect } from 'bun:test';
import { ${className} } from '../../src/commands/${group}/${verb}.command.js';
import { createMockContextService, createMockOutputService } from '../setup.js';

// TODO(scaffold): replace with tests against a mocked API client.
describe('${className}', () => {
  it('emits the JSON envelope', async () => {
    const output = createMockOutputService();
    const command = new ${className}(createMockContextService(), output);

    await command.execute(
      {},
      { globalOptions: { workspace: 'acme', repo: 'demo', json: true } }
    );

    expect(output.logs).toHaveLength(1);
    expect(JSON.parse(output.logs[0]!.slice('json:'.length))).toEqual(${
      isList
        ? `{ workspace: 'acme', repoSlug: 'demo', count: 0, ${wrapperKey}: [] }`
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
    .description('${description}')${listOptions}
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
} else {
  const source = read(paths.groupRegister);
  const groupVar = source.match(
    new RegExp(`const (\\w+) = new Command\\('${escapeRe(group)}'\\)`)
  )?.[1];
  if (!groupVar) {
    fail(`${paths.groupRegister}: cannot find new Command('${group}')`);
  }
  if (
    new RegExp(`${groupVar}\\s*\\.command\\('${escapeRe(verb)}[ ']`).test(
      source
    )
  ) {
    fail(`bb ${group} ${verb} is already registered`);
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

if (existsSync(join(root, paths.docs))) {
  const source = read(paths.docs);
  changes.set(paths.docs, `${source.trimEnd()}\n\n---\n\n${docsSection}`);
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
  for (const [path, content] of changes) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    await writeFile(full, content);
  }
}

const steps = [
  'Fill in every TODO(scaffold) marker: grep -rn "TODO(scaffold)" src tests docs',
  'Add arguments and options in the register.ts block, and inject the API client',
  'Refresh the help snapshot and review its diff: bun test --update-snapshots tests/commands/register.test.ts',
  ...(isNewGroup
    ? [
        `Add commands/${group} to the "Command Reference" sidebar in docs/astro.config.mjs`,
        `Move ${registerFn} in src/commands/register.ts if it belongs elsewhere in bb --help`,
      ]
    : []),
  'New ErrorCode or env var? Document it (bun run lint:docs checks), plus any new token scope in reference/token-scopes.mdx',
  'Add a changeset: bun run changeset (minor for a new command)',
  'Verify: bun run lint && bun test',
];

const label = flags['dry-run'] ? 'Would ' : '';
console.log(`${label}${label ? 'create' : 'Created'}:`);
for (const path of created) console.log(`  ${path}`);
console.log(`${label}${label ? 'edit' : 'Edited'}:`);
for (const path of edited) console.log(`  ${path}`);
console.log('\nNext steps (src/commands/AGENTS.md has the full checklist):');
steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
