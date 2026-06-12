/**
 * View project command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Project, ProjectsApi } from '../../generated/api.js';
import { getLinkHref } from '../../services/response-parsers.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface ViewProjectOptions {
  key: string;
  workspace?: string;
}

export class ViewProjectCommand extends BaseCommand<ViewProjectOptions, void> {
  public readonly name = 'view';
  public readonly description = 'View project details';

  constructor(
    private readonly projectsApi: ProjectsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ViewProjectOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await this.contextService.requireWorkspace(
      options.workspace ?? context.globalOptions.workspace
    );
    // Bitbucket stores project keys uppercased; normalize so lowercase input
    // from humans and scripts resolves the same project.
    const projectKey = this.requireOption(options.key, 'key')
      .trim()
      .toUpperCase();

    const response = await this.projectsApi
      .workspacesWorkspaceProjectsProjectKeyGet({ projectKey, workspace })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Project ${projectKey} not found in workspace ${workspace}.`
        )
      );

    const project = response.data;

    if (context.globalOptions.json) {
      await this.output.json({ workspace, project });
      return;
    }

    this.renderProject(project);
  }

  private renderProject(project: Project): void {
    const visibility = project.is_private ? 'private' : 'public';

    this.output.text('');
    this.output.text(
      `${this.output.bold(project.key ?? '')}  ${project.name ?? ''}  ${this.output.gray(`[${visibility}]`)}`
    );
    this.output.separator();

    if (project.description) {
      this.output.text(project.description);
      this.output.text('');
    }

    if (project.uuid) {
      this.output.text(`UUID:        ${project.uuid}`);
    }
    if (project.created_on) {
      this.output.text(
        `Created:     ${this.output.formatDate(project.created_on)}`
      );
    }
    if (project.updated_on) {
      this.output.text(
        `Updated:     ${this.output.formatDate(project.updated_on)}`
      );
    }

    const url =
      getLinkHref(project.links, 'html') ?? getLinkHref(project.links, 'self');
    if (url) {
      this.output.text('');
      this.output.text(this.output.cyan(url));
    }

    this.output.text('');
  }
}
