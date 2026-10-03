/**
 * Auth command tests
 */

import { describe, it, expect } from 'bun:test';
import { LoginCommand } from '../../src/commands/auth/login.command.js';
import { LogoutCommand } from '../../src/commands/auth/logout.command.js';
import { StatusCommand } from '../../src/commands/auth/status.command.js';
import { TokenCommand } from '../../src/commands/auth/token.command.js';
import { SwitchCommand } from '../../src/commands/auth/switch.command.js';
import { ErrorCode } from '../../src/types/errors.js';
import {
  createMockConfigService,
  createMockOutputService,
  createMockPromptService,
  mockUser,
} from '../setup.js';
import type { UsersApi } from '../../src/generated/api.js';
import type { OAuthService } from '../../src/services/oauth.service.js';
import type { ICredentialStore } from '../../src/core/interfaces/services.js';

// Helper to create mock UsersApi
function createMockUsersApi(user = mockUser): UsersApi {
  return {
    userGet: async () => ({ data: user }),
  } as unknown as UsersApi;
}

function createMockUsersApiError(message: string): UsersApi {
  return {
    userGet: async () => {
      throw new Error(message);
    },
  } as unknown as UsersApi;
}

// Restore an env var, deleting it if the original was unset. Plain assignment
// of `undefined` stringifies to "undefined" on Bun/Windows, which then leaks
// into later tests as a defined-but-bogus value.
function restoreEnv(key: string, original: string | undefined): void {
  if (original === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = original;
  }
}

// Stub the protected stdin read used by the `--with-token` flow so tests can
// feed a token without a real pipe.
function stubStdin(command: LoginCommand, token: string): void {
  (
    command as unknown as { readTokenFromStdin: () => Promise<string> }
  ).readTokenFromStdin = async () => token;
}

// `store` lets `authorize` save tokens the way the real service does.
function createMockOAuthService(store?: ICredentialStore): OAuthService {
  return {
    authorize: async () => {
      await store?.setOAuthCredentials({
        accessToken: 'oauth-access',
        refreshToken: 'oauth-refresh',
        expiresAt: 9999999999,
      });
      return {
        username: 'oauthuser',
        displayName: 'OAuth User',
        accountId: 'oauth-123',
      };
    },
    refreshAccessToken: async () => 'refreshed-token',
    revokeToken: async () => {},
    getValidAccessToken: async () => 'valid-token',
  } as unknown as OAuthService;
}

