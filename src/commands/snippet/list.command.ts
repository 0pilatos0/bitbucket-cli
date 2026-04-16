/**
 * List snippets command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Snippet, SnippetsApi } from '../../generated/api.js';
import { SnippetsWorkspaceGetRoleEnum } from '../../generated/api.js';
import { collectPages, parseLimit } from '../../services/pagination.js';
import { getUserDisplayName } from '../../services/response-parsers.js';
import { resolveWorkspace } from '../../services/workspace-resolver.js';

const VALID_ROLES = Object.values(SnippetsWorkspaceGetRoleEnum) as readonly (
  | 'owner'
  | 'contributor'
  | 'member'
)[];

export interface ListSnippetsOptions {
  workspace?: string;
  role?: string;
  limit?: string;
}

export class ListSnippetsCommand extends BaseCommand<
  ListSnippetsOptions,
  void
> {
  public readonly name = 'list';
  public readonly description = 'List snippets';

  constructor(
    private readonly snippetsApi: SnippetsApi,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListSnippetsOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await resolveWorkspace(
      this.configService,
      options.workspace ?? context.globalOptions.workspace
    );
    const limit = parseLimit(options.limit);

    const role = options.role
      ? this.parseEnumOption(options.role, 'role', VALID_ROLES)
      : undefined;

    const snippets = await collectPages<Snippet>({
      limit,
      fetchPage: async (page, pagelen) => {
        const response = await this.snippetsApi.snippetsWorkspaceGet(
          {
            workspace,
            role: role as 'owner' | 'contributor' | 'member' | undefined,
          },
          {
            params: { page, pagelen },
          }
        );

        return response.data;
      },
    });

    if (context.globalOptions.json) {
      this.output.json({
        workspace,
        count: snippets.length,
        snippets,
      });
      return;
    }

    if (snippets.length === 0) {
      this.output.text('No snippets found');
      return;
    }

    const rows = snippets.map((snippet) => [
      String(snippet.id ?? ''),
      snippet.title ?? '',
      snippet.is_private ? 'private' : 'public',
      getUserDisplayName(snippet.creator) ?? '',
      this.output.formatDate(snippet.updated_on ?? ''),
    ]);

    this.output.table(
      ['ID', 'TITLE', 'VISIBILITY', 'CREATOR', 'UPDATED'],
      rows
    );
  }
}
