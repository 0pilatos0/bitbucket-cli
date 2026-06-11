/**
 * Close issue command implementation — sugar for `bb issue edit --state
 * closed`, optionally posting a closing comment first.
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { IssueTrackerApi } from '../../generated/api.js';
import { IssueStateEnum } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowIssueNotFound, type IssueChanges } from './shared.js';

export interface CloseIssueOptions extends GlobalOptions {
  id: string;
  comment?: string;
}

export class CloseIssueCommand extends BaseCommand<CloseIssueOptions, void> {
  public readonly name = 'close';
  public readonly description = 'Close an issue';

  constructor(
    private readonly issueTrackerApi: IssueTrackerApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: CloseIssueOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const notFound = (error: unknown) =>
      rethrowIssueNotFound(
        error,
        options.id,
        repoContext.workspace,
        repoContext.repoSlug
      );

    // Post the closing comment first so the comment lands while the issue is
    // still open (matching `gh issue close --comment` ordering).
    if (options.comment !== undefined && options.comment !== '') {
      await this.issueTrackerApi
        .repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsPost({
          issueId: options.id,
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          issueComment: {
            type: 'issue_comment',
            content: { raw: options.comment },
          },
        })
        .catch(notFound);
    }

    const changes: IssueChanges = {
      type: 'issue',
      state: IssueStateEnum.Closed,
    };

    const response = await this.issueTrackerApi
      .repositoriesWorkspaceRepoSlugIssuesIssueIdPut(
        {
          issueId: options.id,
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
        },
        // The generated client omits the request body for this endpoint (the
        // OpenAPI spec doesn't model it); send it via the raw axios config.
        { data: changes }
      )
      .catch(notFound);

    const issue = response.data;

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        issue,
      });
      return;
    }

    this.output.success(`Issue #${options.id} closed`);
  }
}
