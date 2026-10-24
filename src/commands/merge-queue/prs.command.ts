/**
 * List merge-queue pull requests command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  MergeQueuePullrequest,
  MergeQueuesApi,
} from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface ListMergeQueuePullRequestsOptions extends GlobalOptions {
  uuid: string;
  limit?: string;
  all?: boolean;
}

export class ListMergeQueuePullRequestsCommand extends BaseCommand<
  ListMergeQueuePullRequestsOptions,
  void
> {
  public readonly name = 'prs';
  public readonly description = 'List pull requests in a merge queue';

  constructor(
    private readonly mergeQueuesApi: MergeQueuesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListMergeQueuePullRequestsOptions,
    context: CommandContext
  ): Promise<void> {
    const mergeQueueUuid = this.parseUuidArg(
      this.requireOption(options.uuid, 'uuid'),
      'uuid'
    );
    const { workspace, repoSlug } =
      await this.contextService.requireRepoContextFor(options, context);

    await this.runList<MergeQueuePullrequest>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response = await this.mergeQueuesApi
            .listMergeQueuePullRequests({
              workspace,
              repoSlug,
              mergeQueueUuid,
              page,
              pagelen,
            })
            .catch((error: unknown) =>
              rethrowWithNotFoundContext(
                error,
                `Merge queue ${mergeQueueUuid} not found in ${workspace}/${repoSlug}.`
              )
            );
          return response.data;
        },
        wrapperKey: 'queuedPullRequests',
        jsonMetadata: { workspace, repoSlug, mergeQueueUuid },
        emptyMessage: 'No pull requests in this merge queue',
        tableHeaders: ['Rank', 'ID', 'Title', 'Status', 'Queued'],
        mapRow: (entry) => [
          entry.rank === undefined ? '-' : String(entry.rank),
          entry.pullrequest?.id === undefined
            ? '-'
            : `#${entry.pullrequest.id}`,
          entry.pullrequest?.title ?? '',
          entry.status ?? '-',
          entry.queued_on
            ? this.output.formatRelativeDate(entry.queued_on)
            : '-',
        ],
        flexColumns: [2],
        noun: 'pull requests',
      },
      context
    );
  }
}
