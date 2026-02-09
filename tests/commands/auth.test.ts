/**
 * Auth command tests
 */

import { describe, it, expect } from 'bun:test';
import { LoginCommand } from '../../src/commands/auth/login.command.js';
import { LogoutCommand } from '../../src/commands/auth/logout.command.js';
import { StatusCommand } from '../../src/commands/auth/status.command.js';
import { TokenCommand } from '../../src/commands/auth/token.command.js';
import {
  createMockConfigService,
  createMockOutputService,
  mockUser,
} from '../setup.js';
import type { UsersApi } from '../../src/generated/api.js';

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

describe('LoginCommand', () => {
  it('should fail when username is not provided', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new LoginCommand(configService, usersApi, output);

    await expect(command.execute({}, { globalOptions: {} })).rejects.toThrow(
      'Username is required'
    );
  });

  it('should fail when password is not provided', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new LoginCommand(configService, usersApi, output);

    await expect(
      command.execute({ username: 'test' }, { globalOptions: {} })
    ).rejects.toThrow('API token is required');
  });

  it('should store credentials and return user on success', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new LoginCommand(configService, usersApi, output);
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

    process.env.BB_USERNAME = 'envuser';
    process.env.BB_API_TOKEN = 'envpass';

    try {
      const configService = createMockConfigService();
      const output = createMockOutputService();
      const usersApi = createMockUsersApi();

      const command = new LoginCommand(configService, usersApi, output);
      await command.execute({}, { globalOptions: {} });

      const creds = await configService.getCredentials();
      expect(creds.username).toBe('envuser');
    } finally {
      process.env.BB_USERNAME = originalUsername;
      process.env.BB_API_TOKEN = originalPassword;
    }
  });

  it('should output error message when authentication fails', async () => {
    const configService = createMockConfigService({
      defaultWorkspace: 'team-workspace',
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApiError('Invalid credentials');

    const command = new LoginCommand(configService, usersApi, output);

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
    expect(config.username).toBeUndefined();
    expect(config.apiToken).toBeUndefined();
    expect(config.defaultWorkspace).toBe('team-workspace');
  });
});

describe('LogoutCommand', () => {
  it('should clear only credentials on logout', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
      defaultWorkspace: 'team-workspace',
    });
    const output = createMockOutputService();

    const command = new LogoutCommand(configService, output);
    await command.execute(undefined, { globalOptions: {} });

    // Verify only credentials were cleared
    const config = await configService.getConfig();
    expect(config.username).toBeUndefined();
    expect(config.apiToken).toBeUndefined();
    expect(config.defaultWorkspace).toBe('team-workspace');

    expect(output.logs).toContain('success:Logged out of Bitbucket');
  });
});

describe('StatusCommand', () => {
  it('should show not logged in when no credentials', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new StatusCommand(configService, usersApi, output);
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

    const command = new StatusCommand(configService, usersApi, output);
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs).toContain('success:Logged in to Bitbucket');
    expect(output.logs.some((log) => log.includes('testuser'))).toBe(true);
  });

  it('should show logged in when json flag is set', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApi();

    const command = new StatusCommand(configService, usersApi, output);
    await command.execute(undefined, { globalOptions: { json: true } });

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });
});

describe('TokenCommand', () => {
  it('should output base64 encoded token', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
    });
    const output = createMockOutputService();

    const command = new TokenCommand(configService, output);
    await command.execute(undefined, { globalOptions: {} });

    const expectedToken = Buffer.from('testuser:testpass').toString('base64');
    expect(output.logs).toContain(`text:${expectedToken}`);
  });

  it('should output json token when requested', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
    });
    const output = createMockOutputService();

    const command = new TokenCommand(configService, output);
    await command.execute(undefined, { globalOptions: { json: true } });

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });

  it('should fail when not logged in', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new TokenCommand(configService, output);

    await expect(
      command.execute(undefined, { globalOptions: {} })
    ).rejects.toThrow();
  });
});
