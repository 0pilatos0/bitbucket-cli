/**
 * Edit snippet comment command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { SnippetComment, SnippetsApi } from '../../generated/api.js';
import { resolveWorkspace } from '../../services/workspace-resolver.js';

export interface EditSnippetCommentOptions {
  workspace?: string;
}

export class EditSnippetCommentCommand extends BaseCommand<
  {
    snippetId: string;
    commentId: string;
    message: string;
  } & EditSnippetCommentOptions,
  void
> {
  public readonly name = 'edit';
  public readonly description = 'Edit a comment on a snippet';

  constructor(
    private readonly snippetsApi: SnippetsApi,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: {
      snippetId: string;
      commentId: string;
      message: string;
    } & EditSnippetCommentOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await resolveWorkspace(
      this.configService,
      options.workspace ?? context.globalOptions.workspace
    );

    const commentId = this.parseIntOption(options.commentId, 'comment-id');

    const body = {
      type: 'snippet_comment',
      content: {
        raw: options.message,
      },
    } as unknown as SnippetComment;

    const response =
      await this.snippetsApi.snippetsWorkspaceEncodedIdCommentsCommentIdPut({
        workspace,
        encodedId: options.snippetId,
        commentId,
        body,
      });

    if (context.globalOptions.json) {
      this.output.json({
        success: true,
        snippetId: options.snippetId,
        comment: response.data,
      });
      return;
    }

    this.output.success(
      `Updated comment #${commentId} on snippet ${options.snippetId}`
    );
  }
}
