/**
 * Service interfaces for dependency injection
 */

import type {
  BBConfig,
  AuthCredentials,
  OAuthCredentials,
  AuthMethod,
  RepoContext,
  GlobalOptions,
} from '../../types/config.js';

/**
 * Application config interface — reading and writing general settings
 * (default workspace, version-check preferences, OAuth client id/secret, etc.)
 * stored in the on-disk config file. Does NOT include any credential methods;
 * those live on `ICredentialStore`.
 */
export interface IConfigService {
  getConfig(): Promise<BBConfig>;
  clearConfig(): Promise<void>;
  getValue<K extends keyof BBConfig>(key: K): Promise<BBConfig[K] | undefined>;
  setValue<K extends keyof BBConfig>(key: K, value: BBConfig[K]): Promise<void>;
  getConfigPath(): string;
}

/**
 * Credential storage interface — basic auth credentials and OAuth token state.
 * Backed by the same on-disk config today, but isolated behind this interface
 * so that an alternative store (e.g. OS keychain) can be introduced without
 * touching non-auth consumers.
 */
export interface ICredentialStore {
  getAuthMethod(): Promise<AuthMethod>;

  // Basic auth
  getCredentials(): Promise<AuthCredentials>;
  setCredentials(credentials: AuthCredentials): Promise<void>;
  clearCredentials(): Promise<void>;

  // OAuth
  getOAuthCredentials(): Promise<OAuthCredentials>;
  setOAuthCredentials(credentials: OAuthCredentials): Promise<void>;
  clearOAuthCredentials(): Promise<void>;
  isOAuthTokenExpired(): Promise<boolean>;
}

/**
 * Git service interface
 */
export interface IGitService {
  isRepository(): Promise<boolean>;
  clone(url: string, destination?: string): Promise<void>;
  fetch(remote?: string): Promise<void>;
  checkout(branch: string): Promise<void>;
  checkoutNewBranch(branch: string, startPoint?: string): Promise<void>;
  getCurrentBranch(): Promise<string>;
  getRemoteUrl(remote?: string): Promise<string>;
}

/**
 * Context service interface for resolving workspace/repo
 */
export interface IContextService {
  parseRemoteUrl(url: string): RepoContext | null;
  getRepoContextFromGit(): Promise<RepoContext | null>;
  getRepoContext(options: GlobalOptions): Promise<RepoContext | null>;
  requireRepoContext(options: GlobalOptions): Promise<RepoContext>;
}

/**
 * Snippet files service interface - handles multipart create/edit and raw
 * file-content fetches that the generated OpenAPI client does not model.
 */
export interface ISnippetFilesService {
  createWithFiles(options: {
    workspace: string;
    title: string;
    isPrivate: boolean;
    files: Array<{ path: string; filename?: string }>;
  }): Promise<unknown>;
  editMetadata(options: {
    workspace: string;
    encodedId: string;
    title?: string;
    isPrivate?: boolean;
  }): Promise<unknown>;
  editWithFiles(options: {
    workspace: string;
    encodedId: string;
    title?: string;
    isPrivate?: boolean;
    files: Array<{ path: string; filename?: string }>;
  }): Promise<unknown>;
  getFileContent(
    workspace: string,
    encodedId: string,
    filePath: string
  ): Promise<string>;
}

/**
 * Output service interface for formatting and displaying output
 */
export interface IOutputService {
  json(data: unknown): void;
  jsonError(data: unknown): void;
  table(headers: string[], rows: string[][]): void;
  success(message: string): void;
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
  text(message: string): void;
  format(text: string, formatter: (text: string) => string): string;
  dim(text: string): string;
  highlight(text: string): string;
  bold(text: string): string;
  red(text: string): string;
  green(text: string): string;
  yellow(text: string): string;
  cyan(text: string): string;
  magenta(text: string): string;
  gray(text: string): string;
  blue(text: string): string;
  underline(text: string): string;
  formatDate(date: string | Date): string;
}
