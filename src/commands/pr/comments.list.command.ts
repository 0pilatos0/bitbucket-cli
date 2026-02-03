/**
 * List comments on PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import {
  getContentRaw,
  getUserDisplayName,
  toArray,
} from '../../types/api-helpers.js';

export interface ListCommentsPROptions extends GlobalOptions {
  limit?: string;
  truncate?: boolean;
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
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const prId = Number.parseInt(options.id, 10);

    const response =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsGet(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
        }
      );

    const data = response.data;
    const values = toArray(data.values);

    if (values.length === 0) {
      this.output.info('No comments found on this pull request');
      return;
    }

    const rows = values.map((comment) => {
      const content = getContentRaw(comment.content) ?? '';
      return [
        comment.id?.toString() ?? '',
        getUserDisplayName(comment.user) ?? 'Unknown',
        comment.deleted
          ? '[deleted]'
          : options.truncate === false
            ? content
            : content.slice(0, 60) + (content.length > 60 ? '...' : ''),
        this.output.formatDate(comment.created_on ?? ''),
      ];
    });

    this.output.table(['ID', 'Author', 'Content', 'Date'], rows);
  }
}
