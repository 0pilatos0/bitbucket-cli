import { describe, it, expect } from 'bun:test';
import { Command } from 'commander';
import { registerCommands } from '../../src/commands/register.js';
import { ServiceTokens } from '../../src/core/container.js';
import type { ServiceToken } from '../../src/core/container.js';
import type {
  CommandRegistrar,
  ContextOptions,
} from '../../src/core/command-registrar.js';
import { createHelpTextBuilder } from '../../src/help-text.js';

interface Dispatch {
  via: 'run' | 'runWithGlobalOptions';
  token: ServiceToken;
  options: unknown;
  contextOptions?: ContextOptions;
}

function buildProgram(): { program: Command; dispatches: Dispatch[] } {
  const dispatches: Dispatch[] = [];
  const registrar: CommandRegistrar = {
    buildHelpText: createHelpTextBuilder(true),
    run: async (token, options) => {
      dispatches.push({ via: 'run', token, options });
    },
    runWithGlobalOptions: async (token, options, contextOptions) => {
      dispatches.push({
        via: 'runWithGlobalOptions',
        token,
        options,
        contextOptions,
      });
    },
  };
  const program = new Command('bb').exitOverride();
  registerCommands(program, registrar);
  return { program, dispatches };
}

async function dispatch(argv: string[]): Promise<Dispatch> {
  const { program, dispatches } = buildProgram();
  await program.parseAsync(argv, { from: 'user' });
  expect(dispatches).toHaveLength(1);
  return dispatches[0] as Dispatch;
}

function leafPaths(command: Command, prefix: string[] = []): string[][] {
  return command.commands.flatMap((child) => {
    const path = [...prefix, child.name()];
    return child.commands.length ? leafPaths(child, path) : [path];
  });
}

function findCommand(root: Command, path: string[]): Command {
  let node = root;
  for (const name of path) {
    const next = node.commands.find((c) => c.name() === name);
    if (!next) throw new Error(`no command at ${path.join(' ')}`);
    node = next;
  }
  return node;
}

describe('registerCommands', () => {
  it('registers the top-level commands in help order', () => {
    const { program } = buildProgram();
    expect(program.commands.map((c) => c.name())).toEqual([
      'auth',
      'repo',
      'pr',
      'snippet',
      'pipeline',
      'commit',
      'status',
      'workspace',
      'project',
      'browse',
      'api',
      'alias',
      'config',
      'completion',
    ]);
  });

  it('wires every DI command token to exactly one CLI command', async () => {
    const { program } = buildProgram();
    const tokensByPath = new Map<string, ServiceToken>();

    for (const path of leafPaths(program)) {
      const args = findCommand(program, path)
        .registeredArguments.filter((arg) => arg.required)
        .map((arg) => `${arg.name()}-value`);
      const { token } = await dispatch([...path, ...args]);
      tokensByPath.set(path.join(' '), token);
    }

    const dispatched = [...tokensByPath.values()];
    const commandTokens = Object.values(ServiceTokens).filter((token) =>
      token.endsWith('Command')
    );
    expect(new Set(dispatched).size).toBe(dispatched.length);
    expect([...dispatched].sort()).toEqual([...commandTokens].sort());
  });

  it('passes local-only commands their options without global merging', async () => {
    expect(await dispatch(['auth', 'logout'])).toEqual({
      via: 'run',
      token: ServiceTokens.LogoutCommand,
      options: undefined,
    });
    expect(
      await dispatch(['config', 'set', 'skipVersionCheck', 'true'])
    ).toEqual({
      via: 'run',
      token: ServiceTokens.SetConfigCommand,
      options: { key: 'skipVersionCheck', value: 'true' },
    });
    expect(await dispatch(['repo', 'clone', 'ws/repo', '-d', 'dir'])).toEqual({
      via: 'run',
      token: ServiceTokens.CloneCommand,
      options: { repository: 'ws/repo', directory: 'dir' },
    });
  });

  it('maps positional arguments onto the option names commands expect', async () => {
    expect(
      (await dispatch(['pr', 'reviewers', 'add', '42', 'someone'])).options
    ).toEqual({ id: '42', username: 'someone' });
    expect(
      (await dispatch(['repo', 'default-reviewers', 'remove', 'someone', '-y']))
        .options
    ).toEqual({ username: 'someone', yes: true });
    expect(
      (await dispatch(['pr', 'comments', 'edit', '42', '7', 'updated'])).options
    ).toEqual({ prId: '42', commentId: '7', message: 'updated' });
  });

  it('applies declared option defaults and repeatable collectors', async () => {
    expect(await dispatch(['pr', 'list'])).toEqual({
      via: 'runWithGlobalOptions',
      token: ServiceTokens.ListPRsCommand,
      options: { state: 'OPEN', limit: '25' },
      contextOptions: undefined,
    });
    expect(
      (
        await dispatch([
          'pr',
          'create',
          '--reviewer',
          'a',
          '--reviewer',
          'b',
          '--draft',
        ])
      ).options
    ).toEqual({ reviewer: ['a', 'b'], draft: true });
  });

  it('resolves the snippet comment message from the positional or -m', async () => {
    expect(
      (await dispatch(['snippet', 'comments', 'add', 'kypj', '-m', 'flag']))
        .options
    ).toEqual({ id: 'kypj', message: 'flag' });
    expect(
      (
        await dispatch([
          'snippet',
          'comments',
          'add',
          'kypj',
          'positional',
          '-m',
          'flag',
        ])
      ).options
    ).toEqual({ id: 'kypj', message: 'positional' });
  });

  it('lets bb api use --jq without --json', async () => {
    expect(await dispatch(['api', 'GET', '/user', '-H', 'X-A:1'])).toEqual({
      via: 'runWithGlobalOptions',
      token: ServiceTokens.ApiCommand,
      options: {
        methodOrEndpoint: 'GET',
        endpoint: '/user',
        rawField: [],
        field: [],
        header: ['X-A:1'],
      },
      contextOptions: { allowJqWithoutJson: true },
    });
  });
});
