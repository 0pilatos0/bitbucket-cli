/**
 * Doctor command implementation
 */

import axios from 'axios';
import { BaseCommand } from '../core/base-command.js';
import type { CommandContext } from '../core/interfaces/commands.js';
import type {
  IConfigService,
  IContextService,
  ICredentialStore,
  IOutputService,
} from '../core/interfaces/services.js';
import type { UsersApi } from '../generated/api.js';
import { resolveBaseUrl } from '../services/api-client.service.js';
import { DOCS_BASE_URL } from '../constants.js';
import { APIError } from '../types/errors.js';
import pkg from '../../package.json' with { type: 'json' };

export type DoctorCheckStatus = 'pass' | 'warn' | 'fail';

export interface DoctorCheck {
  id: string;
  label: string;
  status: DoctorCheckStatus;
  message: string;
  hint?: string;
}

/**
 * Resolves with the HTTP status of an unauthenticated GET, or rejects when no
 * response arrives. Any status counts as reachable.
 */
export type NetworkProbe = (url: string) => Promise<number>;

const PROBE_TIMEOUT_MS = 5000;

// Bypasses the shared API client on purpose: no credentials, no retries, and
// a short timeout, so an offline host fails this row fast.
const probeUrl: NetworkProbe = async (url) => {
  const response = await axios.get(url, {
    timeout: PROBE_TIMEOUT_MS,
    validateStatus: () => true,
  });
  return response.status;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class DoctorCommand extends BaseCommand<void, void> {
  public readonly name = 'doctor';
  public readonly description =
    'Check auth, network, config, git remote and runtime';

  constructor(
    private readonly configService: IConfigService,
    private readonly credentialStore: ICredentialStore,
    private readonly contextService: IContextService,
    private readonly usersApi: UsersApi,
    output: IOutputService,
    private readonly probe: NetworkProbe = probeUrl,
    private readonly bunVersion: string = Bun.version
  ) {
    super(output);
  }

  public async execute(_options: void, context: CommandContext): Promise<void> {
    const configCheck = await this.checkConfig();
    const network = await this.checkNetwork();
    const checks: DoctorCheck[] = [
      this.checkBun(),
      configCheck,
      network,
      ...(await this.checkAuth(
        configCheck.status === 'pass',
        network.status === 'pass'
      )),
      await this.checkGitRemote(),
    ];
    const ok = checks.every((check) => check.status !== 'fail');

    if (!ok) {
      process.exitCode = 1;
    }

    if (context.globalOptions.json) {
      await this.output.json({ ok, checks });
      return;
    }

    this.renderChecks(checks);
  }

  private checkBun(): DoctorCheck {
    const required = pkg.engines.bun;
    const supported = Bun.semver.satisfies(this.bunVersion, required);
    return {
      id: 'bun',
      label: 'Bun',
      status: supported ? 'pass' : 'fail',
      message: `${this.bunVersion} (requires ${required})`,
      ...(supported ? {} : { hint: 'Upgrade Bun: `bun upgrade`' }),
    };
  }

  private async checkConfig(): Promise<DoctorCheck> {
    const path = this.configService.getConfigPath();
    const base = { id: 'config', label: 'Config' };
    try {
      await this.configService.getConfig();
    } catch (error) {
      return { ...base, status: 'fail', message: errorMessage(error) };
    }
    const exists = await Bun.file(path).exists();
    return {
      ...base,
      status: 'pass',
      message: exists ? path : `${path} (not created yet)`,
    };
  }

  private async checkNetwork(): Promise<DoctorCheck> {
    const url = resolveBaseUrl();
    const base = { id: 'network', label: 'Network' };
    try {
      const status = await this.probe(url);
      return {
        ...base,
        status: 'pass',
        message: `${url} reachable (HTTP ${status})`,
      };
    } catch (error) {
      return {
        ...base,
        status: 'fail',
        message: `${url} unreachable: ${errorMessage(error)}`,
        hint: 'Check your connection, proxy, or BB_API_BASE_URL. Run with BB_DEBUG=http for details.',
      };
    }
  }

  private async checkAuth(
    configReadable: boolean,
    networkOk: boolean
  ): Promise<DoctorCheck[]> {
    const base = { id: 'auth', label: 'Auth' };
    const loginHint = 'Run `bb auth login`';

    if (!configReadable) {
      return [
        {
          ...base,
          status: 'fail',
          message: 'Not checked: config is unreadable',
        },
      ];
    }

    let method: string;
    try {
      if (!(await this.credentialStore.hasCredentials())) {
        return [
          {
            ...base,
            status: 'fail',
            message: 'Not logged in',
            hint: loginHint,
          },
        ];
      }
      method =
        (await this.credentialStore.getAuthMethod()) === 'oauth'
          ? 'OAuth'
          : 'API token';
    } catch (error) {
      return [
        {
          ...base,
          status: 'fail',
          message: `Could not read stored credentials: ${errorMessage(error)}`,
        },
      ];
    }

    if (!networkOk) {
      return [
        {
          ...base,
          status: 'fail',
          message: `${method} credentials found but not verified: network unreachable`,
        },
      ];
    }

    let response;
    try {
      response = await this.usersApi.userGet();
    } catch (error) {
      const rejected =
        error instanceof APIError &&
        (error.statusCode === 401 || error.statusCode === 403);
      return [
        {
          ...base,
          status: 'fail',
          message: rejected
            ? `${method} credentials were rejected (HTTP ${error.statusCode})`
            : `Could not verify ${method} credentials: ${errorMessage(error)}`,
          ...(rejected ? { hint: loginHint } : {}),
        },
      ];
    }

    const username = response.data.username ?? response.data.display_name;
    return [
      {
        ...base,
        status: 'pass',
        message: `Logged in as ${username} (${method})`,
      },
      this.checkScopes(response.headers['x-oauth-scopes']),
    ];
  }

  private checkScopes(header: unknown): DoctorCheck {
    const base = { id: 'scopes', label: 'Token scopes' };
    const scopes =
      typeof header === 'string'
        ? header
            .split(/[\s,]+/)
            .filter((scope) => scope.length > 0)
            .join(', ')
        : '';

    if (scopes) {
      return { ...base, status: 'pass', message: scopes };
    }
    return {
      ...base,
      status: 'warn',
      message: 'Not reported by Bitbucket for this token',
      hint: `Compare your token's scopes with ${DOCS_BASE_URL}/reference/token-scopes/`,
    };
  }

  private async checkGitRemote(): Promise<DoctorCheck> {
    const base = { id: 'git', label: 'Git remote' };
    try {
      const repo = await this.contextService.requireRepoContext({});
      return {
        ...base,
        status: 'pass',
        message: `${repo.workspace}/${repo.repoSlug}`,
      };
    } catch (error) {
      return { ...base, status: 'warn', message: errorMessage(error) };
    }
  }

  private renderChecks(checks: DoctorCheck[]): void {
    const symbols = checks.map((check) => this.statusSymbol(check.status));
    const symbolWidth = Math.max(...symbols.map((symbol) => symbol.length));
    const labelWidth = Math.max(...checks.map((check) => check.label.length));
    const indent = ' '.repeat(symbolWidth + labelWidth + 3);

    checks.forEach((check, index) => {
      const symbol = this.colorStatus(
        check.status,
        symbols[index]!.padEnd(symbolWidth)
      );
      this.output.text(
        `${symbol} ${check.label.padEnd(labelWidth)}  ${check.message}`
      );
      if (check.hint) {
        this.output.text(`${indent}${this.output.dim(check.hint)}`);
      }
    });

    const failed = checks.filter((check) => check.status === 'fail').length;
    const warned = checks.filter((check) => check.status === 'warn').length;
    const plural = (count: number, noun: string): string =>
      `${count} ${noun}${count === 1 ? '' : 's'}`;
    const summary =
      failed > 0
        ? `${plural(failed, 'check')} failed`
        : warned > 0
          ? `All checks passed with ${plural(warned, 'warning')}`
          : 'All checks passed';
    this.output.text('');
    this.output.text(summary);
  }

  private statusSymbol(status: DoctorCheckStatus): string {
    switch (status) {
      case 'pass':
        return this.output.symbol('✓', 'OK');
      case 'warn':
        return this.output.symbol('!', '!!');
      case 'fail':
        return this.output.symbol('✗', 'ERR');
    }
  }

  private colorStatus(status: DoctorCheckStatus, text: string): string {
    switch (status) {
      case 'pass':
        return this.output.green(text);
      case 'warn':
        return this.output.yellow(text);
      case 'fail':
        return this.output.red(text);
    }
  }
}
