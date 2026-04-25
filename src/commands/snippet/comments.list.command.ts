/**
 * List snippet comments command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { SnippetComment, SnippetsApi } from '../../generated/api.js';
import { collectPages, parseLimit } from '../../services/pagination.js';
import {
  getRawContent,
  getUserDisplayName,
} from '../../services/response-parsers.js';

export interface ListSnippetCommentsOptions {
  workspace?: string;
  limit?: string;
}

export class ListSnippetCommentsCommand extends BaseCommand<
  { id: string } & ListSnippetCommentsOptions,
  void
> {
  public readonly name = 'list';
  public readonly description = 'List comments on a snippet';

  constructor(
    private readonly snippetsApi: SnippetsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & ListSnippetCommentsOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await this.contextService.requireWorkspace(
      options.workspace ?? context.globalOptions.workspace
    );
    const limit = parseLimit(options.limit);

    const comments = await collectPages<SnippetComment>({
      limit,
      fetchPage: async (page, pagelen) => {
        const response =
          await this.snippetsApi.snippetsWorkspaceEncodedIdCommentsGet(
            {
              workspace,
              encodedId: options.id,
            },
            {
              params: { page, pagelen },
            }
          );

        return response.data;
      },
    });

    if (context.globalOptions.json) {
      await this.output.json({
        workspace,
        snippetId: options.id,
        count: comments.length,
        comments,
      });
      return;
    }

    if (comments.length === 0) {
      this.output.info('No comments found on this snippet');
      return;
    }

    const rows = comments.map((comment) => {
      const content = getRawContent(comment.content) ?? '';
      return [
        String(comment.id ?? ''),
        getUserDisplayName(comment.user) ?? 'Unknown',
        this.output.formatDate(comment.created_on ?? ''),
        this.output.truncate(content, 60),
      ];
    });

    this.output.table(['ID', 'AUTHOR', 'DATE', 'CONTENT'], rows);
  }
}
