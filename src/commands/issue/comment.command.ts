/**
 * Comment on issue command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { IssueTrackerApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowIssueNotFound } from './shared.js';

export interface CommentIssueOptions extends GlobalOptions {
  id: string;
  body?: string;
}

export class CommentIssueCommand extends BaseCommand<
  CommentIssueOptions,
  void
> {
  public readonly name = 'comment';
  public readonly description = 'Add a comment to an issue';

  constructor(
    private readonly issueTrackerApi: IssueTrackerApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: CommentIssueOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const body = this.requireOption(options.body, 'body');

    const response = await this.issueTrackerApi
      .repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsPost({
        issueId: options.id,
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        issueComment: {
          // 'type' is the ModelObject discriminator required on request bodies.
          type: 'issue_comment',
          content: { raw: body },
        },
      })
      .catch((error: unknown) =>
        rethrowIssueNotFound(
          error,
          options.id,
          repoContext.workspace,
          repoContext.repoSlug
        )
      );

    const comment = response.data;

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        comment,
      });
      return;
    }

    this.output.success(`Comment added to issue #${options.id}`);
  }
}
