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
import { RepositoriesWorkspaceGetRoleEnum } from '../../generated/api.js';
import { bbqlString } from '../../services/pr-filters.js';

export const REPO_ROLES = Object.values(
  RepositoriesWorkspaceGetRoleEnum
) as readonly string[];

export interface ListReposOptions {
  workspace?: string;
  limit?: string;
  all?: boolean;
  name?: string;
  query?: string;
  sort?: string;
  role?: string;
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
    const role = options.role
      ? (this.parseEnumOption(
          options.role,
          'role',
          REPO_ROLES
        ) as RepositoriesWorkspaceGetRoleEnum)
      : undefined;
    const query = this.buildQuery(options);

    await this.runList<Repository>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response = await this.repositoriesApi.repositoriesWorkspaceGet(
            {
              workspace,
              ...(role ? { role } : {}),
              ...(query ? { q: query } : {}),
              ...(options.sort ? { sort: options.sort } : {}),
            },
            {
              params: { page, pagelen },
            }
          );

          return response.data;
        },
        wrapperKey: 'repositories',
        jsonMetadata: { workspace },
        emptyMessage:
          query || role
            ? 'No repositories match the filters'
            : 'No repositories found',
        tableHeaders: ['REPOSITORY', 'VISIBILITY', 'DESCRIPTION'],
        mapRow: (repo) => [
          repo.full_name ?? '',
          repo.is_private ? 'private' : 'public',
          repo.description ?? '',
        ],
        flexColumns: [2],
        noun: 'repositories',
      },
      context
    );
  }

  private buildQuery(options: ListReposOptions): string | undefined {
    const clauses: string[] = [];
    if (options.name) {
      clauses.push(`name ~ ${bbqlString(options.name)}`);
    }
    if (options.query) {
      clauses.push(`(${options.query})`);
    }
    return clauses.length > 0 ? clauses.join(' AND ') : undefined;
  }
}
