/**
 * Stop pipeline command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PipelinesApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface StopPipelineOptions extends GlobalOptions {
  id: string;
}

export class StopPipelineCommand extends BaseCommand<
  StopPipelineOptions,
  void
> {
  public readonly name = 'stop';
  public readonly description = 'Stop a running pipeline';

  constructor(
    private readonly pipelinesApi: PipelinesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: StopPipelineOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const id = this.requireOption(options.id, 'id');

    // No --yes gate: stopping CI is reversible (rerun with `bb pipeline run`).
    // The endpoint accepts a pipeline UUID or a plain build number raw.
    await this.pipelinesApi
      .stopPipeline({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pipelineUuid: id,
      })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Pipeline ${id} not found in ${repoContext.workspace}/${repoContext.repoSlug}.`
        )
      );

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pipelineId: id,
        stopped: true,
      });
      return;
    }

    this.output.success(`Pipeline ${id} stopped`);
    this.output.text(
      this.output.dim(`Check its final state with: bb pipeline view ${id}`)
    );
  }
}
