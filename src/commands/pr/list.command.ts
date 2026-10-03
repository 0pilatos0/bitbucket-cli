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
import { resolveLimit } from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';
import { PR_STATES } from '../../types/pr.js';

export interface ListPRsOptions extends GlobalOptions {
  state?: string;
  limit?: string;
  all?: boolean;
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
    // Validate --limit before the --mine user lookup so an invalid limit
    // fails fast without an API call; runList re-resolves the same value.
    resolveLimit(options);
    const reviewerQuery = options.mine
      ? await this.buildMineFilter()
      : undefined;

    const arrow = this.output.symbol('→', '->');
    await this.runList<Pullrequest>(
      {
        options,
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
        wrapperKey: 'pullRequests',
        jsonMetadata: {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          state,
          filters: {
            mine: options.mine === true,
          },
        },
        emptyMessage: `No ${state.toLowerCase()} pull requests found`,
        tableHeaders: ['ID', 'TITLE', 'AUTHOR', 'BRANCHES', 'UPDATED'],
        mapRow: (pr: Pullrequest) => {
          const title = pr.draft ? `[DRAFT] ${pr.title}` : pr.title;
          const source = pr.source as
            { branch?: { name?: string } } | undefined;
          const destination = pr.destination as
            { branch?: { name?: string } } | undefined;
          return [
            `#${pr.id}`,
            title ?? '',
            pr.author?.display_name ?? 'Unknown',
            `${source?.branch?.name ?? 'unknown'} ${arrow} ${destination?.branch?.name ?? 'unknown'}`,
            pr.updated_on ? this.output.formatRelativeDate(pr.updated_on) : '-',
          ];
        },
        flexColumns: [1, 3],
        noun: 'pull requests',
      },
      context
    );
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
