/**
 * Edit comment on PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';

export interface EditCommentPROptions extends GlobalOptions {}

export class EditCommentPRCommand extends BaseCommand<
  { prId: string; commentId: string; message: string } & EditCommentPROptions,
  void
> {
  public readonly name = 'edit';
  public readonly description = 'Edit a comment on a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: {
      prId: string;
      commentId: string;
      message: string;
    } & EditCommentPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const prId = this.parseIntOption(options.prId, 'pr-id');
    const commentId = this.parseIntOption(options.commentId, 'comment-id');

    const response =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdPut(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
          commentId: commentId,
          pullrequestComment: {
            type: 'pullrequest_comment',
            content: {
              raw: options.message,
            },
          },
        }
      );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        pullRequestId: prId,
        commentId,
        comment: response.data,
      });
      return;
    }

    this.output.success(`Updated comment #${commentId} on PR #${prId}`);
  }
}
