/**
 * View commit command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { BaseCommit, CommitsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';
import { formatAuthor, shortHash } from './shared.js';

export interface ViewCommitOptions extends GlobalOptions {
  sha: string;
}

export class ViewCommitCommand extends BaseCommand<ViewCommitOptions, void> {
  public readonly name = 'view';
  public readonly description = 'View commit details';

  constructor(
    private readonly commitsApi: CommitsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ViewCommitOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const sha = this.requireOption(options.sha, 'sha');

    const response = await this.commitsApi
      .repositoriesWorkspaceRepoSlugCommitCommitGet({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        commit: sha,
      })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Commit ${sha} not found in ${repoContext.workspace}/${repoContext.repoSlug}.`
        )
      );

    const commit = response.data;

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        commit,
      });
      return;
    }

    const parents = (commit.parents ?? [])
      .map((parent) => shortHash(parent.hash))
      .join(', ');

    this.output.text(
      `${this.output.bold('commit')} ${this.output.highlight(commit.hash ?? sha)}`
    );
    this.output.text(
      `${this.output.dim('Author:')}  ${this.formatFullAuthor(commit.author)}`
    );
    this.output.text(
      `${this.output.dim('Date:')}    ${commit.date ? this.output.formatDate(commit.date) : '-'}`
    );
    this.output.text(`${this.output.dim('Parents:')} ${parents || '-'}`);
    this.output.text('');
    for (const line of (commit.message ?? '').trimEnd().split('\n')) {
      this.output.text(`    ${line}`);
    }
  }

  /**
   * Full author line: keep the raw "Name <email>" when available (it carries
   * the email), otherwise the matched account's display name.
   */
  private formatFullAuthor(author: BaseCommit['author']): string {
    return author?.raw ?? formatAuthor(author);
  }
}
