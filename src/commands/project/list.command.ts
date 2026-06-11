/**
 * List projects command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Project, WorkspacesApi } from '../../generated/api.js';

export interface ListProjectsOptions {
  workspace?: string;
  limit?: string;
  all?: boolean;
}

export class ListProjectsCommand extends BaseCommand<
  ListProjectsOptions,
  void
> {
  public readonly name = 'list';
  public readonly description = 'List projects in a workspace';

  constructor(
    // Project listing lives on the Workspaces API surface in the Bitbucket
    // OpenAPI spec (GET /workspaces/{workspace}/projects).
    private readonly workspacesApi: WorkspacesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListProjectsOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await this.contextService.requireWorkspace(
      options.workspace ?? context.globalOptions.workspace
    );

    await this.runList<Project>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response =
            await this.workspacesApi.workspacesWorkspaceProjectsGet(
              { workspace },
              { params: { page, pagelen } }
            );
          return response.data;
        },
        wrapperKey: 'projects',
        jsonMetadata: { workspace },
        emptyMessage: `No projects found in workspace ${workspace}`,
        tableHeaders: ['KEY', 'NAME', 'PRIVACY', 'DESCRIPTION', 'UPDATED'],
        mapRow: (project) => [
          this.output.bold(project.key ?? ''),
          project.name ?? '',
          project.is_private ? 'private' : 'public',
          this.truncateText(
            project.description ?? '',
            50,
            context.globalOptions
          ),
          this.output.formatDate(project.updated_on ?? ''),
        ],
        noun: 'projects',
      },
      context
    );
  }
}
