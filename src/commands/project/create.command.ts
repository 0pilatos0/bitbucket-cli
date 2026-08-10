/**
 * Create project command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { ProjectsApi } from '../../generated/api.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface CreateProjectOptions {
  workspace?: string;
  key?: string;
  name?: string;
  description?: string;
  private?: boolean;
  public?: boolean;
}

export class CreateProjectCommand extends BaseCommand<
  CreateProjectOptions,
  void
> {
  public readonly name = 'create';
  public readonly description = 'Create a new project in a workspace';

  constructor(
    private readonly projectsApi: ProjectsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: CreateProjectOptions,
    context: CommandContext
  ): Promise<void> {
    const rawKey = this.requireOption(options.key, 'key').trim();
    const name = this.requireOption(options.name, 'name');

    if (options.private && options.public) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: this.appendHelpHint(
          '--private and --public cannot both be set.'
        ),
      });
    }

    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(rawKey)) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: this.appendHelpHint(
          '--key must start with a letter and contain only letters, digits, and underscores (e.g. PROJ).'
        ),
        context: { key: rawKey },
      });
    }

    // Bitbucket requires uppercase project keys; normalize instead of failing.
    const key = rawKey.toUpperCase();

    const workspace = await this.contextService.requireWorkspace(
      options.workspace ?? context.globalOptions.workspace
    );

    const response = await this.projectsApi.workspacesWorkspaceProjectsPost({
      workspace,
      body: {
        type: 'project',
        key,
        name,
        ...(options.description ? { description: options.description } : {}),
        is_private: options.public !== true,
      },
    });

    const project = response.data;

    if (context.globalOptions.json) {
      await this.output.json({ workspace, project });
      return;
    }

    if (key !== rawKey) {
      this.output.info(
        `Project keys are uppercase on Bitbucket; using ${key}.`
      );
    }
    this.output.success(
      `Project ${project.key ?? key} created in ${workspace}`
    );
    this.output.text(
      `  ${this.output.dim('Create a repository in it:')} bb repo create <name> -p ${project.key ?? key}`
    );
  }
}
