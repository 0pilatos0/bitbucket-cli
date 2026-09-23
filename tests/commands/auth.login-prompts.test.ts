import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { LoginCommand } from '../../src/commands/auth/login.command.js';
import {
  createMockConfigService,
  createMockOutputService,
  createMockPromptService,
  mockUser,
} from '../setup.js';
import type { UsersApi } from '../../src/generated/api.js';
import type { OAuthService } from '../../src/services/oauth.service.js';

const ENV_KEYS = ['BB_USERNAME', 'BB_API_TOKEN'] as const;

function buildLogin() {
  const configService = createMockConfigService();
  let oauthCalls = 0;
  const oauthService = {
    authorize: async () => {
      oauthCalls++;
      return {
        username: 'oauthuser',
        displayName: 'OAuth User',
        accountId: 'oauth-123',
      };
    },
  } as unknown as OAuthService;
  const usersApi = {
    userGet: async () => ({ data: mockUser }),
  } as unknown as UsersApi;
  const command = new LoginCommand(
    configService,
    usersApi,
    oauthService,
    createMockOutputService()
  );
  return { command, configService, oauthCalls: () => oauthCalls };
}

describe('LoginCommand interactive prompts', () => {
  const originalEnv: Partial<Record<string, string>> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = originalEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('asks for the method and uses OAuth when picked', async () => {
    const prompt = createMockPromptService(['oauth']);
    const { command, oauthCalls } = buildLogin();

    await command.execute({}, { globalOptions: {}, prompt });

    expect(prompt.calls).toEqual([
      'select:How would you like to authenticate?',
    ]);
    expect(oauthCalls()).toBe(1);
  });

  it('asks for username and token when API token is picked', async () => {
    const prompt = createMockPromptService([
      'api_token',
      'promptuser',
      'prompttoken',
    ]);
    const { command, configService, oauthCalls } = buildLogin();

    await command.execute({}, { globalOptions: {}, prompt });

    expect(prompt.calls).toEqual([
      'select:How would you like to authenticate?',
      'text:Bitbucket username',
      'secret:API token',
    ]);
    expect(oauthCalls()).toBe(0);
    expect(await configService.getCredentials()).toEqual({
      username: 'promptuser',
      apiToken: 'prompttoken',
    });
  });

  it('only asks for the token when --username is given', async () => {
    const prompt = createMockPromptService(['prompttoken']);
    const { command, configService } = buildLogin();

    await command.execute(
      { username: 'flaguser' },
      { globalOptions: {}, prompt }
    );

    expect(prompt.calls).toEqual(['secret:API token']);
    expect(await configService.getCredentials()).toEqual({
      username: 'flaguser',
      apiToken: 'prompttoken',
    });
  });

  it('still rejects an empty prompted token', async () => {
    const prompt = createMockPromptService(['']);
    const { command } = buildLogin();

    await expect(
      command.execute({ username: 'flaguser' }, { globalOptions: {}, prompt })
    ).rejects.toThrow('API token is required.');
  });

  it('does not ask for the method when an OAuth client flag is given', async () => {
    const prompt = createMockPromptService();
    const { command, oauthCalls } = buildLogin();

    await command.execute(
      { clientId: 'my-client' },
      { globalOptions: {}, prompt }
    );

    expect(prompt.calls).toEqual([]);
    expect(oauthCalls()).toBe(1);
  });

  it('does not prompt when username and password flags are given', async () => {
    const prompt = createMockPromptService();
    const { command } = buildLogin();

    await command.execute(
      { username: 'flaguser', password: 'flagtoken' },
      { globalOptions: {}, prompt }
    );

    expect(prompt.calls).toEqual([]);
  });

  it('keeps the flag-only behavior without a prompt', async () => {
    const { command, oauthCalls } = buildLogin();

    await command.execute({}, { globalOptions: {} });
    await expect(
      command.execute({ username: 'flaguser' }, { globalOptions: {} })
    ).rejects.toThrow('API token is required.');

    expect(oauthCalls()).toBe(1);
  });
});
