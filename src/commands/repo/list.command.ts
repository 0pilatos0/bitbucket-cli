/**
 * List repositories command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { RepositoriesApi, Repository } from '../../generated/api.js';

export interface ListReposOptions {
  workspace?: string;
  limit?: string;
  all?: boolean;
}

export class ListReposCommand extends BaseCommand<ListReposOptions, void> {
  public readonly name = 'list';
  public readonly description = 'List repositories';

  constructor(
    private readonly repositoriesApi: RepositoriesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListReposOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await this.contextService.requireWorkspace(
      options.workspace ?? context.globalOptions.workspace
    );
    await this.runList<Repository>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response = await this.repositoriesApi.repositoriesWorkspaceGet(
            {
              workspace,
            },
            {
              params: { page, pagelen },
            }
          );

          return response.data;
        },
        wrapperKey: 'repositories',
        jsonMetadata: { workspace },
        emptyMessage: 'No repositories found',
        tableHeaders: ['REPOSITORY', 'VISIBILITY', 'DESCRIPTION'],
        mapRow: (repo) => [
          repo.full_name ?? '',
          repo.is_private ? 'private' : 'public',
          this.truncateText(repo.description ?? '', 50, context.globalOptions),
        ],
        noun: 'repositories',
      },
      context
    );
  }
}
