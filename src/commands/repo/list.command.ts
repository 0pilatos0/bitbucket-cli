/**
 * List repositories command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { RepositoriesApi } from '../../generated/api.js';
import { toArray } from '../../types/api-helpers.js';

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
    _context: CommandContext
  ): Promise<void> {
    const workspace = await this.resolveWorkspace(options.workspace);
    const limit = Number.parseInt(options.limit || '25', 10);

    const response = await this.repositoriesApi.repositoriesWorkspaceGet({
      workspace,
    });

    const repos = toArray(response.data.values).slice(0, limit);

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
      throw new Error(
        'No workspace specified. Use --workspace option or set a default workspace.'
      );
    }

    return config.defaultWorkspace;
  }
}
