/**
 * List repositories command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { RepositoriesApi, Repository } from '../../generated/api.js';
import { collectPages, parseLimit } from '../../services/pagination.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface ListReposOptions {
  workspace?: string;
  limit?: string;
}

export class ListReposCommand extends BaseCommand<ListReposOptions, void> {
  public readonly name = 'list';
  public readonly description = 'List repositories';

  constructor(
    private readonly repositoriesApi: RepositoriesApi,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListReposOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await this.resolveWorkspace(
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
      this.output.json({
        workspace,
        count: repos.length,
        repositories: repos,
      });
      return;
    }

    if (repos.length === 0) {
      this.output.text('No repositories found');
      return;
    }

    const rows = repos.map((repo) => [
      repo.full_name ?? '',
      repo.is_private ? 'private' : 'public',
      (repo.description || '').substring(0, 50),
    ]);

    this.output.table(['REPOSITORY', 'VISIBILITY', 'DESCRIPTION'], rows);
  }

  private async resolveWorkspace(workspace?: string): Promise<string> {
    if (workspace) {
      return workspace;
    }

    const config = await this.configService.getConfig();

    if (!config.defaultWorkspace) {
      throw new BBError({
        code: ErrorCode.CONTEXT_WORKSPACE_NOT_FOUND,
        message:
          'No workspace specified. Use --workspace option or set a default workspace.',
      });
    }

    return config.defaultWorkspace;
  }
}
