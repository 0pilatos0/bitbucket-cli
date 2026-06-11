/**
 * List commit statuses command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { CommitStatusesApi, Commitstatus } from '../../generated/api.js';
import { resolveLimit } from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';
import { colorStatusState } from './shared.js';

export interface ListCommitStatusesOptions extends GlobalOptions {
  sha: string;
  limit?: string;
  all?: boolean;
}

export class ListCommitStatusesCommand extends BaseCommand<
  ListCommitStatusesOptions,
  void
> {
  public readonly name = 'list';
  public readonly description = 'List commit statuses (build results)';

  constructor(
    private readonly commitStatusesApi: CommitStatusesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListCommitStatusesOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const sha = this.requireOption(options.sha, 'sha');

    // Validate --limit before any network call; runList re-resolves it.
    resolveLimit(options);

    await this.runList<Commitstatus>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response = await this.commitStatusesApi
            .repositoriesWorkspaceRepoSlugCommitCommitStatusesGet(
              {
                commit: sha,
                repoSlug: repoContext.repoSlug,
                workspace: repoContext.workspace,
              },
              { params: { page, pagelen } }
            )
            .catch((error: unknown) =>
              rethrowWithNotFoundContext(
                error,
                `Commit ${sha} not found in ${repoContext.workspace}/${repoContext.repoSlug}.`
              )
            );
          return response.data;
        },
        wrapperKey: 'statuses',
        jsonMetadata: {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          commit: sha,
        },
        emptyMessage: `No statuses found for commit ${sha}`,
        tableHeaders: ['KEY', 'STATE', 'NAME', 'DESCRIPTION', 'URL'],
        mapRow: (status) => [
          status.key ?? '-',
          colorStatusState(this.output, status.state),
          status.name ?? '-',
          this.truncateText(
            status.description ?? '-',
            40,
            context.globalOptions
          ),
          status.url ?? '-',
        ],
        noun: 'statuses',
      },
      context
    );
  }
}
