/**
 * View workspace command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Workspace, WorkspacesApi } from '../../generated/api.js';
import { getLinkHref } from '../../services/response-parsers.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface ViewWorkspaceOptions {
  /** Optional positional slug; falls back to the resolved workspace context */
  slug?: string;
  workspace?: string;
}

export class ViewWorkspaceCommand extends BaseCommand<
  ViewWorkspaceOptions,
  void
> {
  public readonly name = 'view';
  public readonly description = 'View workspace details';

  constructor(
    private readonly workspacesApi: WorkspacesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ViewWorkspaceOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace =
      options.slug ??
      (await this.contextService.requireWorkspace(
        options.workspace ?? context.globalOptions.workspace
      ));

    const response = await this.workspacesApi
      .workspacesWorkspaceGet({ workspace })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Workspace ${workspace} not found (or you do not have access to it).`
        )
      );

    const data = response.data;

    if (context.globalOptions.json) {
      await this.output.json({ workspace: data });
      return;
    }

    this.renderWorkspace(data);
  }

  private renderWorkspace(workspace: Workspace): void {
    const visibility = workspace.is_private ? 'private' : 'public';

    this.output.text('');
    this.output.text(
      `${this.output.bold(workspace.slug ?? '')}  ${workspace.name ?? ''}  ${this.output.gray(`[${visibility}]`)}`
    );
    this.output.separator();

    if (workspace.uuid) {
      this.output.text(`UUID:        ${workspace.uuid}`);
    }
    if (workspace.forking_mode) {
      this.output.text(`Forking:     ${workspace.forking_mode}`);
    }
    if (workspace.is_privacy_enforced !== undefined) {
      this.output.text(
        `Privacy:     ${workspace.is_privacy_enforced ? 'enforced' : 'not enforced'}`
      );
    }
    if (workspace.created_on) {
      this.output.text(
        `Created:     ${this.output.formatDate(workspace.created_on)}`
      );
    }
    if (workspace.updated_on) {
      this.output.text(
        `Updated:     ${this.output.formatDate(workspace.updated_on)}`
      );
    }

    const url =
      getLinkHref(workspace.links, 'html') ??
      getLinkHref(workspace.links, 'self');
    if (url) {
      this.output.text('');
      this.output.text(this.output.cyan(url));
    }

    this.output.text('');
  }
}
