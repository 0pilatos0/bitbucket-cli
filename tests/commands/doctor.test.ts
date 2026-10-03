import { beforeEach, describe, expect, it } from 'bun:test';
import {
  DoctorCommand,
  type DoctorCheck,
  type NetworkProbe,
} from '../../src/commands/doctor.command.js';
import type { UsersApi } from '../../src/generated/api.js';
import type { BBConfig } from '../../src/types/config.js';
import { APIError, BBError, ErrorCode } from '../../src/types/errors.js';
import {
  createMockConfigService,
  createMockContextService,
  createMockOutputService,
  mockUser,
} from '../setup.js';

const LOGGED_IN: BBConfig = { username: 'me@example.com', apiToken: 'token' };
const REPO = { workspace: 'acme', repoSlug: 'widgets' };

interface Setup {
  config?: BBConfig;
  configError?: Error;
  repo?: { workspace: string; repoSlug: string };
  probe?: NetworkProbe;
  userGet?: () => Promise<unknown>;
  bunVersion?: string;
}

function createCommand(setup: Setup = {}) {
  const configService = createMockConfigService(setup.config ?? LOGGED_IN);
  if (setup.configError) {
    const error = setup.configError;
    configService.getConfig = async () => {
      throw error;
    };
  }
  let userGetCalls = 0;
  const usersApi = {
    userGet: async () => {
      userGetCalls++;
      return setup.userGet
        ? setup.userGet()
        : {
            data: mockUser,
            headers: { 'x-oauth-scopes': 'read:user:bitbucket,  account' },
          };
    },
  } as unknown as UsersApi;
  const output = createMockOutputService();
  const command = new DoctorCommand(
    configService,
    createMockContextService(setup.repo ?? REPO),
    usersApi,
    output,
    setup.probe ?? (async () => 200),
    setup.bunVersion ?? '1.2.0'
  );
  return { command, output, userGetCalls: () => userGetCalls };
}

async function runJson(
  setup: Setup = {}
): Promise<{ ok: boolean; checks: DoctorCheck[]; userGetCalls: number }> {
  const { command, output, userGetCalls } = createCommand(setup);
  await command.execute(undefined, { globalOptions: { json: true } });
  const line = output.logs.find((log) => log.startsWith('json:'));
  return {
    ...(JSON.parse(line!.slice('json:'.length)) as {
      ok: boolean;
      checks: DoctorCheck[];
    }),
    userGetCalls: userGetCalls(),
  };
}

function byId(checks: DoctorCheck[], id: string): DoctorCheck | undefined {
  return checks.find((check) => check.id === id);
}