describe('LoginCommand', () => {
  it('should explain how to provide an email for API token login', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );

    await expect(
      command.execute({ appPassword: true }, { globalOptions: {} })
    ).rejects.toThrow(
      'Atlassian account email is required. Use --username or set BB_USERNAME to your email.'
    );
  });

  it('should fail when password is not provided for app-password flow', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );

    await expect(
      command.execute(
        { username: 'test', appPassword: true },
        { globalOptions: {} }
      )
    ).rejects.toThrow('API token is required');
  });

  it('should store credentials and return user on success with api token', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );
    await command.execute(
      { username: 'testuser', password: 'testpass' },
      { globalOptions: {} }
    );

    // Verify credentials were stored
    const creds = await configService.getCredentials();
    expect(creds.username).toBe('testuser');
    expect(creds.apiToken).toBe('testpass');

    expect(output.logs).toContain(
      `success:Logged in as ${mockUser.display_name} (${mockUser.username})`
    );
  });

  it('should use environment variables for credentials', async () => {
    const originalUsername = process.env.BB_USERNAME;
    const originalPassword = process.env.BB_API_TOKEN;

    process.env.BB_USERNAME = 'env@example.com';
    process.env.BB_API_TOKEN = 'envpass';

    try {
      const configService = createMockConfigService();
      const output = createMockOutputService();
      const usersApi = createMockUsersApi();
      const oauthService = createMockOAuthService();

      const command = new LoginCommand(
        configService,
        usersApi,
        oauthService,
        output
      );
      await command.execute({}, { globalOptions: {} });

      const creds = await configService.getCredentials();
      expect(creds.username).toBe('env@example.com');
    } finally {
      restoreEnv('BB_USERNAME', originalUsername);
      restoreEnv('BB_API_TOKEN', originalPassword);
    }
  });

  it('should output error message when authentication fails', async () => {
    const configService = createMockConfigService({
      defaultWorkspace: 'team-workspace',
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApiError('Invalid credentials');
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );

    await expect(
      command.run(
        { username: 'testuser', password: 'badpassword' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('Authentication failed: Invalid credentials');

    // Verify error message was output to user
    expect(output.logs).toContain(
      'error:Authentication failed: Invalid credentials'
    );

    // Verify credentials were cleared
    const config = await configService.getConfig();
    expect(config.accounts?.default).toBeUndefined();
    expect(config.defaultWorkspace).toBe('team-workspace');
  });

  it('should use OAuth flow when no flags are provided', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService(configService);

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain(
      'success:Logged in as OAuth User (oauthuser)'
    );
  });

  it('should use API token flow when --app-password flag is set', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );
    await command.execute(
      { appPassword: true, username: 'user', password: 'pass' },
      { globalOptions: {} }
    );

    const creds = await configService.getCredentials();
    expect(creds.username).toBe('user');
    expect(creds.apiToken).toBe('pass');
  });

  it('should use API token flow when -u flag is provided', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );

    // username without password should fail with API token validation
    await expect(
      command.execute({ username: 'user' }, { globalOptions: {} })
    ).rejects.toThrow('API token is required');
  });

  it('should use API token flow when BB_API_TOKEN env var is set', async () => {
    const originalToken = process.env.BB_API_TOKEN;
    const originalUsername = process.env.BB_USERNAME;

    process.env.BB_API_TOKEN = 'env-token';
    process.env.BB_USERNAME = 'env-user';

    try {
      const configService = createMockConfigService();
      const output = createMockOutputService();
      const usersApi = createMockUsersApi();
      const oauthService = createMockOAuthService();

      const command = new LoginCommand(
        configService,
        usersApi,
        oauthService,
        output
      );
      await command.execute({}, { globalOptions: {} });

      // Should have used API token flow, not OAuth
      const creds = await configService.getCredentials();
      expect(creds.username).toBe('env-user');
      expect(creds.apiToken).toBe('env-token');
    } finally {
      restoreEnv('BB_API_TOKEN', originalToken);
      restoreEnv('BB_USERNAME', originalUsername);
    }
  });

  it('should clear OAuth credentials when logging in with API token', async () => {
    const configService = createMockConfigService({
      authMethod: 'oauth',
      oauthAccessToken: 'old-access',
      oauthRefreshToken: 'old-refresh',
      oauthExpiresAt: 9999999999,
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );
    await command.execute(
      { username: 'newuser', password: 'newtoken' },
      { globalOptions: {} }
    );

    const account = (await configService.getConfig()).accounts?.default;
    expect(account?.oauthAccessToken).toBeUndefined();
    expect(account?.oauthRefreshToken).toBeUndefined();
    expect(account?.authMethod).toBe('basic');
    expect(account?.username).toBe('newuser');
  });

  it('should clear OAuth credentials when OAuth login fails', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = {
      ...createMockOAuthService(),
      authorize: async () => {
        throw new Error('OAuth failed');
      },
    } as unknown as OAuthService;

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );

    await expect(command.execute({}, { globalOptions: {} })).rejects.toThrow(
      'OAuth failed'
    );
  });

  it('should output JSON with method field for OAuth login', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService(configService);

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );
    await command.execute({}, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((l) => l.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.replace('json:', ''));
    expect(parsed.method).toBe('oauth');
    expect(parsed.authenticated).toBe(true);
    expect(parsed.user.username).toBe('oauthuser');
  });

  it('should output JSON with method field for API token login', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );
    await command.execute(
      { username: 'user', password: 'pass' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((l) => l.startsWith('json:'));
    const parsed = JSON.parse(jsonLog!.replace('json:', ''));
    expect(parsed.method).toBe('api_token');
  });

  it('should read the API token from stdin with --with-token', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );
    stubStdin(command, 'piped-token');

    await command.execute(
      { username: 'testuser', withToken: true },
      { globalOptions: {} }
    );

    const creds = await configService.getCredentials();
    expect(creds.username).toBe('testuser');
    expect(creds.apiToken).toBe('piped-token');
  });

  it('should trim surrounding whitespace from the stdin token', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );
    // A piped token typically arrives with a trailing newline from `echo`.
    stubStdin(command, '  piped-token\n');

    await command.execute(
      { username: 'testuser', withToken: true },
      { globalOptions: {} }
    );

    const creds = await configService.getCredentials();
    expect(creds.apiToken).toBe('piped-token');
  });

  it('should fail when stdin is empty for --with-token', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );
    stubStdin(command, '\n');

    await expect(
      command.execute(
        { username: 'testuser', withToken: true },
        { globalOptions: {} }
      )
    ).rejects.toThrow(
      'No API token found on stdin. Pipe a token, e.g. `echo "$BB_API_TOKEN" | bb auth login -u you@example.com --with-token`.'
    );
  });

  it('should reject combining --password with --with-token', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );
    stubStdin(command, 'piped-token');

    await expect(
      command.execute(
        { username: 'testuser', password: 'inline', withToken: true },
        { globalOptions: {} }
      )
    ).rejects.toThrow('Cannot combine --password with --with-token');
  });

  it('should require an Atlassian account email for --with-token', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = createMockOAuthService();

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );
    stubStdin(command, 'piped-token');

    await expect(
      command.execute({ withToken: true }, { globalOptions: {} })
    ).rejects.toThrow(
      'Atlassian account email is required. Use --username or set BB_USERNAME to your email.'
    );
  });

  it('should pass clientId and clientSecret to OAuth service', async () => {
    let receivedClientId: string | undefined;
    let receivedClientSecret: string | undefined;

    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();
    const oauthService = {
      authorize: async (cid?: string, cs?: string) => {
        receivedClientId = cid;
        receivedClientSecret = cs;
        await createMockOAuthService(configService).authorize();
        return {
          username: 'user',
          displayName: 'User',
          accountId: '123',
        };
      },
      refreshAccessToken: async () => 'token',
      revokeToken: async () => {},
      getValidAccessToken: async () => 'token',
    } as unknown as OAuthService;

    const command = new LoginCommand(
      configService,
      usersApi,
      oauthService,
      output
    );
    await command.execute(
      { clientId: 'my-id', clientSecret: 'my-secret' },
      { globalOptions: {} }
    );

    expect(receivedClientId).toBe('my-id');
    expect(receivedClientSecret).toBe('my-secret');
  });
});

