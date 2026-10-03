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
import {
  bbqlString,
  CURRENT_USER,
  resolveUserUuid,
} from '../../services/pr-filters.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';
import { PR_STATES } from '../../types/pr.js';

export interface ListPRsOptions extends GlobalOptions {
  state?: string;
  limit?: string;
  all?: boolean;
  mine?: boolean;
  author?: string;
  reviewer?: string;
  source?: string;
  destination?: string;
  query?: string;
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
    // Validate --limit before any user lookup so an invalid limit fails fast
    // without an API call; runList re-resolves the same value.
    resolveLimit(options);
    const reviewer = this.resolveReviewerOption(options);
    const query = await this.buildQuery({ ...options, reviewer });

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
                  ...(query ? { q: query } : {}),
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
            author: options.author ?? null,
            reviewer: reviewer ?? null,
            source: options.source ?? null,
            destination: options.destination ?? null,
            query: options.query ?? null,
          },
        },
        emptyMessage: query
          ? `No ${state.toLowerCase()} pull requests match the filters`
          : `No ${state.toLowerCase()} pull requests found`,
        tableHeaders: ['ID', 'TITLE', 'AUTHOR', 'BRANCHES'],
        mapRow: (pr: Pullrequest) => {
          const title = pr.draft ? `[DRAFT] ${pr.title}` : pr.title;
          const source = pr.source as
            { branch?: { name?: string } } | undefined;
          const destination = pr.destination as
            { branch?: { name?: string } } | undefined;
          return [
            `#${pr.id}`,
            this.truncateText(title ?? '', 50, context.globalOptions),
            pr.author?.display_name ?? 'Unknown',
            `${source?.branch?.name ?? 'unknown'} ${arrow} ${destination?.branch?.name ?? 'unknown'}`,
          ];
        },
        noun: 'pull requests',
      },
      context
    );
  }

  /** `--mine` is shorthand for `--reviewer @me`. */
  private resolveReviewerOption(options: ListPRsOptions): string | undefined {
    if (!options.mine) {
      return options.reviewer;
    }
    if (options.reviewer && options.reviewer !== CURRENT_USER) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: `--mine means --reviewer ${CURRENT_USER}; it cannot be combined with --reviewer ${options.reviewer}.`,
        context: { reviewer: options.reviewer },
      });
    }
    return CURRENT_USER;
  }

  private async buildQuery(
    options: ListPRsOptions
  ): Promise<string | undefined> {
    const clauses: string[] = [];
    if (options.author) {
      const uuid = await resolveUserUuid(this.usersApi, options.author);
      clauses.push(`author.uuid=${bbqlString(uuid)}`);
    }
    if (options.reviewer) {
      const uuid = await resolveUserUuid(this.usersApi, options.reviewer);
      clauses.push(`reviewers.uuid=${bbqlString(uuid)}`);
    }
    if (options.source) {
      clauses.push(`source.branch.name=${bbqlString(options.source)}`);
    }
    if (options.destination) {
      clauses.push(
        `destination.branch.name=${bbqlString(options.destination)}`
      );
    }
    if (options.query) {
      clauses.push(`(${options.query})`);
    }
    return clauses.length > 0 ? clauses.join(' AND ') : undefined;
  }
}
