/**
 * Resolve comment on PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface ResolveCommentPROptions extends GlobalOptions {}

export class ResolveCommentPRCommand extends BaseCommand<
  { prId: string; commentId: string } & ResolveCommentPROptions,
  void
> {
  public readonly name = 'resolve';
  public readonly description = 'Resolve a comment thread on a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { prId: string; commentId: string } & ResolveCommentPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId = this.parsePositiveInt(options.prId, 'pr-id');
    const commentId = this.parsePositiveInt(options.commentId, 'comment-id');

    const response = await this.pullrequestsApi
      .repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdResolvePost(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
          commentId: commentId,
        }
      )
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Comment #${commentId} not found on pull request #${prId} in ${repoContext.workspace}/${repoContext.repoSlug}.`
        )
      );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        pullRequestId: prId,
        commentId,
        resolution: response.data ?? null,
      });
      return;
    }

    this.output.success(`Resolved comment #${commentId} on PR #${prId}`);
  }
}
