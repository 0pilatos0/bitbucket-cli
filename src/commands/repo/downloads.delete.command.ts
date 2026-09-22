/**
 * Delete a repository download artifact
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { DownloadsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface DeleteDownloadOptions extends GlobalOptions {
  filename: string;
  yes?: boolean;
}

export class DeleteDownloadCommand extends BaseCommand<
  DeleteDownloadOptions,
  void
> {
  public readonly name = 'downloads.delete';
  public readonly description = 'Delete a download artifact from a repository';

  constructor(
    private readonly downloadsApi: DownloadsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: DeleteDownloadOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const filename = this.requireOption(options.filename, 'filename');

    this.requireConfirmation(
      options.yes,
      `This will permanently delete download '${filename}' from ` +
        `${repoContext.workspace}/${repoContext.repoSlug}.`
    );

    await this.downloadsApi
      .repositoriesWorkspaceRepoSlugDownloadsFilenameDelete({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        filename,
      })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Download '${filename}' not found in ${repoContext.workspace}/${repoContext.repoSlug}.`
        )
      );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        filename,
      });
      return;
    }

    this.output.success(
      `Deleted download '${filename}' from ${repoContext.workspace}/${repoContext.repoSlug}`
    );
  }
}
