/**
 * `bb context`: show the workspace, repository, remote and branch `bb` would
 * use here, and where each came from. Local only, no network.
 */

import { BaseCommand } from '../core/base-command.js';
import type { CommandContext } from '../core/interfaces/commands.js';
import type {
  IContextService,
  IGitService,
  IOutputService,
} from '../core/interfaces/services.js';
import type { ContextSource, ResolvedContext } from '../types/config.js';

export type ContextResult = ResolvedContext & { branch: string | null };

const SOURCE_LABELS: Record<ContextSource, string> = {
  flag: 'flag',
  remote: 'git remote',
  env: 'BB_WORKSPACE',
  config: 'config defaultWorkspace',
};

export class ContextCommand extends BaseCommand<void, ContextResult> {
  public readonly name = 'context';
  public readonly description =
    'Show the workspace and repository bb would use here';

  constructor(
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    _options: void,
    context: CommandContext
  ): Promise<ContextResult> {
    const [resolved, branch] = await Promise.all([
      this.contextService.inspectContext(context.globalOptions),
      this.currentBranch(),
    ]);
    const result = { ...resolved, branch };

    if (context.globalOptions.json) {
      await this.output.json(result);
      return result;
    }

    const describe = (
      value: string | null,
      source: ContextSource | null
    ): string =>
      value && source
        ? `${this.output.highlight(value)} ${this.output.dim(`(${SOURCE_LABELS[source]})`)}`
        : this.output.dim('not set');

    this.output.text(
      `Workspace:   ${describe(result.workspace, result.source.workspace)}`
    );
    this.output.text(
      `Repository:  ${describe(result.repo, result.source.repo)}`
    );
    this.output.text(
      `Remote:      ${result.remote ?? this.output.dim('none')}`
    );
    this.output.text(
      `Branch:      ${result.branch ?? this.output.dim('none')}`
    );
    return result;
  }

  /** `null` outside a repository and on a detached HEAD. */
  private async currentBranch(): Promise<string | null> {
    try {
      const branch = await this.gitService.getCurrentBranch();
      return branch === 'HEAD' ? null : branch;
    } catch {
      return null;
    }
  }
}
