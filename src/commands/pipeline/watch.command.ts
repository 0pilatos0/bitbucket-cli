/**
 * Watch pipeline command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Pipeline, PipelinesApi } from '../../generated/api.js';
import {
  DEFAULT_POLL_INTERVAL_SECONDS,
  realSleep,
  type Sleep,
} from '../../services/polling.js';
import type { GlobalOptions } from '../../types/config.js';
import {
  BBError,
  ErrorCode,
  rethrowWithNotFoundContext,
} from '../../types/errors.js';
import {
  colorPipelineStatus,
  fetchAllPipelineSteps,
  formatDuration,
  getPipelineRef,
  getPipelineStatus,
  isPipelinePaused,
  isPipelineSettled,
  isPipelineSuccessful,
  resolvePipelineId,
  type PipelineStepLike,
} from './shared.js';

export interface WatchPipelineOptions extends GlobalOptions {
  id?: string;
  interval?: string;
}

export class WatchPipelineCommand extends BaseCommand<
  WatchPipelineOptions,
  void
> {
  public readonly name = 'watch';
  public readonly description = 'Wait for a pipeline to finish';

  constructor(
    private readonly pipelinesApi: PipelinesApi,
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    output: IOutputService,
    private readonly sleep: Sleep = realSleep
  ) {
    super(output);
  }

  public async execute(
    options: WatchPipelineOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const intervalMs =
      this.parsePositiveInt(
        options.interval ?? DEFAULT_POLL_INTERVAL_SECONDS,
        'interval'
      ) * 1000;
    const id = await resolvePipelineId(options.id, {
      pipelinesApi: this.pipelinesApi,
      gitService: this.gitService,
      ...repoContext,
    });
    const request = {
      workspace: repoContext.workspace,
      repoSlug: repoContext.repoSlug,
      pipelineUuid: id,
    };
    const json = context.globalOptions.json;
    const seen = new Map<string, string>();

    let pipeline: Pipeline;
    let steps: PipelineStepLike[];
    for (let poll = 0; ; poll++) {
      if (poll > 0) {
        await this.sleep(intervalMs);
      }
      pipeline = (
        await this.pipelinesApi
          .getPipelineForRepository(request)
          .catch((error: unknown) =>
            rethrowWithNotFoundContext(
              error,
              `Pipeline ${id} not found in ${repoContext.workspace}/${repoContext.repoSlug}.`
            )
          )
      ).data;
      // Steps are read after the pipeline, so a settled run's steps are final.
      steps = await fetchAllPipelineSteps(this.pipelinesApi, request);

      if (!json) {
        if (poll === 0) {
          this.output.text(
            `Watching pipeline #${pipeline.build_number ?? id} on ${getPipelineRef(pipeline)}`
          );
        }
        this.printStepChanges(steps, seen);
      }

      if (isPipelineSettled(pipeline.state)) {
        break;
      }
    }

    const status = getPipelineStatus(pipeline.state);
    const label = `Pipeline #${pipeline.build_number ?? id}`;

    if (json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pipeline,
        steps,
      });
    } else if (isPipelineSuccessful(pipeline.state)) {
      this.output.success(
        `${label} ${status} in ${formatDuration(pipeline.build_seconds_used)}`
      );
    }

    if (!isPipelineSuccessful(pipeline.state)) {
      throw new BBError({
        code: ErrorCode.CI_FAILED,
        message: isPipelinePaused(pipeline.state)
          ? `${label} is paused, waiting for a manual step.`
          : `${label} finished with status ${status}.`,
        context: { pipeline: id, status },
      });
    }
  }

  /** One line per step whose status differs from the previous poll. */
  private printStepChanges(
    steps: PipelineStepLike[],
    seen: Map<string, string>
  ): void {
    steps.forEach((step, index) => {
      const key = step.uuid ?? String(index);
      const status = getPipelineStatus(step.state);
      if (seen.get(key) === status) {
        return;
      }
      seen.set(key, status);
      this.output.text(
        `  ${index + 1}. ${step.name ?? key}: ${colorPipelineStatus(this.output, status)}`
      );
    });
  }
}
