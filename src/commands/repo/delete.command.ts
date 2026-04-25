/**
 * Delete repository command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { RepositoriesApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';

export interface DeleteRepoOptions extends GlobalOptions {
  yes?: boolean;
}

export class DeleteRepoCommand extends BaseCommand<
  { repository: string } & DeleteRepoOptions,
  void
> {
  public readonly name = 'delete';
  public readonly description = 'Delete a repository';

  constructor(
    private readonly repositoriesApi: RepositoriesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { repository: string } & DeleteRepoOptions,
    context: CommandContext
  ): Promise<void> {
    const { repository, yes } = options;

    let contextOptions = { ...context.globalOptions, ...options };
    const parts = repository.split('/');

    if (parts.length === 2) {
      contextOptions.workspace = parts[0];
      contextOptions.repo = parts[1];
    } else {
      contextOptions.repo = repository;
    }

    const repoContext =
      await this.contextService.requireRepoContext(contextOptions);

    this.requireConfirmation(
      yes,
      `This will permanently delete ${repoContext.workspace}/${repoContext.repoSlug}.`
    );

    await this.repositoriesApi.repositoriesWorkspaceRepoSlugDelete({
      workspace: repoContext.workspace,
      repoSlug: repoContext.repoSlug,
    });

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
      });
      return;
    }

    this.output.success(
      `Deleted repository ${repoContext.workspace}/${repoContext.repoSlug}`
    );
  }
}
