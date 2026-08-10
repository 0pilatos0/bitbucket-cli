/**
 * Set commit status command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { CommitStatusesApi, Commitstatus } from '../../generated/api.js';
import type { CommitstatusStateEnum } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { APIError, rethrowWithNotFoundContext } from '../../types/errors.js';
import { COMMIT_STATUS_STATES } from './shared.js';

export interface SetCommitStatusOptions extends GlobalOptions {
  sha: string;
  key?: string;
  state?: string;
  url?: string;
  name?: string;
  description?: string;
  refname?: string;
}

export class SetCommitStatusCommand extends BaseCommand<
  SetCommitStatusOptions,
  void
> {
  public readonly name = 'set';
  public readonly description = 'Create or update a build status on a commit';

  constructor(
    private readonly commitStatusesApi: CommitStatusesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: SetCommitStatusOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const sha = this.requireOption(options.sha, 'sha');
    const key = this.requireOption(options.key, 'key');
    const state = this.parseEnumOption(
      this.requireOption(options.state, 'state').toUpperCase(),
      'state',
      COMMIT_STATUS_STATES
    ) as CommitstatusStateEnum;

    const commitstatus: Commitstatus = {
      // 'type' is the ModelObject discriminator; 'build' is the only
      // commit-status type Bitbucket supports.
      type: 'build',
      key,
      state,
      ...(options.url ? { url: options.url } : {}),
      ...(options.name ? { name: options.name } : {}),
      ...(options.description ? { description: options.description } : {}),
      ...(options.refname ? { refname: options.refname } : {}),
    };

    const status = await this.createOrUpdateStatus(
      repoContext,
      sha,
      key,
      commitstatus
    );

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        commit: sha,
        status,
      });
      return;
    }

    this.output.success(`Status ${key} set to ${state} on ${sha.slice(0, 7)}`);
  }

  /**
   * CI-friendly idempotent "set": POST creates the status, but Bitbucket
   * rejects the POST when a status with the same key already exists on the
   * commit (CI re-runs hit this constantly). On that rejection, fall back to
   * the PUT endpoint which updates the existing status in place. Auth and
   * not-found failures are rethrown immediately — only the POST-specific
   * duplicate-key rejection is retried as an update.
   */
  private async createOrUpdateStatus(
    repoContext: { workspace: string; repoSlug: string },
    sha: string,
    key: string,
    commitstatus: Commitstatus
  ): Promise<Commitstatus> {
    try {
      const response =
        await this.commitStatusesApi.repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildPost(
          {
            commit: sha,
            repoSlug: repoContext.repoSlug,
            workspace: repoContext.workspace,
            body: commitstatus,
          }
        );
      return response.data;
    } catch (error) {
      if (
        !(error instanceof APIError) ||
        error.statusCode === 401 ||
        error.statusCode === 403 ||
        error.statusCode === 404
      ) {
        if (error instanceof APIError && error.statusCode === 404) {
          rethrowWithNotFoundContext(
            error,
            `Commit ${sha} not found in ${repoContext.workspace}/${repoContext.repoSlug}.`
          );
        }
        throw error;
      }

      // Duplicate key (or other POST-only rejection): update the existing
      // status under the same key instead, making `bb status set` idempotent.
      const response =
        await this.commitStatusesApi.repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildKeyPut(
          {
            commit: sha,
            key,
            repoSlug: repoContext.repoSlug,
            workspace: repoContext.workspace,
            body: commitstatus,
          }
        );
      return response.data;
    }
  }
}