describe('LogoutCommand', () => {
  it('should clear only credentials on logout (basic auth)', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
      defaultWorkspace: 'team-workspace',
    });
    const output = createMockOutputService();
    const oauthService = createMockOAuthService();

    const command = new LogoutCommand(configService, oauthService, output);
    await command.execute(undefined, { globalOptions: {} });

    // Verify only credentials were cleared
    const config = await configService.getConfig();
    expect(config.username).toBeUndefined();
    expect(config.apiToken).toBeUndefined();
    expect(config.accounts).toEqual({});
    expect(config.defaultWorkspace).toBe('team-workspace');

    expect(output.logs).toContain('success:Logged out of Bitbucket');
  });

  it('should clear OAuth credentials on logout (oauth)', async () => {
    const configService = createMockConfigService({
      authMethod: 'oauth',
      oauthAccessToken: 'access-token',
      oauthRefreshToken: 'refresh-token',
      oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      defaultWorkspace: 'team-workspace',
    });
    const output = createMockOutputService();
    const oauthService = createMockOAuthService();

    const command = new LogoutCommand(configService, oauthService, output);
    await command.execute(undefined, { globalOptions: {} });

    const config = await configService.getConfig();
    expect(config.oauthAccessToken).toBeUndefined();
    expect(config.oauthRefreshToken).toBeUndefined();
    expect(config.authMethod).toBeUndefined();
    expect(config.accounts).toEqual({});
    expect(config.defaultWorkspace).toBe('team-workspace');

    expect(output.logs).toContain('success:Logged out of Bitbucket');
  });

  it('should output JSON on logout', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
    });
    const output = createMockOutputService();
    const oauthService = createMockOAuthService();

    const command = new LogoutCommand(configService, oauthService, output);
    await command.execute(undefined, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((l) => l.startsWith('json:'));
    const parsed = JSON.parse(jsonLog!.replace('json:', ''));
    expect(parsed.authenticated).toBe(false);
    expect(parsed.success).toBe(true);
  });

  it('should call revokeToken for OAuth logout', async () => {
    let revokeCalled = false;
    const configService = createMockConfigService({
      authMethod: 'oauth',
      oauthAccessToken: 'token',
      oauthRefreshToken: 'refresh',
      oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    const output = createMockOutputService();
    const oauthService = {
      ...createMockOAuthService(),
      revokeToken: async () => {
        revokeCalled = true;
      },
    } as unknown as OAuthService;

    const command = new LogoutCommand(configService, oauthService, output);
    await command.execute(undefined, { globalOptions: {} });

    expect(revokeCalled).toBe(true);
  });

  it('should not call revokeToken for basic auth logout', async () => {
    let revokeCalled = false;
    const configService = createMockConfigService({
      username: 'user',
      apiToken: 'pass',
    });
    const output = createMockOutputService();
    const oauthService = {
      ...createMockOAuthService(),
      revokeToken: async () => {
        revokeCalled = true;
      },
    } as unknown as OAuthService;

    const command = new LogoutCommand(configService, oauthService, output);
    await command.execute(undefined, { globalOptions: {} });

    expect(revokeCalled).toBe(false);
  });
});

