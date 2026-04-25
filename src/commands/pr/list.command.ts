/**
 * List PRs command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  PullrequestsApi,
  Pullrequest,
  UsersApi,
} from '../../generated/api.js';
import { collectPages, parseLimit } from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';
import { PR_STATES } from '../../types/pr.js';

export interface ListPRsOptions extends GlobalOptions {
  state?: string;
  limit?: string;
  mine?: boolean;
}

export class ListPRsCommand extends BaseCommand<ListPRsOptions, void> {
  public readonly name = 'list';
  public readonly description = 'List pull requests';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly usersApi: UsersApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListPRsOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const state = options.state
      ? this.parseEnumOption(options.state, 'state', PR_STATES)
      : 'OPEN';
    const limit = parseLimit(options.limit);
    const reviewerQuery = options.mine
      ? await this.buildMineFilter()
      : undefined;

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
              params: {
                page,
                pagelen,
                ...(reviewerQuery ? { q: reviewerQuery } : {}),
              },
            }
          );

        return response.data;
      },
    });

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        state,
        filters: {
          mine: options.mine === true,
        },
        count: values.length,
        pullRequests: values,
      });
      return;
    }

    if (values.length === 0) {
      this.output.info(`No ${state.toLowerCase()} pull requests found`);
      return;
    }

    const arrow = this.output.symbol('→', '->');
    const rows = values.map((pr: Pullrequest) => {
      const title = pr.draft ? `[DRAFT] ${pr.title}` : pr.title;
      const source = pr.source as { branch?: { name?: string } } | undefined;
      const destination = pr.destination as
        | { branch?: { name?: string } }
        | undefined;
      return [
        `#${pr.id}`,
        this.truncateText(title ?? '', 50, context.globalOptions),
        pr.author?.display_name ?? 'Unknown',
        `${source?.branch?.name ?? 'unknown'} ${arrow} ${destination?.branch?.name ?? 'unknown'}`,
      ];
    });

    this.output.table(['ID', 'TITLE', 'AUTHOR', 'BRANCHES'], rows);
  }

  private async buildMineFilter(): Promise<string | undefined> {
    const response = await this.usersApi.userGet();
    const userUuid = response.data.uuid;

    if (!userUuid) {
      this.output.warning(
        'Could not determine your user UUID. Showing all pull requests.'
      );
      return undefined;
    }

    return `reviewers.uuid="${userUuid}"`;
  }
}
