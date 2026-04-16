/**
 * Add snippet comment command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { SnippetComment, SnippetsApi } from '../../generated/api.js';
import { resolveWorkspace } from '../../services/workspace-resolver.js';

export interface AddSnippetCommentOptions {
  workspace?: string;
  message?: string;
}

export class AddSnippetCommentCommand extends BaseCommand<
  { id: string } & AddSnippetCommentOptions,
  void
> {
  public readonly name = 'add';
  public readonly description = 'Add a comment to a snippet';

  constructor(
    private readonly snippetsApi: SnippetsApi,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & AddSnippetCommentOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await resolveWorkspace(
      this.configService,
      options.workspace ?? context.globalOptions.workspace
    );

    const message = this.requireOption(
      options.message,
      'message',
      'Comment message is required. Use --message option.'
    );

    const body = {
      type: 'snippet_comment',
      content: {
        raw: message,
      },
    } as unknown as SnippetComment;

    const response =
      await this.snippetsApi.snippetsWorkspaceEncodedIdCommentsPost({
        workspace,
        encodedId: options.id,
        body,
      });

    const comment = response.data;
    const commentId = (comment as unknown as Record<string, unknown>).id;

    if (context.globalOptions.json) {
      this.output.json({
        success: true,
        snippetId: options.id,
        comment,
      });
      return;
    }

    this.output.success(
      `Added comment${commentId ? ` #${commentId}` : ''} to snippet ${options.id}`
    );
  }
}