describe('StatusCommand', () => {
  it('should show not logged in when no credentials', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new StatusCommand(
      configService,
      configService,
      usersApi,
      output
    );
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('Not logged in'))).toBe(true);
  });

  it('should show logged in when credentials valid', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new StatusCommand(
      configService,
      configService,
      usersApi,
      output
    );
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs).toContain('success:Logged in to Bitbucket');
    expect(output.logs.some((log) => log.includes('testuser'))).toBe(true);
  });

  it('should show auth method in status', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new StatusCommand(
      configService,
      configService,
      usersApi,
      output
    );
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('API Token'))).toBe(true);
  });

  it('should show logged in when json flag is set', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new StatusCommand(
      configService,
      configService,
      usersApi,
      output
    );
    await command.execute(undefined, { globalOptions: { json: true } });

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });

  it('should show OAuth auth method for OAuth users', async () => {
    const configService = createMockConfigService({
      authMethod: 'oauth',
      oauthAccessToken: 'token',
      oauthRefreshToken: 'refresh',
      oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new StatusCommand(
      configService,
      configService,
      usersApi,
      output
    );
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('OAuth'))).toBe(true);
  });

  it('should show token expiry for OAuth users', async () => {
    const configService = createMockConfigService({
      authMethod: 'oauth',
      oauthAccessToken: 'token',
      oauthRefreshToken: 'refresh',
      oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new StatusCommand(
      configService,
      configService,
      usersApi,
      output
    );
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('Token expires'))).toBe(true);
  });

  it('should show expired message when OAuth token is expired', async () => {
    const configService = createMockConfigService({
      authMethod: 'oauth',
      oauthAccessToken: 'token',
      oauthRefreshToken: 'refresh',
      oauthExpiresAt: Math.floor(Date.now() / 1000) - 100,
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new StatusCommand(
      configService,
      configService,
      usersApi,
      output
    );
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('expired'))).toBe(true);
  });

  it('should include method in JSON output', async () => {
    const configService = createMockConfigService({
      authMethod: 'oauth',
      oauthAccessToken: 'token',
      oauthRefreshToken: 'refresh',
      oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new StatusCommand(
      configService,
      configService,
      usersApi,
      output
    );
    await command.execute(undefined, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((l) => l.startsWith('json:'));
    const parsed = JSON.parse(jsonLog!.replace('json:', ''));
    expect(parsed.method).toBe('oauth');
    expect(parsed.tokenExpiresAt).toBeDefined();
  });

  it('reports API-token credentials as method api_token in JSON output, like auth login', async () => {
    const configService = createMockConfigService({
      authMethod: 'basic',
      username: 'testuser',
      apiToken: 'testpass',
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new StatusCommand(
      configService,
      configService,
      usersApi,
      output
    );
    await command.execute(undefined, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((l) => l.startsWith('json:'));
    const parsed = JSON.parse(jsonLog!.replace('json:', ''));
    expect(parsed.method).toBe('api_token');
  });

  it('should show not logged in when json flag is set and no credentials', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new StatusCommand(
      configService,
      configService,
      usersApi,
      output
    );
    await command.execute(undefined, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((l) => l.startsWith('json:'));
    const parsed = JSON.parse(jsonLog!.replace('json:', ''));
    expect(parsed.authenticated).toBe(false);
  });

  it('should throw when credentials are invalid', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'badtoken',
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApiError('Unauthorized');

    const command = new StatusCommand(
      configService,
      configService,
      usersApi,
      output
    );

    await expect(
      command.execute(undefined, { globalOptions: {} })
    ).rejects.toThrow('invalid or expired');
  });
});

describe('TokenCommand', () => {
  it('should output base64 encoded token for basic auth', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
    });
    const output = createMockOutputService();
    const oauthService = createMockOAuthService();

    const command = new TokenCommand(configService, oauthService, output);
    await command.execute(undefined, { globalOptions: {} });

    const expectedToken = Buffer.from('testuser:testpass').toString('base64');
    expect(output.logs).toContain(`text:${expectedToken}`);
  });

  it('should output bearer token for oauth', async () => {
    const configService = createMockConfigService({
      authMethod: 'oauth',
      oauthAccessToken: 'access-token',
      oauthRefreshToken: 'refresh-token',
      oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    const output = createMockOutputService();
    const oauthService = createMockOAuthService();

    const command = new TokenCommand(configService, oauthService, output);
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs).toContain('text:valid-token');
  });

  it('should output json token when requested', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
    });
    const output = createMockOutputService();
    const oauthService = createMockOAuthService();

    const command = new TokenCommand(configService, oauthService, output);
    await command.execute(undefined, { globalOptions: { json: true } });

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });

  it('should fail when not logged in', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const oauthService = createMockOAuthService();

    const command = new TokenCommand(configService, oauthService, output);

    await expect(
      command.execute(undefined, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should output JSON with type basic for API token', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
    });
    const output = createMockOutputService();
    const oauthService = createMockOAuthService();

    const command = new TokenCommand(configService, oauthService, output);
    await command.execute(undefined, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((l) => l.startsWith('json:'));
    const parsed = JSON.parse(jsonLog!.replace('json:', ''));
    expect(parsed.type).toBe('basic');
    expect(parsed.token).toBeDefined();
  });

  it('should output JSON with type bearer for OAuth', async () => {
    const configService = createMockConfigService({
      authMethod: 'oauth',
      oauthAccessToken: 'access-token',
      oauthRefreshToken: 'refresh-token',
      oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    const output = createMockOutputService();
    const oauthService = createMockOAuthService();

    const command = new TokenCommand(configService, oauthService, output);
    await command.execute(undefined, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((l) => l.startsWith('json:'));
    const parsed = JSON.parse(jsonLog!.replace('json:', ''));
    expect(parsed.type).toBe('bearer');
    expect(parsed.token).toBe('valid-token');
  });

  it('should call getValidAccessToken which handles refresh for OAuth', async () => {
    let getValidCalled = false;
    const configService = createMockConfigService({
      authMethod: 'oauth',
      oauthAccessToken: 'token',
      oauthRefreshToken: 'refresh',
      oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    const output = createMockOutputService();
    const oauthService = {
      ...createMockOAuthService(),
      getValidAccessToken: async () => {
        getValidCalled = true;
        return 'fresh-token';
      },
    } as unknown as OAuthService;

    const command = new TokenCommand(configService, oauthService, output);
    await command.execute(undefined, { globalOptions: {} });

    expect(getValidCalled).toBe(true);
    expect(output.logs).toContain('text:fresh-token');
  });
});

describe('multiple accounts', () => {
  const TWO_ACCOUNTS = {
    activeAccount: 'work',
    accounts: {
      work: {
        authMethod: 'basic' as const,
        username: 'w@x.com',
        apiToken: 'w',
      },
      personal: {
        authMethod: 'basic' as const,
        username: 'p@y.com',
        apiToken: 'p',
      },
    },
  };

  it('login --account adds the account and makes it active', async () => {
    const configService = createMockConfigService(TWO_ACCOUNTS);
    const output = createMockOutputService();
    configService.useAccount('ci');

    const command = new LoginCommand(
      configService,
      createMockUsersApi(),
      createMockOAuthService(),
      output
    );
    await command.execute(
      { username: 'ci@z.com', password: 'c' },
      { globalOptions: {} }
    );

    const config = await configService.getConfig();
    expect(config.activeAccount).toBe('ci');
    expect(Object.keys(config.accounts ?? {})).toEqual([
      'work',
      'personal',
      'ci',
    ]);
    expect(output.logs).toContain('text:  Active account: ci');
  });

  it('login reports the account in JSON', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new LoginCommand(
      configService,
      createMockUsersApi(),
      createMockOAuthService(),
      output
    );
    await command.execute(
      { username: 'u@x.com', password: 't' },
      { globalOptions: { json: true } }
    );

    expect(JSON.parse(output.logs[0]!.replace(/^json:/, ''))).toMatchObject({
      authenticated: true,
      method: 'api_token',
      account: 'default',
    });
  });

  it('logout of the active account switches to another saved account', async () => {
    const configService = createMockConfigService(TWO_ACCOUNTS);
    const output = createMockOutputService();

    const command = new LogoutCommand(
      configService,
      createMockOAuthService(),
      output
    );
    await command.execute(undefined, { globalOptions: {} });

    const config = await configService.getConfig();
    expect(Object.keys(config.accounts ?? {})).toEqual(['personal']);
    expect(config.activeAccount).toBe('personal');
    expect(output.logs).toContain('text:  Active account is now personal');
  });

  it('logout of a non-active account keeps the active one', async () => {
    const configService = createMockConfigService(TWO_ACCOUNTS);
    const output = createMockOutputService();
    configService.useAccount('personal');

    const command = new LogoutCommand(
      configService,
      createMockOAuthService(),
      output
    );
    await command.execute(undefined, { globalOptions: { json: true } });

    const config = await configService.getConfig();
    expect(config.activeAccount).toBe('work');
    expect(output.logs[0]).toContain('"account":"personal"');
    expect(output.logs[0]).not.toContain('switchedTo');
  });

  it('status names the account and lists the others', async () => {
    const configService = createMockConfigService(TWO_ACCOUNTS);
    const output = createMockOutputService();

    const command = new StatusCommand(
      configService,
      configService,
      createMockUsersApi(),
      output
    );
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs).toContain('text:  Account: work');
    expect(
      output.logs.some((log) => log.includes('Other accounts: personal'))
    ).toBe(true);
  });

  it('status points a missing account at login --account', async () => {
    const configService = createMockConfigService(TWO_ACCOUNTS);
    const output = createMockOutputService();
    configService.useAccount('ci');

    const command = new StatusCommand(
      configService,
      configService,
      createMockUsersApi(),
      output
    );
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs).toContain("info:Not logged in to account 'ci'");
    expect(
      output.logs.some((log) => log.includes('bb auth login --account ci'))
    ).toBe(true);
  });

  it('status --json reports the current and saved accounts', async () => {
    const configService = createMockConfigService(TWO_ACCOUNTS);
    const output = createMockOutputService();
    configService.useAccount('personal');

    const command = new StatusCommand(
      configService,
      configService,
      createMockUsersApi(),
      output
    );
    await command.execute(undefined, { globalOptions: { json: true } });

    expect(JSON.parse(output.logs[0]!.replace(/^json:/, ''))).toMatchObject({
      authenticated: true,
      account: 'personal',
      accounts: ['work', 'personal'],
    });
  });
});

