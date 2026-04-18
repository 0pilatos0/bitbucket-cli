/**
 * Test setup and utilities
 */

import { beforeEach, afterEach } from 'bun:test';
import { Container } from '../src/core/container.js';
import { ContextService } from '../src/services/context.service.js';
import type {
  IConfigService,
  ICredentialStore,
  IGitService,
  IContextService,
  IOutputService,
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
    remoteUrl?: string;
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
      return options.currentBranch ?? 'main';
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

export function createMockOutputService(): IOutputService & { logs: string[] } {
  const logs: string[] = [];

  return {
    logs,
    json(data: unknown) {
      logs.push(`json:${JSON.stringify(data)}`);
    },
    jsonError(data: unknown) {
      logs.push(`jsonError:${JSON.stringify(data)}`);
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
