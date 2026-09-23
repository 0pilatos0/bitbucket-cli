/**
 * Delete branch restriction command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { BranchRestrictionsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface DeleteBranchRestrictionOptions extends GlobalOptions {
  id: string;
  yes?: boolean;
}

export class DeleteBranchRestrictionCommand extends BaseCommand<
  DeleteBranchRestrictionOptions,
  void
> {
  public readonly name = 'delete';
  public readonly description = 'Delete a branch restriction rule';

  constructor(
    private readonly branchRestrictionsApi: BranchRestrictionsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: DeleteBranchRestrictionOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const id = this.parsePositiveInt(options.id, 'id');

    await this.requireConfirmation(
      options.yes,
      `This will permanently delete branch restriction ${id} in ${repoContext.workspace}/${repoContext.repoSlug}.`,
      context
    );

    await this.branchRestrictionsApi
      .repositoriesWorkspaceRepoSlugBranchRestrictionsIdDelete({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        id: String(id),
      })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Branch restriction ${id} not found in ${repoContext.workspace}/${repoContext.repoSlug}.`
        )
      );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        id,
      });
      return;
    }

    this.output.success(`Deleted branch restriction ${id}`);
  }
}
