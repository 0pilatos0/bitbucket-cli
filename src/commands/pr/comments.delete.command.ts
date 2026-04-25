/**
 * Delete comment on PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface DeleteCommentPROptions extends GlobalOptions {
  yes?: boolean;
}

export class DeleteCommentPRCommand extends BaseCommand<
  { prId: string; commentId: string } & DeleteCommentPROptions,
  void
> {
  public readonly name = 'delete';
  public readonly description = 'Delete a comment on a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { prId: string; commentId: string } & DeleteCommentPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId = this.parsePositiveInt(options.prId, 'pr-id');
    const commentId = this.parsePositiveInt(options.commentId, 'comment-id');

    if (!options.yes) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          `This will permanently delete comment #${commentId} on PR #${prId}.\n` +
          'Use --yes to confirm deletion.',
      });
    }

    await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdDelete(
      {
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pullRequestId: prId,
        commentId: commentId,
      }
    );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        pullRequestId: prId,
        commentId,
      });
      return;
    }

    this.output.success(`Deleted comment #${commentId} from PR #${prId}`);
  }
}
