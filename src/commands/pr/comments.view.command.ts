/**
 * View a single comment on a PR command implementation
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
import {
  getRawContent,
  getUserDisplayName,
} from '../../services/response-parsers.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface ViewCommentPROptions extends GlobalOptions {}

export class ViewCommentPRCommand extends BaseCommand<
  { prId: string; commentId: string } & ViewCommentPROptions,
  void
> {
  public readonly name = 'view';
  public readonly description = 'View a single comment on a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { prId: string; commentId: string } & ViewCommentPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId = this.parsePositiveInt(options.prId, 'pr-id');
    const commentId = this.parsePositiveInt(options.commentId, 'comment-id');

    const response = await this.pullrequestsApi
      .repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdGet(
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

    const comment = response.data;

    if (context.globalOptions.json) {
      await this.output.json(comment);
      return;
    }

    this.render(comment, prId, commentId);
  }

  private render(
    comment: PullrequestComment,
    prId: number,
    commentId: number
  ): void {
    const id = comment.id ?? commentId;

    this.output.text('');
    this.output.text(
      `${this.output.bold(`Comment #${id}`)} ${this.output.gray(`on PR #${prId}`)} ${this.renderState(comment)}`
    );
    this.output.separator();

    this.output.text(
      `${this.output.dim('Author:')}   ${getUserDisplayName(comment.user) ?? 'Unknown'}`
    );
    this.output.text(
      `${this.output.dim('Created:')}  ${
        comment.created_on
          ? this.output.formatDate(comment.created_on)
          : 'Unknown'
      }`
    );

    const parentId = comment.parent?.id;
    if (parentId !== undefined) {
      this.output.text(`${this.output.dim('Reply to:')} #${parentId}`);
    }

    const inline = comment.inline;
    if (inline?.path) {
      const line = inline.to ?? inline.from;
      this.output.text(
        `${this.output.dim('File:')}     ${inline.path}${line !== undefined ? `:${line}` : ''}`
      );
    }

    if (comment.resolution) {
      const resolvedBy = getUserDisplayName(comment.resolution.user);
      if (resolvedBy) {
        this.output.text(`${this.output.dim('Resolved by:')} ${resolvedBy}`);
      }
    }

    this.output.text('');
    this.output.text(
      comment.deleted
        ? '[deleted]'
        : (getRawContent(comment.content) ?? '[no content]')
    );
    this.output.text('');
  }

  private renderState(comment: PullrequestComment): string {
    if (comment.pending) {
      return this.output.gray('[pending]');
    }
    return comment.resolution
      ? this.output.green('[resolved]')
      : this.output.yellow('[unresolved]');
  }
}
