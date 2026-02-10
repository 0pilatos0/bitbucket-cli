/**
 * View repository command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { RepositoriesApi } from '../../generated/api.js';
import { getCloneLinks, getLinkHref } from '../../services/response-parsers.js';
import type { GlobalOptions } from '../../types/config.js';

export interface ViewRepoOptions extends GlobalOptions {
  repository?: string;
}

export class ViewRepoCommand extends BaseCommand<ViewRepoOptions, void> {
  public readonly name = 'view';
  public readonly description = 'View repository details';

  constructor(
    private readonly repositoriesApi: RepositoriesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ViewRepoOptions,
    context: CommandContext
  ): Promise<void> {
    let contextOptions = { ...context.globalOptions, ...options };

    if (options.repository) {
      const parts = options.repository.split('/');
      if (parts.length === 2) {
        contextOptions.workspace = parts[0];
        contextOptions.repo = parts[1];
      } else {
        contextOptions.repo = options.repository;
      }
    }

    const repoContext =
      await this.contextService.requireRepoContext(contextOptions);

    const response =
      await this.repositoriesApi.repositoriesWorkspaceRepoSlugGet({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
      });

    const repo = response.data;

    if (context.globalOptions.json) {
      this.output.json(repo);
      return;
    }

    this.output.text(this.output.bold(repo.full_name ?? ''));

    if (repo.description) {
      this.output.text(this.output.dim(repo.description));
    }

    this.output.text('');
    this.output.text(
      `  ${this.output.dim('Visibility:')} ${repo.is_private ? 'Private' : 'Public'}`
    );
    this.output.text(
      `  ${this.output.dim('Owner:')} ${repo.owner?.display_name ?? 'Unknown'}`
    );

    if (repo.language) {
      this.output.text(`  ${this.output.dim('Language:')} ${repo.language}`);
    }

    if (repo.mainbranch) {
      this.output.text(
        `  ${this.output.dim('Default branch:')} ${repo.mainbranch.name}`
      );
    }

    this.output.text(
      `  ${this.output.dim('Created:')} ${this.output.formatDate(repo.created_on ?? '')}`
    );
    this.output.text(
      `  ${this.output.dim('Updated:')} ${this.output.formatDate(repo.updated_on ?? '')}`
    );
    this.output.text('');
    const repoUrl = getLinkHref(repo.links, 'html') ?? '';
    this.output.text(`  ${this.output.dim('URL:')} ${repoUrl}`);

    const sshClone = getCloneLinks(repo.links).find(
      (cloneLink) => cloneLink.name === 'ssh'
    );
    if (sshClone?.href) {
      this.output.text(`  ${this.output.dim('SSH:')} ${sshClone.href}`);
    }
  }
}
