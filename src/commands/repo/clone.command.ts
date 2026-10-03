/**
 * Clone command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IGitService,
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import {
  buildCloneUrl,
  getConfiguredProtocol,
} from '../../services/clone-url.js';
import { GIT_PROTOCOLS } from '../../types/config.js';
import type { GitProtocol } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface CloneOptions {
  directory?: string;
  protocol?: string;
}

export class CloneCommand extends BaseCommand<
  { repository: string } & CloneOptions,
  void
> {
  public readonly name = 'clone';
  public readonly description = 'Clone a Bitbucket repository';

  constructor(
    private readonly gitService: IGitService,
    private readonly contextService: IContextService,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { repository: string } & CloneOptions,
    context: CommandContext
  ): Promise<void> {
    const { repository, directory } = options;

    const protocol = await this.resolveProtocol(options.protocol);
    const repoUrl = await this.resolveRepositoryUrl(repository, protocol);
    await this.gitService.clone(repoUrl, directory);

    const targetDir = directory || this.extractRepoName(repository);

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        repository,
        path: targetDir,
        cloneUrl: repoUrl,
      });
      return;
    }

    this.output.success(`Cloned ${repository} into ${targetDir}`);
  }

  private async resolveProtocol(flag?: string): Promise<GitProtocol> {
    if (flag !== undefined) {
      return this.parseEnumOption(flag, 'protocol', GIT_PROTOCOLS);
    }
    return getConfiguredProtocol(await this.configService.getConfig());
  }

  private async resolveRepositoryUrl(
    repository: string,
    protocol: GitProtocol
  ): Promise<string> {
    if (repository.includes('://') || repository.startsWith('git@')) {
      return repository;
    }

    const parts = repository.split('/');

    let workspace: string;
    let repoSlug: string;

    if (parts.length === 1) {
      workspace = await this.contextService.requireWorkspace();
      repoSlug = parts[0]!;
    } else if (parts.length === 2) {
      workspace = parts[0]!;
      repoSlug = parts[1]!;
    } else {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: 'Invalid repository format. Use workspace/repo or a full URL.',
        context: { repository },
      });
    }

    return buildCloneUrl(`${workspace}/${repoSlug}`, protocol);
  }

  private extractRepoName(repository: string): string {
    const parts = repository.split('/');
    const lastPart = parts.at(-1);
    if (!lastPart) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: 'Invalid repository format.',
        context: { repository },
      });
    }
    return lastPart.replace('.git', '');
  }
}
