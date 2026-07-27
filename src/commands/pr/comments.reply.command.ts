/**
 * Reply to a comment on a PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  PullrequestComment,
  PullrequestsApi,
} from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface ReplyCommentPROptions extends GlobalOptions {}

export class ReplyCommentPRCommand extends BaseCommand<
  { prId: string; commentId: string; message: string } & ReplyCommentPROptions,
  void
> {
  public readonly name = 'reply';
  public readonly description = 'Reply to a comment on a pull request';

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
    } & ReplyCommentPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId = this.parsePositiveInt(options.prId, 'pr-id');
    const parentId = this.parsePositiveInt(options.commentId, 'comment-id');

    const body: PullrequestComment = {
      type: 'pullrequest_comment',
      content: {
        raw: options.message,
      },
      parent: {
        type: 'pullrequest_comment',
        id: parentId,
      },
    };

    const response = await this.pullrequestsApi
      .repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsPost({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pullRequestId: prId,
        pullrequestComment: body,
      })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Comment #${parentId} not found on pull request #${prId} in ${repoContext.workspace}/${repoContext.repoSlug}.`
        )
      );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        pullRequestId: prId,
        parentId,
        comment: response.data,
      });
      return;
    }

    this.output.success(`Replied to comment #${parentId} on PR #${prId}`);
  }
}
