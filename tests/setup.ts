/**
 * Test setup and utilities
 */

import { beforeEach, afterEach } from 'bun:test';
import axios, {
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';
import { Container } from '../src/core/container.js';
import { ContextService } from '../src/services/context.service.js';
import type { OAuthService } from '../src/services/oauth.service.js';
import type {
  IConfigService,
  ICredentialStore,
  IGitService,
  IContextService,
  IOutputService,
  ISpinner,
} from '../src/core/interfaces/services.js';
import type { BBError } from '../src/types/errors.js';
import type {
  BBConfig,
  AuthCredentials,
  OAuthCredentials,
  AuthMethod,
  RepoContext,
  GlobalOptions,
} from '../src/types/config.js';

const originalNodeEnv = process.env.NODE_ENV;
const originalSetTimeout = globalThis.setTimeout;

// Reset container before each test
beforeEach(() => {
  Container.reset();
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  Container.reset();
  process.exitCode = 0;
  if (originalNodeEnv !== undefined) {
    process.env.NODE_ENV = originalNodeEnv;
  } else {
    delete process.env.NODE_ENV;
  }
});

/**
 * Mock factories
 */

/**
 * Returns an object satisfying both `IConfigService` and `ICredentialStore`
 * with shared in-memory state, mirroring the production `ConfigService` class
 * that backs both interfaces. Tests that only need one interface can still
 * pass this (widening is fine); tests that want a narrower mock should reach
 * for `createMockConfigServiceOnly` or `createMockCredentialStoreOnly`.
 */
export function createMockConfigService(
  config: BBConfig = {}
): IConfigService & ICredentialStore {
  let currentConfig = { ...config };

  return {
    async getConfig() {
      return currentConfig;
    },
    async getCredentials(): Promise<AuthCredentials> {
      if (!currentConfig.username || !currentConfig.apiToken) {
        throw {
          code: 1001,
          message: 'Auth required',
        } as BBError;
      }
      return {
        username: currentConfig.username,
        apiToken: currentConfig.apiToken,
      };
    },
    async setCredentials(creds: AuthCredentials) {
      currentConfig.authMethod = 'basic';
      currentConfig.username = creds.username;
      currentConfig.apiToken = creds.apiToken;
    },
    async clearCredentials() {
      const {
        username: _username,
        apiToken: _apiToken,
        ...rest
      } = currentConfig;
      currentConfig = rest;
    },
    async clearConfig() {
      currentConfig = {};
    },
    async getValue<K extends keyof BBConfig>(
      key: K
    ): Promise<BBConfig[K] | undefined> {
      return currentConfig[key];
    },
    async setValue<K extends keyof BBConfig>(key: K, value: BBConfig[K]) {
      currentConfig[key] = value;
    },
    getConfigPath() {
      return '/tmp/test-config/config.json';
    },
    async getAuthMethod(): Promise<AuthMethod> {
      return (currentConfig.authMethod as AuthMethod) ?? 'basic';
    },
    async getOAuthCredentials(): Promise<OAuthCredentials> {
      if (
        !currentConfig.oauthAccessToken ||
        !currentConfig.oauthRefreshToken ||
        !currentConfig.oauthExpiresAt
      ) {
        throw { code: 1001, message: 'OAuth auth required' } as BBError;
      }
      return {
        accessToken: currentConfig.oauthAccessToken,
        refreshToken: currentConfig.oauthRefreshToken,
        expiresAt: currentConfig.oauthExpiresAt,
      };
    },
    async setOAuthCredentials(creds: OAuthCredentials) {
      const { username: _u, apiToken: _t, ...rest } = currentConfig;
      currentConfig = {
        ...rest,
        authMethod: 'oauth',
        oauthAccessToken: creds.accessToken,
        oauthRefreshToken: creds.refreshToken,
        oauthExpiresAt: creds.expiresAt,
      };
    },
    async clearOAuthCredentials() {
      const {
        authMethod: _am,
        oauthAccessToken: _at,
        oauthRefreshToken: _rt,
        oauthExpiresAt: _ea,
        oauthClientId: _ci,
        oauthClientSecret: _cs,
        ...rest
      } = currentConfig;
      currentConfig = rest;
    },
    async isOAuthTokenExpired(): Promise<boolean> {
      if (!currentConfig.oauthExpiresAt) return true;
      return Date.now() >= (currentConfig.oauthExpiresAt - 60) * 1000;
    },
  };
}

/**
 * Narrow factory returning only the app-config surface. Prefer this in tests
 * that don't touch credentials — it documents the dependency more precisely
 * and won't satisfy code that wrongly reaches for credential methods.
 */
export function createMockConfigServiceOnly(
  config: BBConfig = {}
): IConfigService {
  const { getConfig, clearConfig, getValue, setValue, getConfigPath } =
    createMockConfigService(config);
  return { getConfig, clearConfig, getValue, setValue, getConfigPath };
}

/**
 * Narrow factory returning only the credential-store surface.
 */
export function createMockCredentialStoreOnly(
  config: BBConfig = {}
): ICredentialStore {
  const {
    getAuthMethod,
    getCredentials,
    setCredentials,
    clearCredentials,
    getOAuthCredentials,
    setOAuthCredentials,
    clearOAuthCredentials,
    isOAuthTokenExpired,
  } = createMockConfigService(config);
  return {
    getAuthMethod,
    getCredentials,
    setCredentials,
    clearCredentials,
    getOAuthCredentials,
    setOAuthCredentials,
    clearOAuthCredentials,
    isOAuthTokenExpired,
  };
}

export function createMockGitService(
  options: {
    isRepo?: boolean;
    currentBranch?: string;
    currentCommit?: string;
    remoteUrl?: string;
    throwOnGetCurrentBranch?: boolean;
  } = {}
): IGitService {
  return {
    async isRepository() {
      return options.isRepo ?? false;
    },
    async clone() {
      // Mock implementation
    },
    async fetch() {
      // Mock implementation
    },
    async checkout() {
      // Mock implementation
    },
    async checkoutNewBranch() {
      // Mock implementation
    },
    async getCurrentBranch() {
      if (options.throwOnGetCurrentBranch) {
        throw { code: 3002, message: 'Not a git repo' } as BBError;
      }
      return options.currentBranch ?? 'main';
    },
    async getCurrentCommit() {
      return (
        options.currentCommit ?? 'abcdef0123456789abcdef0123456789abcdef01'
      );
    },
    async getRemoteUrl() {
      if (options.remoteUrl) {
        return options.remoteUrl;
      }
      throw { code: 3003, message: 'No remote' } as BBError;
    },
  };
}

/**
 * Build a real `ContextService` backed by mock git/config services. The
 * `workspace` + `repoSlug` pair drives `getRepoContextFromGit()` via a faked
 * bitbucket remote; `defaultWorkspace` drives the `requireWorkspace()` and
 * `getRepoContext()` config fallbacks. Tests that need full control over the
 * underlying services can construct `ContextService` directly instead.
 */
export function createMockContextService(
  options: {
    workspace?: string;
    repoSlug?: string;
    defaultWorkspace?: string;
  } = {}
): IContextService {
  const hasRemote = !!(options.workspace && options.repoSlug);
  const gitService = createMockGitService({
    isRepo: hasRemote,
    remoteUrl: hasRemote
      ? `git@bitbucket.org:${options.workspace}/${options.repoSlug}.git`
      : undefined,
  });
  const configService = createMockConfigService(
    options.defaultWorkspace
      ? { defaultWorkspace: options.defaultWorkspace }
      : {}
  );
  return new ContextService(gitService, configService);
}

export function createMockOutputService(
  options: { noUnicode?: boolean } = {}
): IOutputService & { logs: string[] } {
  const logs: string[] = [];
  const noUnicode = options.noUnicode ?? false;
  let jsonMode = false;

  return {
    logs,
    async json(data: unknown) {
      logs.push(`json:${JSON.stringify(data)}`);
    },
    jsonError(data: unknown) {
      logs.push(`jsonError:${JSON.stringify(data)}`);
    },
    setJsonFormatOptions(options) {
      jsonMode = options.json === true;
    },
    isJsonMode() {
      return jsonMode;
    },
    spinner(text: string) {
      // Records lifecycle events but never animates. Tests can assert on the
      // captured prefixes (`spinner-start:`, `spinner-stop:`,
      // `spinner-succeed:`, `spinner-fail:`, `spinner-text:`).
      const spinner: ISpinner = {
        start() {
          logs.push(`spinner-start:${text}`);
          return spinner;
        },
        stop() {
          logs.push('spinner-stop');
          return spinner;
        },
        succeed(message?: string) {
          logs.push(`spinner-succeed:${message ?? ''}`);
          return spinner;
        },
        fail(message?: string) {
          logs.push(`spinner-fail:${message ?? ''}`);
          return spinner;
        },
        setText(next: string) {
          text = next;
          logs.push(`spinner-text:${next}`);
          return spinner;
        },
      };
      return spinner;
    },
    table(headers: string[], rows: string[][]) {
      logs.push(`table:${headers.join(',')}`);
      logs.push(`table-rows:${JSON.stringify(rows)}`);
    },
    success(message: string) {
      logs.push(`success:${message}`);
    },
    error(message: string) {
      logs.push(`error:${message}`);
    },
    warning(message: string) {
      logs.push(`warning:${message}`);
    },
    info(message: string) {
      logs.push(`info:${message}`);
    },
    text(message: string) {
      logs.push(`text:${message}`);
    },
    separator(width = 60) {
      logs.push(`separator:${width}`);
    },
    truncate(text: string, maxLength: number, suffix = '...') {
      if (maxLength <= 0 || text.length <= maxLength) {
        return text;
      }
      if (suffix.length >= maxLength) {
        return text.slice(0, maxLength);
      }
      return text.slice(0, maxLength - suffix.length) + suffix;
    },
    symbol(unicode: string, ascii: string) {
      return noUnicode ? ascii : unicode;
    },
    format(text: string, formatter: (text: string) => string) {
      return formatter(text);
    },
    dim(text: string) {
      return text;
    },
    highlight(text: string) {
      return text;
    },
    bold(text: string) {
      return text;
    },
    red(text: string) {
      return text;
    },
    green(text: string) {
      return text;
    },
    yellow(text: string) {
      return text;
    },
    cyan(text: string) {
      return text;
    },
    magenta(text: string) {
      return text;
    },
    gray(text: string) {
      return text;
    },
    blue(text: string) {
      return text;
    },
    underline(text: string) {
      return text;
    },
    formatDate(date: string | Date) {
      return new Date(date).toISOString();
    },
  };
}

/**
 * Mock data - using generated API types
 */

// Import types from generated API
import type { Account, Repository, Pullrequest } from '../src/generated/api.js';

export const mockUser: Account = {
  type: 'user',
  uuid: '{user-uuid}',
  username: 'testuser',
  display_name: 'Test User',
  account_id: '123456789',
  links: {
    html: { href: 'https://bitbucket.org/testuser' },
    avatar: { href: 'https://avatar.bitbucket.org/testuser' },
  } as unknown as import('../src/generated/api.js').AccountLinks,
};

export const mockRepository: Repository = {
  type: 'repository',
  uuid: '{repo-uuid}',
  full_name: 'workspace/repo',
  name: 'repo',
  slug: 'repo',
  description: 'Test repository',
  is_private: true,
  created_on: '2024-01-01T00:00:00.000Z',
  updated_on: '2024-01-02T00:00:00.000Z',
  links: {
    html: { href: 'https://bitbucket.org/workspace/repo' },
    clone: [
      { name: 'ssh', href: 'git@bitbucket.org:workspace/repo.git' },
      { name: 'https', href: 'https://bitbucket.org/workspace/repo.git' },
    ],
    avatar: { href: 'https://avatar.bitbucket.org/repo' },
  } as unknown as import('../src/generated/api.js').RepositoryLinks,
  owner: mockUser,
  workspace: {
    type: 'workspace',
    uuid: '{workspace-uuid}',
    slug: 'workspace',
    name: 'Workspace',
    links: {
      html: { href: 'https://bitbucket.org/workspace' },
      avatar: { href: 'https://avatar.bitbucket.org/workspace' },
    } as unknown as import('../src/generated/api.js').WorkspaceLinks,
  },
};

export const mockPullRequest: Pullrequest = {
  type: 'pullrequest',
  id: 1,
  title: 'Test PR',
  description: 'Test description',
  state: 'OPEN',
  draft: false,
  author: mockUser,
  source: {
    branch: { name: 'feature-branch' },
    repository: { full_name: 'workspace/repo' },
    commit: { hash: 'abc123' },
  } as unknown as import('../src/generated/api.js').PullrequestSource,
  destination: {
    branch: { name: 'main' },
    repository: { full_name: 'workspace/repo' },
    commit: { hash: 'def456' },
  } as unknown as import('../src/generated/api.js').PullrequestDestination,
  created_on: '2024-01-01T00:00:00.000Z',
  updated_on: '2024-01-02T00:00:00.000Z',
  close_source_branch: false,
  links: {
    html: { href: 'https://bitbucket.org/workspace/repo/pull-requests/1' },
    diff: {
      href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/diff',
    },
    commits: {
      href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/commits',
    },
    comments: {
      href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/comments',
    },
    approve: {
      href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/approve',
    },
    decline: {
      href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/decline',
    },
    merge: {
      href: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/merge',
    },
  } as unknown as import('../src/generated/api.js').PullrequestLinks,
  participants: [],
  reviewers: [],
};

export const mockApproval = {
  approved: true,
  user: mockUser,
  date: '2024-01-01T00:00:00.000Z',
};

export const mockDiff = `diff --git a/README.md b/README.md
index 123456..789abc 100644
--- a/README.md
+++ b/README.md
@@ -1 +1 @@
-Old content
+New content`;

export const mockDiffStat = {
  old: { path: 'README.md', type: 'commit_file' },
  new: { path: 'README.md', type: 'commit_file' },
  lines_added: 1,
  lines_removed: 1,
};

/**
 * Axios client mocks shared by the api-client suites (tests/services/
 * api-client.test.ts and api-client.interceptors.test.ts).
 */

type MockResponse = {
  status: number;
  data?: unknown;
  headers?: Record<string, string>;
};

/** Shared success/error shaping for the queue-based adapters below. */
function resolveMockResponse(
  config: InternalAxiosRequestConfig,
  resp: MockResponse
) {
  const response = {
    data: resp.data ?? {},
    status: resp.status,
    statusText:
      resp.status >= 200 && resp.status < 300 ? 'OK' : resp.status.toString(),
    headers: resp.headers ?? {},
    config,
  };
  if (resp.status >= 200 && resp.status < 300) {
    return Promise.resolve(response);
  }
  // Simulate an axios error for non-2xx (isAxiosError is set by the ctor)
  return Promise.reject(
    new axios.AxiosError(
      `Request failed with status code ${resp.status}`,
      undefined,
      config,
      undefined,
      response
    )
  );
}

/** Make the interceptor's setTimeout-based backoff run synchronously. */
export function stubSetTimeout(): void {
  globalThis.setTimeout = ((fn: Function, _ms?: number) => {
    fn();
    return 0 as never;
  }) as never;
}

export function restoreSetTimeout(): void {
  globalThis.setTimeout = originalSetTimeout;
}

export function mockConfigService() {
  return createMockConfigService({
    username: 'testuser',
    apiToken: 'testtoken',
  });
}

export function mockOAuthConfigService() {
  return createMockConfigService({
    authMethod: 'oauth',
    oauthAccessToken: 'oauth-access-token',
    oauthRefreshToken: 'oauth-refresh-token',
    oauthExpiresAt: Math.floor(Date.now() / 1000) + 3600,
  });
}

/**
 * Creates an axios adapter that returns responses from a queue. Each entry
 * is either a successful response or an error response; the last entry
 * repeats indefinitely. Tracks the number of calls made.
 */
export function createMockAdapter(
  responses: MockResponse[],
  options: {
    onRequest?: (config: InternalAxiosRequestConfig) => void;
  } = {}
): { adapter: AxiosAdapter; getCallCount: () => number } {
  let callCount = 0;
  const adapter: AxiosAdapter = (config) => {
    const idx = callCount;
    callCount++;
    options.onRequest?.(config);
    const resp = responses[idx] ?? responses[responses.length - 1];
    return resolveMockResponse(config, resp);
  };

  return {
    adapter,
    getCallCount: () => callCount,
  };
}

/**
 * Creates an adapter that simulates an axios request timeout. A real axios
 * timeout rejects with an error that has `code === 'ECONNABORTED'` (or
 * 'ETIMEDOUT'), `request` set, and NO `response` — exactly like a generic
 * network error but with `code` populated. This routes through the same
 * `else if (error.request)` branch a real timeout hits. The presence of
 * `code` is what lets the client emit a timeout-specific message.
 */
export function createTimeoutErrorAdapter(
  code: 'ECONNABORTED' | 'ETIMEDOUT' = 'ECONNABORTED',
  options: { succeedAfter?: number } = {}
): {
  adapter: AxiosAdapter;
  getCallCount: () => number;
  getLastError: () => unknown;
} {
  let callCount = 0;
  let lastError: unknown;
  const adapter: AxiosAdapter = (config) => {
    callCount++;
    if (
      options.succeedAfter !== undefined &&
      callCount > options.succeedAfter
    ) {
      return Promise.resolve({
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    }
    // request was sent ({}), but no response was ever received
    const error = new axios.AxiosError(
      `timeout of 30000ms exceeded`,
      code,
      config,
      {}
    );
    lastError = error;
    return Promise.reject(error);
  };
  return {
    adapter,
    getCallCount: () => callCount,
    getLastError: () => lastError,
  };
}

/**
 * Creates an adapter that simulates a network error (no response).
 * Optionally tags the error with a `code` (e.g. 'ECONNRESET') and/or starts
 * succeeding after the first `succeedAfter` calls have failed.
 */
export function createNetworkErrorAdapter(
  options: { code?: string; succeedAfter?: number } = {}
): { adapter: AxiosAdapter; getCallCount: () => number } {
  let callCount = 0;
  const adapter: AxiosAdapter = (config) => {
    callCount++;
    if (
      options.succeedAfter !== undefined &&
      callCount > options.succeedAfter
    ) {
      return Promise.resolve({
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    }
    // has request but no response
    const error = new axios.AxiosError(
      'Network Error',
      options.code,
      config,
      {}
    );
    return Promise.reject(error);
  };
  return {
    adapter,
    getCallCount: () => callCount,
  };
}

/**
 * Creates an adapter with a per-URL response queue, so concurrent requests
 * to different paths each consume their own sequence. Used to prove
 * interceptor state is per-request, not per-instance.
 */
export function createUrlKeyedAdapter(routes: Record<string, MockResponse[]>): {
  adapter: AxiosAdapter;
  getCallCount: (url: string) => number;
} {
  const callCounts: Record<string, number> = {};
  const adapter: AxiosAdapter = (config) => {
    const url = config.url ?? '';
    const idx = callCounts[url] ?? 0;
    callCounts[url] = idx + 1;
    const queue = routes[url] ?? [];
    const resp = queue[idx] ?? queue[queue.length - 1];
    return resolveMockResponse(config, resp);
  };
  return {
    adapter,
    getCallCount: (url: string) => callCounts[url] ?? 0,
  };
}

/**
 * Creates a mock OAuthService for driving the api-client interceptor.
 */
export function createMockOAuthService(
  options: {
    validToken?: string;
    refreshedToken?: string;
    refreshShouldFail?: boolean;
  } = {}
) {
  let refreshCallCount = 0;
  return {
    service: {
      async getValidAccessToken() {
        return options.validToken ?? 'valid-oauth-token';
      },
      async refreshAccessToken() {
        refreshCallCount++;
        if (options.refreshShouldFail) {
          throw new Error('Refresh failed');
        }
        return options.refreshedToken ?? 'refreshed-oauth-token';
      },
      async authorize() {
        return { username: 'user', displayName: 'User', accountId: '123' };
      },
      async revokeToken() {},
    } as unknown as OAuthService,
    getRefreshCallCount: () => refreshCallCount,
  };
}
