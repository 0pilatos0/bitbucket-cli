/**
 * List a repository's download artifacts
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { DownloadsApi } from '../../generated/api.js';
import {
  resolveLimit,
  type PaginatedCollection,
} from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';

export interface ListDownloadsOptions extends GlobalOptions {
  limit?: string;
  all?: boolean;
}

/** The spec leaves the download artifact response unmodeled. */
interface Download {
  name?: string;
  size?: number;
  downloads?: number;
  created_on?: string;
  user?: { display_name?: string };
}

export class ListDownloadsCommand extends BaseCommand<
  ListDownloadsOptions,
  void
> {
  public readonly name = 'downloads.list';
  public readonly description = 'List download artifacts of a repository';

  constructor(
    private readonly downloadsApi: DownloadsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListDownloadsOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    resolveLimit(options);

    await this.runList<Download>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response =
            await this.downloadsApi.repositoriesWorkspaceRepoSlugDownloadsGet(
              {
                workspace: repoContext.workspace,
                repoSlug: repoContext.repoSlug,
              },
              { params: { page, pagelen } }
            );
          return response.data as unknown as PaginatedCollection<Download>;
        },
        wrapperKey: 'downloads',
        jsonMetadata: {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
        },
        emptyMessage: `No downloads found in ${repoContext.workspace}/${repoContext.repoSlug}`,
        tableHeaders: ['NAME', 'SIZE', 'DOWNLOADS', 'UPLOADED BY', 'CREATED'],
        mapRow: (download) => [
          this.output.bold(download.name ?? '-'),
          typeof download.size === 'number' ? String(download.size) : '-',
          typeof download.downloads === 'number'
            ? String(download.downloads)
            : '-',
          download.user?.display_name ?? '-',
          download.created_on
            ? this.output.formatDate(download.created_on)
            : '-',
        ],
        noun: 'downloads',
      },
      context
    );
  }
}
