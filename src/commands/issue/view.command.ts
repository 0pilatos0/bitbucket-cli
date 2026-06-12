/**
 * View issue command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Issue, IssueTrackerApi } from '../../generated/api.js';
import { getLinkHref } from '../../services/response-parsers.js';
import type { GlobalOptions } from '../../types/config.js';
import { formatIssueUser, rethrowIssueNotFound } from './shared.js';

export interface ViewIssueOptions extends GlobalOptions {
  id: string;
}

export class ViewIssueCommand extends BaseCommand<ViewIssueOptions, void> {
  public readonly name = 'view';
  public readonly description = 'View issue details';

  constructor(
    private readonly issueTrackerApi: IssueTrackerApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ViewIssueOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const response = await this.issueTrackerApi
      .repositoriesWorkspaceRepoSlugIssuesIssueIdGet({
        issueId: options.id,
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
      })
      .catch((error: unknown) =>
        rethrowIssueNotFound(
          error,
          options.id,
          repoContext.workspace,
          repoContext.repoSlug
        )
      );

    const issue = response.data;

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        issue,
      });
      return;
    }

    this.renderIssue(issue);
  }

  private renderIssue(issue: Issue): void {
    this.output.text('');
    this.output.text(
      `${this.output.bold(`#${issue.id ?? '?'}`)}  ${issue.title ?? 'Untitled'}  ${this.output.gray(`[${issue.state ?? 'unknown'}]`)}`
    );
    this.output.separator();

    this.output.text(`Kind:       ${issue.kind ?? '-'}`);
    this.output.text(`Priority:   ${issue.priority ?? '-'}`);
    this.output.text(`Reporter:   ${formatIssueUser(issue.reporter)}`);
    this.output.text(`Assignee:   ${formatIssueUser(issue.assignee)}`);

    if (issue.created_on) {
      this.output.text(
        `Created:    ${this.output.formatDate(issue.created_on)}`
      );
    }
    if (issue.updated_on) {
      this.output.text(
        `Updated:    ${this.output.formatDate(issue.updated_on)}`
      );
    }

    this.output.text(`Votes:      ${issue.votes ?? 0}`);

    const body = issue.content?.raw;
    if (body) {
      this.output.text('');
      this.output.text(body);
    }

    const url =
      getLinkHref(issue.links, 'html') ?? getLinkHref(issue.links, 'self');
    if (url) {
      this.output.text('');
      this.output.text(this.output.cyan(url));
    }

    this.output.text('');
  }
}
