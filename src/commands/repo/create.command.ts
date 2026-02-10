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
import { getCloneLinks, getLinkHref } from '../../services/response-parsers.js';
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
    const repoUrl = getLinkHref(repo.links, 'html') ?? '';
    this.output.text(`  ${this.output.dim('URL:')} ${repoUrl}`);

    const sshClone = getCloneLinks(repo.links).find(
      (cloneLink) => cloneLink.name === 'ssh'
    );
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
