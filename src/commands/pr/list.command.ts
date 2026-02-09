/**
 * List PRs command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi, Pullrequest } from '../../generated/api.js';
import { collectPages, parseLimit } from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';

export interface ListPRsOptions extends GlobalOptions {
  state?: string;
  limit?: string;
}

export class ListPRsCommand extends BaseCommand<ListPRsOptions, void> {
  public readonly name = 'list';
  public readonly description = 'List pull requests';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListPRsOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const state = (options.state || 'OPEN') as
      | 'OPEN'
      | 'MERGED'
      | 'DECLINED'
      | 'SUPERSEDED';
    const limit = parseLimit(options.limit);

    const values = await collectPages<Pullrequest>({
      limit,
      fetchPage: async (page, pagelen) => {
        const response =
          await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsGet(
            {
              workspace: repoContext.workspace,
              repoSlug: repoContext.repoSlug,
              state,
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
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        state,
        count: values.length,
        pullRequests: values,
      });
      return;
    }

    if (values.length === 0) {
      this.output.text(`No ${state.toLowerCase()} pull requests found`);
      return;
    }

    const rows = values.map((pr: Pullrequest) => {
      const title = pr.draft ? `[DRAFT] ${pr.title}` : pr.title;
      const source = pr.source as { branch?: { name?: string } } | undefined;
      const destination = pr.destination as
        | { branch?: { name?: string } }
        | undefined;
      return [
        `#${pr.id}`,
        this.truncate(title ?? '', 50),
        pr.author?.display_name ?? 'Unknown',
        `${source?.branch?.name ?? 'unknown'} → ${destination?.branch?.name ?? 'unknown'}`,
      ];
    });

    this.output.table(['ID', 'TITLE', 'AUTHOR', 'BRANCHES'], rows);
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}
