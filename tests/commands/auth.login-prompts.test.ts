import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { APIError, ErrorCode } from '../../src/types/errors.js';
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

const MOCK_OAUTH_TOKENS = {
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresAt: 9999999999,
};

function buildLogin() {
  const configService = createMockConfigService();
  let oauthCalls = 0;
  const oauthService = {
    authorize: async () => {
      oauthCalls++;
      await configService.setOAuthCredentials(MOCK_OAUTH_TOKENS);
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

    await command.execute({}, { globalOptions: {}, interactive: true, prompt });

    expect(prompt.calls).toEqual([
      'select:How would you like to authenticate?',
    ]);
    expect(oauthCalls()).toBe(1);
  });

  it('asks for Atlassian account email and token when API token is picked', async () => {
    const prompt = createMockPromptService([
      'api_token',
      'prompt@example.com',
      'prompttoken',
    ]);
    const { command, configService, oauthCalls } = buildLogin();

    await command.execute({}, { globalOptions: {}, interactive: true, prompt });

    expect(prompt.calls).toEqual([
      'select:How would you like to authenticate?',
      'text:Atlassian account email',
      'secret:API token',
    ]);
    expect(oauthCalls()).toBe(0);
    expect(await configService.getCredentials()).toEqual({
      username: 'prompt@example.com',
      apiToken: 'prompttoken',
    });
  });

  for (const statusCode of [401, 403]) {
    it(`guides API token users to verify their email after HTTP ${statusCode}`, async () => {
      const configService = createMockConfigService();
      const usersApi = {
        userGet: async () => {
          throw new APIError('Access denied', statusCode);
        },
      } as unknown as UsersApi;
      const command = new LoginCommand(
        configService,
        usersApi,
        {} as OAuthService,
        createMockOutputService()
      );

      const error = await command
        .execute(
          { username: 'you@example.com', password: 'test-token' },
          { globalOptions: {} }
        )
        .catch((error: unknown) => error);

      expect(error).toMatchObject({
        code: ErrorCode.AUTH_INVALID,
        message:
          'Invalid email or token: Access denied. Verify your Atlassian account email and that the API token is current and has the required scopes.',
      });
      expect(await configService.getConfig()).not.toHaveProperty('username');
      expect(await configService.getConfig()).not.toHaveProperty('apiToken');
    });
  }

  it('only asks for the token when --username is given', async () => {
    const prompt = createMockPromptService(['prompttoken']);
    const { command, configService } = buildLogin();

    await command.execute(
      { username: 'flag@example.com' },
      { globalOptions: {}, interactive: true, prompt }
    );

    expect(prompt.calls).toEqual(['secret:API token']);
    expect(await configService.getCredentials()).toEqual({
      username: 'flag@example.com',
      apiToken: 'prompttoken',
    });
  });

  it('still rejects an empty prompted token', async () => {
    const prompt = createMockPromptService(['']);
    const { command } = buildLogin();

    await expect(
      command.execute(
        { username: 'flag@example.com' },
        { globalOptions: {}, interactive: true, prompt }
      )
    ).rejects.toThrow('API token is required.');
  });

  it('does not ask for the method when an OAuth client flag is given', async () => {
    const prompt = createMockPromptService();
    const { command, oauthCalls } = buildLogin();

    await command.execute(
      { clientId: 'my-client' },
      { globalOptions: {}, interactive: true, prompt }
    );

    expect(prompt.calls).toEqual([]);
    expect(oauthCalls()).toBe(1);
  });

  it('does not prompt when username and password flags are given', async () => {
    const prompt = createMockPromptService();
    const { command } = buildLogin();

    await command.execute(
      { username: 'flag@example.com', password: 'flagtoken' },
      { globalOptions: {}, interactive: true, prompt }
    );

    expect(prompt.calls).toEqual([]);
  });

  it('keeps the flag-only behavior without a prompt', async () => {
    const { command, oauthCalls } = buildLogin();

    await command.execute({}, { globalOptions: {}, interactive: true });
    await expect(
      command.execute({ username: 'flag@example.com' }, { globalOptions: {} })
    ).rejects.toThrow('API token is required.');

    expect(oauthCalls()).toBe(1);
  });

  it.each([
    ['no flags', {}],
    ['OAuth client flags', { clientId: 'id', clientSecret: 'secret' }],
  ])(
    'fails fast instead of opening a browser outside an interactive terminal (%s)',
    async (_label, options) => {
      const { command, oauthCalls } = buildLogin();

      const error = await command
        .execute(options, { globalOptions: { json: true } })
        .catch((e: unknown) => e);

      expect(error).toMatchObject({
        code: ErrorCode.AUTH_REQUIRED,
        message: expect.stringContaining('BB_API_TOKEN'),
      });
      expect(oauthCalls()).toBe(0);
    }
  );

  it('uses BB_API_TOKEN outside an interactive terminal', async () => {
    process.env.BB_USERNAME = 'env@example.com';
    process.env.BB_API_TOKEN = 'envtoken';
    const { command, configService, oauthCalls } = buildLogin();

    await command.execute({}, { globalOptions: {} });

    expect(oauthCalls()).toBe(0);
    expect(await configService.getCredentials()).toEqual({
      username: 'env@example.com',
      apiToken: 'envtoken',
    });
  });
});
