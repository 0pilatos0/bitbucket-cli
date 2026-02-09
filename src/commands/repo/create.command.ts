/**
 * Create repository command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { RepositoriesApi } from '../../generated/api.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface CreateRepoOptions {
  workspace?: string;
  description?: string;
  private?: boolean;
  public?: boolean;
  project?: string;
}

export class CreateRepoCommand extends BaseCommand<
  { name: string } & CreateRepoOptions,
  void
> {
  public readonly name = 'create';
  public readonly description = 'Create a new repository';

  constructor(
    private readonly repositoriesApi: RepositoriesApi,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { name: string } & CreateRepoOptions,
    context: CommandContext
  ): Promise<void> {
    const { name, description, project } = options;
    const isPublic = options.public === true;

    const workspace = await this.resolveWorkspace(options.workspace);

    const request: {
      type: 'repository';
      scm: 'git';
      name: string;
      is_private: boolean;
      description?: string;
      project?: { type: 'project'; key: string };
    } = {
      type: 'repository',
      scm: 'git',
      name,
      is_private: !isPublic,
    };

    if (description) {
      request.description = description;
    }

    if (project) {
      request.project = { type: 'project', key: project };
    }

    const response =
      await this.repositoriesApi.repositoriesWorkspaceRepoSlugPost({
        workspace,
        repoSlug: name,
        body: request,
      });

    const repo = response.data;

    if (context.globalOptions.json) {
      this.output.json(repo);
      return;
    }

    this.output.success(`Created repository ${repo.full_name}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.output.text(
      `  ${this.output.dim('URL:')} ${(repo.links as any)?.html?.href}`
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sshClone = Array.from((repo.links as any)?.clone ?? []).find(
      (c: any) => c.name === 'ssh'
    ) as { href?: string } | undefined;
    if (sshClone?.href) {
      this.output.text(
        `  ${this.output.dim('Clone:')} git clone ${sshClone.href}`
      );
    }
  }

  private async resolveWorkspace(workspace?: string): Promise<string> {
    if (workspace) {
      return workspace;
    }

    const config = await this.configService.getConfig();

    if (!config.defaultWorkspace) {
      throw new BBError({
        code: ErrorCode.CONTEXT_WORKSPACE_NOT_FOUND,
        message:
          'No workspace specified. Use --workspace option or set a default workspace.',
      });
    }

    return config.defaultWorkspace;
  }
}