describe('SwitchCommand', () => {
  const TWO_ACCOUNTS = {
    activeAccount: 'work',
    accounts: {
      work: { username: 'w@x.com', apiToken: 'w' },
      personal: { username: 'p@y.com', apiToken: 'p' },
    },
  };

  it('switches to the named account', async () => {
    const configService = createMockConfigService(TWO_ACCOUNTS);
    const output = createMockOutputService();

    await new SwitchCommand(configService, output).execute(
      { account: 'personal' },
      { globalOptions: {} }
    );

    expect((await configService.getConfig()).activeAccount).toBe('personal');
    expect(output.logs).toContain('success:Switched to account personal');
  });

  it('asks which account when none is given in a terminal', async () => {
    const configService = createMockConfigService(TWO_ACCOUNTS);
    const prompt = createMockPromptService(['personal']);

    await new SwitchCommand(configService, createMockOutputService()).execute(
      {},
      { globalOptions: {}, prompt }
    );

    expect(prompt.calls).toEqual(['select:Which account should be active?']);
    expect((await configService.getConfig()).activeAccount).toBe('personal');
  });

  it('lists the saved accounts when none is given without a terminal', async () => {
    const command = new SwitchCommand(
      createMockConfigService(TWO_ACCOUNTS),
      createMockOutputService()
    );

    await expect(
      command.execute({}, { globalOptions: {} })
    ).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_REQUIRED,
      message: 'Account name is required. Saved accounts: work, personal.',
    });
  });

  it('requires a saved account', async () => {
    const command = new SwitchCommand(
      createMockConfigService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ account: 'work' }, { globalOptions: {} })
    ).rejects.toMatchObject({ code: ErrorCode.AUTH_REQUIRED });
  });
});
