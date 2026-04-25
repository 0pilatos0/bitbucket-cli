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
import { collectPages, parseLimit } from '../../services/pagination.js';

export interface ListReposOptions {
  workspace?: string;
  limit?: string;
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
    const limit = parseLimit(options.limit);

    const repos = await collectPages<Repository>({
      limit,
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
    });

    if (context.globalOptions.json) {
      await this.output.json({
        workspace,
        count: repos.length,
        repositories: repos,
      });
      return;
    }

    if (repos.length === 0) {
      this.output.info('No repositories found');
      return;
    }

    const rows = repos.map((repo) => [
      repo.full_name ?? '',
      repo.is_private ? 'private' : 'public',
      (repo.description || '').substring(0, 50),
    ]);

    this.output.table(['REPOSITORY', 'VISIBILITY', 'DESCRIPTION'], rows);
  }
}
