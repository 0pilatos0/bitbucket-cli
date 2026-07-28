/**
 * List comments on PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  PullrequestComment,
  PullrequestsApi,
} from '../../generated/api.js';
import {
  getRawContent,
  getUserDisplayName,
} from '../../services/response-parsers.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface ListCommentsPROptions extends GlobalOptions {
  limit?: string;
  all?: boolean;
  resolved?: boolean;
  unresolved?: boolean;
}

export class ListCommentsPRCommand extends BaseCommand<
  { id: string } & ListCommentsPROptions,
  void
> {
  public readonly name = 'comments';
  public readonly description = 'List comments on a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & ListCommentsPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId = this.parsePositiveInt(options.id, 'id');

    if (options.resolved && options.unresolved) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: '--resolved and --unresolved cannot be combined',
      });
    }
    const resolutionFilter = options.resolved
      ? 'resolved'
      : options.unresolved
        ? 'unresolved'
        : null;

    await this.runList<PullrequestComment>(
      {
        options,
        shouldInclude: (comment) => {
          if (resolutionFilter === null) {
            return true;
          }
          const isResolved = comment.resolution != null;
          return resolutionFilter === 'resolved' ? isResolved : !isResolved;
        },
        fetchPage: async (page, pagelen) => {
          const response =
            await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsGet(
              {
                workspace: repoContext.workspace,
                repoSlug: repoContext.repoSlug,
                pullRequestId: prId,
              },
              {
                params: { page, pagelen },
              }
            );

          return response.data;
        },
        wrapperKey: 'comments',
        jsonMetadata: {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
          filters: {
            resolution: resolutionFilter,
          },
        },
        emptyMessage: () =>
          resolutionFilter !== null
            ? 'No comments matched the requested filter'
            : 'No comments found on this pull request',
        tableHeaders: ['ID', 'Author', 'Content', 'Status', 'Date'],
        mapRow: (comment) => {
          const content = getRawContent(comment.content) ?? '';
          return [
            comment.id?.toString() ?? '',
            getUserDisplayName(comment.user) ?? 'Unknown',
            comment.deleted
              ? '[deleted]'
              : this.truncateText(content, 60, context.globalOptions),
            comment.resolution
              ? 'resolved'
              : comment.pending
                ? 'pending'
                : 'open',
            this.output.formatDate(comment.created_on ?? ''),
          ];
        },
        noun: 'comments',
      },
      context
    );
  }
}
