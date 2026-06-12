/**
 * List workspaces command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type { IOutputService } from '../../core/interfaces/services.js';
import type { Workspace, WorkspacesApi } from '../../generated/api.js';
import { WorkspacesGetRoleEnum } from '../../generated/api.js';
import { resolveLimit } from '../../services/pagination.js';

export const WORKSPACE_ROLES = Object.values(
  WorkspacesGetRoleEnum
) as readonly ('owner' | 'collaborator' | 'member')[];

export interface ListWorkspacesOptions {
  role?: string;
  limit?: string;
  all?: boolean;
}

export class ListWorkspacesCommand extends BaseCommand<
  ListWorkspacesOptions,
  void
> {
  public readonly name = 'list';
  public readonly description = 'List workspaces you have access to';

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
    // Validate --limit before --role to keep validation error precedence
    // consistent with the other list commands; runList re-resolves the value.
    resolveLimit(options);

    const role = options.role
      ? this.parseEnumOption(options.role, 'role', WORKSPACE_ROLES)
      : undefined;

    await this.runList<Workspace>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          // The generated request interface models role/q/sort, while page
          // and pagelen go through raw axios params.
          const response = await this.workspacesApi.workspacesGet(
            { role },
            { params: { page, pagelen } }
          );
          return response.data;
        },
        wrapperKey: 'workspaces',
        jsonMetadata: {
          filters: { ...(role ? { role } : {}) },
        },
        emptyMessage: () =>
          role
            ? `No workspaces found for role "${role}"`
            : 'No workspaces found',
        tableHeaders: ['SLUG', 'NAME', 'PRIVACY', 'UUID'],
        mapRow: (workspace) => [
          this.output.bold(workspace.slug ?? ''),
          workspace.name ?? '',
          workspace.is_private ? 'private' : 'public',
          workspace.uuid ?? '',
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