describe('DoctorCommand', () => {
  beforeEach(() => {
    process.exitCode = 0;
  });

  it('passes every check when logged in inside a Bitbucket repo', async () => {
    const result = await runJson();

    expect(result.ok).toBe(true);
    expect(result.checks.map((check) => [check.id, check.status])).toEqual([
      ['bun', 'pass'],
      ['config', 'pass'],
      ['network', 'pass'],
      ['auth', 'pass'],
      ['scopes', 'pass'],
      ['git', 'pass'],
    ]);
    expect(byId(result.checks, 'auth')?.message).toBe(
      `Logged in as ${mockUser.username} (API token)`
    );
    expect(byId(result.checks, 'scopes')?.message).toBe(
      'read:user:bitbucket, account'
    );
    expect(byId(result.checks, 'git')?.message).toBe('acme/widgets');
    expect(process.exitCode).toBe(0);
  });

  it('fails auth and exits 1 when not logged in', async () => {
    const result = await runJson({ config: {} });

    expect(result.ok).toBe(false);
    expect(byId(result.checks, 'auth')).toMatchObject({
      status: 'fail',
      message: 'Not logged in',
      hint: 'Run `bb auth login`',
    });
    expect(byId(result.checks, 'scopes')).toBeUndefined();
    expect(result.userGetCalls).toBe(0);
    expect(process.exitCode).toBe(1);
  });

  it('reports OAuth as the method for OAuth credentials', async () => {
    const result = await runJson({
      config: {
        authMethod: 'oauth',
        oauthAccessToken: 'access',
        oauthRefreshToken: 'refresh',
      },
    });

    expect(byId(result.checks, 'auth')?.message).toBe(
      `Logged in as ${mockUser.username} (OAuth)`
    );
  });

  it('skips credential verification when the network is unreachable', async () => {
    const result = await runJson({
      probe: async () => {
        throw new Error('connect ECONNREFUSED');
      },
    });

    expect(byId(result.checks, 'network')).toMatchObject({
      status: 'fail',
      message:
        'https://api.bitbucket.org/2.0 unreachable: connect ECONNREFUSED',
    });
    expect(byId(result.checks, 'auth')).toMatchObject({
      status: 'fail',
      message:
        'API token credentials found but not verified: network unreachable',
    });
    expect(result.userGetCalls).toBe(0);
    expect(process.exitCode).toBe(1);
  });

  it('counts any HTTP response as reachable', async () => {
    const result = await runJson({ probe: async () => 404 });

    expect(byId(result.checks, 'network')).toMatchObject({
      status: 'pass',
      message: 'https://api.bitbucket.org/2.0 reachable (HTTP 404)',
    });
  });

  it('fails auth with a login hint when Bitbucket rejects the credentials', async () => {
    const result = await runJson({
      userGet: async () => {
        throw new APIError('Unauthorized', 401);
      },
    });

    expect(byId(result.checks, 'auth')).toMatchObject({
      status: 'fail',
      message: 'API token credentials were rejected (HTTP 401)',
      hint: 'Run `bb auth login`',
    });
    expect(byId(result.checks, 'scopes')).toBeUndefined();
  });

  it('reports other verification errors without a login hint', async () => {
    const result = await runJson({
      userGet: async () => {
        throw new APIError('Service unavailable', 503);
      },
    });

    const auth = byId(result.checks, 'auth');
    expect(auth).toMatchObject({
      status: 'fail',
      message: 'Could not verify API token credentials: Service unavailable',
    });
    expect(auth?.hint).toBeUndefined();
  });

  it('warns without failing when Bitbucket reports no scopes', async () => {
    const result = await runJson({
      userGet: async () => ({ data: mockUser, headers: {} }),
    });

    expect(result.ok).toBe(true);
    expect(byId(result.checks, 'scopes')?.status).toBe('warn');
    expect(process.exitCode).toBe(0);
  });

  it('warns when no Bitbucket repository is detected', async () => {
    const result = await runJson({ repo: { workspace: '', repoSlug: '' } });

    expect(result.ok).toBe(true);
    expect(byId(result.checks, 'git')).toMatchObject({
      status: 'warn',
      message: expect.stringContaining('Not in a git repository.'),
    });
  });

  it('fails the config check and skips auth when the config is unreadable', async () => {
    const result = await runJson({
      configError: new BBError({
        code: ErrorCode.CONFIG_READ_FAILED,
        message: 'Config file has insecure permissions (644); expected 600.',
      }),
    });

    expect(byId(result.checks, 'config')).toMatchObject({
      status: 'fail',
      message: 'Config file has insecure permissions (644); expected 600.',
    });
    expect(byId(result.checks, 'auth')).toMatchObject({
      status: 'fail',
      message: 'Not checked: config is unreadable',
    });
    expect(result.userGetCalls).toBe(0);
  });

  it('notes a config file that does not exist yet', async () => {
    const result = await runJson();

    expect(byId(result.checks, 'config')?.message).toBe(
      '/tmp/test-config/config.json (not created yet)'
    );
  });

  it('fails the Bun check below the supported version', async () => {
    const result = await runJson({ bunVersion: '1.0.0' });

    expect(byId(result.checks, 'bun')).toMatchObject({
      status: 'fail',
      message: '1.0.0 (requires >=1.1.30)',
      hint: 'Upgrade Bun: `bun upgrade`',
    });
  });

  it('renders aligned rows, hints and a summary in text mode', async () => {
    const { command, output } = createCommand({ config: {} });
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs).toEqual([
      'text:✓ Bun         1.2.0 (requires >=1.1.30)',
      'text:✓ Config      /tmp/test-config/config.json (not created yet)',
      'text:✓ Network     https://api.bitbucket.org/2.0 reachable (HTTP 200)',
      'text:✗ Auth        Not logged in',
      'text:              Run `bb auth login`',
      'text:✓ Git remote  acme/widgets',
      'text:',
      'text:1 check failed',
    ]);
    expect(process.exitCode).toBe(1);
  });
});
