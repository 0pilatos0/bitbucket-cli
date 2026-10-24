/**
 * Remove a pull request from a merge queue command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { MergeQueuesApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface RemoveMergeQueuePullRequestOptions extends GlobalOptions {
  uuid: string;
  prId: string;
  yes?: boolean;
}

export class RemoveMergeQueuePullRequestCommand extends BaseCommand<
  RemoveMergeQueuePullRequestOptions,
  void
> {
  public readonly name = 'remove';
  public readonly description = 'Remove a pull request from a merge queue';

  constructor(
    private readonly mergeQueuesApi: MergeQueuesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: RemoveMergeQueuePullRequestOptions,
    context: CommandContext
  ): Promise<void> {
    const mergeQueueUuid = this.parseUuidArg(
      this.requireOption(options.uuid, 'uuid'),
      'uuid'
    );
    const prId = this.parsePositiveIntArg(options.prId, 'pr-id');
    const { workspace, repoSlug } =
      await this.contextService.requireRepoContextFor(options, context);

    await this.requireConfirmation(
      options.yes,
      `This will remove PR #${prId} from merge queue ${mergeQueueUuid} in ${workspace}/${repoSlug}.`,
      context
    );

    await this.mergeQueuesApi
      .removePullRequestFromMergeQueue({
        workspace,
        repoSlug,
        mergeQueueUuid,
        pullrequestId: prId,
      })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `PR #${prId} not found in merge queue ${mergeQueueUuid} in ${workspace}/${repoSlug}.`
        )
      );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        workspace,
        repoSlug,
        mergeQueueUuid,
        pullRequestId: prId,
      });
      return;
    }

    // The API queues the removal and returns before it completes.
    this.output.success(
      `Requested removal of PR #${prId} from merge queue ${mergeQueueUuid}`
    );
  }
}
