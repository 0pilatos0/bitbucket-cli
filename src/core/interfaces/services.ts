/**
 * Service interfaces for dependency injection
 */

import type {
  BBConfig,
  AuthCredentials,
  RepoContext,
  GlobalOptions,
} from '../../types/config.js';

/**
 * Configuration service interface
 */
export interface IConfigService {
  getConfig(): Promise<BBConfig>;
  setConfig(config: BBConfig): Promise<void>;
  getCredentials(): Promise<AuthCredentials>;
  setCredentials(credentials: AuthCredentials): Promise<void>;
  clearCredentials(): Promise<void>;
  clearConfig(): Promise<void>;
  getValue<K extends keyof BBConfig>(key: K): Promise<BBConfig[K] | undefined>;
  setValue<K extends keyof BBConfig>(key: K, value: BBConfig[K]): Promise<void>;
  getConfigPath(): string;
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
 * Output service interface for formatting and displaying output
 */
export interface IOutputService {
  json(data: unknown): void;
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
