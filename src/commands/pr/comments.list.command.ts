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
import { collectPages, parseLimit } from '../../services/pagination.js';
import {
  getRawContent,
  getUserDisplayName,
} from '../../services/response-parsers.js';
import type { GlobalOptions } from '../../types/config.js';

export interface ListCommentsPROptions extends GlobalOptions {
  limit?: string;
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
    const limit = parseLimit(options.limit);

    const values = await collectPages<PullrequestComment>({
      limit,
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
    });

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pullRequestId: prId,
        count: values.length,
        comments: values,
      });
      return;
    }

    if (values.length === 0) {
      this.output.info('No comments found on this pull request');
      return;
    }

    const rows = values.map((comment) => {
      const content = getRawContent(comment.content) ?? '';
      return [
        comment.id?.toString() ?? '',
        getUserDisplayName(comment.user) ?? 'Unknown',
        comment.deleted
          ? '[deleted]'
          : this.truncateText(content, 60, context.globalOptions),
        this.output.formatDate(comment.created_on ?? ''),
      ];
    });

    this.output.table(['ID', 'Author', 'Content', 'Date'], rows);
  }
}
