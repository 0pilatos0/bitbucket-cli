/**
 * List workspaces command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type { IOutputService } from '../../core/interfaces/services.js';
import type { WorkspaceAccess, WorkspacesApi } from '../../generated/api.js';
import { resolveLimit } from '../../services/pagination.js';

export interface ListWorkspacesOptions {
  limit?: string;
  all?: boolean;
}

export class ListWorkspacesCommand extends BaseCommand<
  ListWorkspacesOptions,
  void
> {
  public readonly name = 'list';
  public readonly description = 'List workspaces you are a member of';

  constructor(
    private readonly workspacesApi: WorkspacesApi,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListWorkspacesOptions,
    context: CommandContext
  ): Promise<void> {
    resolveLimit(options);

    await this.runList<WorkspaceAccess>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          // GET /workspaces (list all workspaces) was removed upstream along
          // with the native issue tracker; /user/workspaces lists the
          // workspaces the authenticated user is a member of. page and
          // pagelen go through raw axios params — the typed request
          // interface only models sort/administrator.
          const response = await this.workspacesApi.userWorkspacesGet(
            {},
            { params: { page, pagelen } }
          );
          return response.data;
        },
        wrapperKey: 'workspaces',
        emptyMessage: 'No workspaces found (you are not a member of any)',
        tableHeaders: ['SLUG', 'UUID', 'ADMIN'],
        mapRow: (access) => [
          this.output.bold(access.workspace?.slug ?? ''),
          access.workspace?.uuid ?? '',
          access.administrator ? 'yes' : 'no',
        ],
        noun: 'workspaces',
      },
      context
    );

    if (!context.globalOptions.json) {
      this.output.text(
        this.output.dim(
          'Use a slug with -w <slug> or set a default: bb config set defaultWorkspace <slug>'
        )
      );
    }
  }
}
