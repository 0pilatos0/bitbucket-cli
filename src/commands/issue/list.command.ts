/**
 * List issues command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Issue, IssueTrackerApi } from '../../generated/api.js';
import { resolveLimit } from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';
import {
  cliStateToApi,
  DEFAULT_ISSUE_SORT,
  DEFAULT_OPEN_STATES_CLAUSE,
  formatIssueUser,
  ISSUE_KINDS,
  ISSUE_STATES,
  quoteQueryValue,
  rethrowTrackerDisabled,
} from './shared.js';

export interface ListIssuesOptions extends GlobalOptions {
  state?: string;
  kind?: string;
  assignee?: string;
  reporter?: string;
  query?: string;
  limit?: string;
  all?: boolean;
}

export class ListIssuesCommand extends BaseCommand<ListIssuesOptions, void> {
  public readonly name = 'list';
  public readonly description = 'List issues in a repository';

  constructor(
    private readonly issueTrackerApi: IssueTrackerApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListIssuesOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    // Validate --limit before the enum options so an invalid limit fails
    // fast; runList re-resolves the same value.
    resolveLimit(options);

    const state = options.state
      ? this.parseEnumOption(options.state, 'state', ISSUE_STATES)
      : undefined;
    const kind = options.kind
      ? this.parseEnumOption(options.kind, 'kind', ISSUE_KINDS)
      : undefined;

    const q = this.buildQuery({ ...options, state, kind });
    const hasFilters = Boolean(
      state ?? kind ?? options.assignee ?? options.reporter ?? options.query
    );

    await this.runList<Issue>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          // The generated request interface only models workspace/repoSlug;
          // page, pagelen, q, and sort all go through raw axios params.
          const response = await this.issueTrackerApi
            .repositoriesWorkspaceRepoSlugIssuesGet(
              {
                workspace: repoContext.workspace,
                repoSlug: repoContext.repoSlug,
              },
              { params: { page, pagelen, q, sort: DEFAULT_ISSUE_SORT } }
            )
            .catch((error: unknown) => rethrowTrackerDisabled(error));
          return response.data;
        },
        wrapperKey: 'issues',
        jsonMetadata: {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          filters: {
            ...(state ? { state } : {}),
            ...(kind ? { kind } : {}),
            ...(options.assignee ? { assignee: options.assignee } : {}),
            ...(options.reporter ? { reporter: options.reporter } : {}),
            ...(options.query ? { query: options.query } : {}),
            q,
          },
        },
        emptyMessage: () =>
          hasFilters
            ? 'No issues found matching the given filters'
            : 'No open issues found (try --state <state> or --query)',
        tableHeaders: [
          '#',
          'TITLE',
          'KIND',
          'PRIORITY',
          'STATE',
          'ASSIGNEE',
          'UPDATED',
        ],
        mapRow: (issue) => [
          `#${issue.id ?? '?'}`,
          this.truncateText(issue.title ?? '', 50, context.globalOptions),
          issue.kind ?? '-',
          issue.priority ?? '-',
          issue.state ?? '-',
          formatIssueUser(issue.assignee),
          issue.updated_on ? this.output.formatDate(issue.updated_on) : '-',
        ],
        noun: 'issues',
      },
      context
    );
  }

  /**
   * Compose the Bitbucket `q` filter expression. Clauses are AND-ed:
   *
   *  - no `--state` / `--query`: default to open-ish issues
   *    (`(state="new" OR state="open")`), mirroring `gh issue list`;
   *  - `--state <s>`: exact state match (CLI `on-hold` maps to `"on hold"`);
   *  - `--kind` / `--assignee` / `--reporter`: exact field matches;
   *  - `--query <raw-q>`: escape hatch, used verbatim (parenthesized) and
   *    suppressing the default state clause so it can express its own.
   */
  private buildQuery(filters: {
    state?: string;
    kind?: string;
    assignee?: string;
    reporter?: string;
    query?: string;
  }): string {
    const clauses: string[] = [];

    if (filters.query) {
      clauses.push(`(${filters.query})`);
    }
    if (filters.state) {
      clauses.push(`state=${quoteQueryValue(cliStateToApi(filters.state))}`);
    } else if (!filters.query) {
      clauses.push(DEFAULT_OPEN_STATES_CLAUSE);
    }
    if (filters.kind) {
      clauses.push(`kind=${quoteQueryValue(filters.kind)}`);
    }
    if (filters.assignee) {
      clauses.push(`assignee.username=${quoteQueryValue(filters.assignee)}`);
    }
    if (filters.reporter) {
      clauses.push(`reporter.username=${quoteQueryValue(filters.reporter)}`);
    }

    return clauses.join(' AND ');
  }
}
