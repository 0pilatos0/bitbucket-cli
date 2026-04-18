/**
 * Delete snippet comment command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { SnippetsApi } from '../../generated/api.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface DeleteSnippetCommentOptions {
  workspace?: string;
  yes?: boolean;
}

export class DeleteSnippetCommentCommand extends BaseCommand<
  { snippetId: string; commentId: string } & DeleteSnippetCommentOptions,
  void
> {
  public readonly name = 'delete';
  public readonly description = 'Delete a comment on a snippet';

  constructor(
    private readonly snippetsApi: SnippetsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: {
      snippetId: string;
      commentId: string;
    } & DeleteSnippetCommentOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await this.contextService.requireWorkspace(
      options.workspace ?? context.globalOptions.workspace
    );

    const commentId = this.parseIntOption(options.commentId, 'comment-id');

    if (!options.yes) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          `This will permanently delete comment #${commentId} on snippet ${options.snippetId}.\n` +
          'Use --yes to confirm deletion.',
      });
    }

    await this.snippetsApi.snippetsWorkspaceEncodedIdCommentsCommentIdDelete({
      workspace,
      encodedId: options.snippetId,
      commentId,
    });

    if (context.globalOptions.json) {
      this.output.json({
        success: true,
        snippetId: options.snippetId,
        commentId,
      });
      return;
    }

    this.output.success(
      `Deleted comment #${commentId} on snippet ${options.snippetId}`
    );
  }
}
