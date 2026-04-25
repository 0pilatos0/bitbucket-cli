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
import type { CommandContext } from './commands.js';

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
  getCurrentCommit(): Promise<string>;
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
  /**
   * Convenience used by command implementations: merges the global options
   * carried on `context` with command-local options before resolving the repo
   * context. Replaces the boilerplate
   * `requireRepoContext({ ...context.globalOptions, ...options })` that
   * previously appeared in every command.
   */
  requireRepoContextFor(
    options: Partial<GlobalOptions>,
    context: CommandContext
  ): Promise<RepoContext>;
  requireWorkspace(explicit?: string): Promise<string>;
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
 * Format options that influence how `json()` renders its argument.
 * Pushed by BaseCommand.run() from CommandContext.globalOptions.
 */
export interface JsonFormatOptions {
  /**
   * Whether the active command was invoked with `--json`. Drives the spinner
   * suppression logic — animations on stdout would corrupt JSON output.
   */
  json?: boolean;
  fields?: string[];
  jq?: string;
}

/**
 * Animated progress indicator handle returned by `IOutputService.spinner()`.
 *
 * Implementations must auto-disable in environments that cannot animate
 * cleanly (non-TTY streams, JSON mode, tests). Disabled spinners turn every
 * method into a safe no-op, so callers can instrument commands without
 * branching on the runtime environment.
 *
 * Methods return `this` to support fluent calls.
 */
export interface ISpinner {
  /** Begin the animation. Idempotent. */
  start(): ISpinner;
  /** Stop the animation and restore the cursor. Idempotent. */
  stop(): ISpinner;
  /** Stop the animation; print an optional success line if enabled. */
  succeed(message?: string): ISpinner;
  /** Stop the animation; print an optional failure line if enabled. */
  fail(message?: string): ISpinner;
  /** Update the text shown next to the spinner. */
  setText(text: string): ISpinner;
}

/**
 * Output service interface for formatting and displaying output
 */
export interface IOutputService {
  json(data: unknown): Promise<void>;
  jsonError(data: unknown): void;
  setJsonFormatOptions(options: JsonFormatOptions): void;
  /**
   * Create a progress spinner with the given initial text. Returns a handle
   * the caller is responsible for stopping. Implementations must auto-disable
   * the animation in JSON mode, non-TTY streams, and tests.
   */
  spinner(text: string): ISpinner;
  table(headers: string[], rows: string[][]): void;
  success(message: string): void;
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
  text(message: string): void;
  /**
   * Truncate `text` to fit within `maxLength` characters, appending `suffix`
   * when truncation occurs. Returns the input unchanged when it already fits
   * or when `maxLength` is <= 0. The default ellipsis is the three-dot ASCII
   * sequence to match historical output and stay safe across terminals.
   */
  truncate(text: string, maxLength: number, suffix?: string): string;
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
