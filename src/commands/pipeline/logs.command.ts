/**
 * Pipeline logs command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PipelinesApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import {
  BBError,
  ErrorCode,
  rethrowWithNotFoundContext,
} from '../../types/errors.js';
import {
  colorPipelineStatus,
  getPipelineStatus,
  type PipelineStepLike,
} from './shared.js';

export interface LogsPipelineOptions extends GlobalOptions {
  id: string;
  step?: string;
}

export class LogsPipelineCommand extends BaseCommand<
  LogsPipelineOptions,
  void
> {
  public readonly name = 'logs';
  public readonly description = 'Print the log of a pipeline step';

  constructor(
    private readonly pipelinesApi: PipelinesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: LogsPipelineOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const id = this.requireOption(options.id, 'id');

    const stepsResponse = await this.pipelinesApi
      .getPipelineStepsForRepository({
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

    const steps = (
      stepsResponse.data.values ? Array.from(stepsResponse.data.values) : []
    ) as PipelineStepLike[];

    if (steps.length === 0) {
      throw new BBError({
        code: ErrorCode.API_NOT_FOUND,
        message: `Pipeline ${id} has no steps yet. It may still be queued — check with \`bb pipeline view ${id}\`.`,
      });
    }

    const step = this.selectStep(steps, options.step);

    // No --step and several steps to choose from: surface the choices
    // instead of guessing. JSON mode returns the steps so scripts/agents can
    // pick a UUID; human mode renders them with their 1-based indexes.
    if (!step) {
      if (context.globalOptions.json) {
        await this.output.json({
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pipelineId: id,
          count: steps.length,
          steps,
        });
        return;
      }

      this.output.info(
        `Pipeline ${id} has ${steps.length} steps. Pass --step <uuid-or-index> to pick one:`
      );
      this.output.table(
        ['#', 'NAME', 'STATUS', 'UUID'],
        steps.map((candidate, index) => [
          String(index + 1),
          candidate.name ?? '-',
          colorPipelineStatus(this.output, getPipelineStatus(candidate.state)),
          candidate.uuid ?? '-',
        ])
      );
      return;
    }

    const stepUuid = step.uuid ?? '';
    const logResponse = await this.pipelinesApi
      .getPipelineStepLogForRepository(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pipelineUuid: id,
          stepUuid,
        },
        { responseType: 'text' }
      )
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `No log found for step ${stepUuid} of pipeline ${id}. The step may not have started yet.`
        )
      );

    // The generated return type is void because the spec models this endpoint
    // as an opaque binary body, but the response body is the raw log text.
    const log = (logResponse.data as unknown as string) ?? '';

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pipelineId: id,
        stepUuid,
        log,
      });
      return;
    }

    this.output.text(log);
  }

  /**
   * Pick the step the user asked for: by `--step` (a step UUID — braces
   * optional — or a 1-based index), or automatically when the pipeline has
   * exactly one step. Returns undefined when several steps exist and no
   * `--step` was given.
   */
  private selectStep(
    steps: PipelineStepLike[],
    selector: string | undefined
  ): PipelineStepLike | undefined {
    if (selector === undefined || selector === '') {
      return steps.length === 1 ? steps[0] : undefined;
    }

    if (/^\d+$/.test(selector)) {
      const index = this.parsePositiveInt(selector, 'step');
      const step = steps[index - 1];
      if (!step) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message: `--step index ${index} is out of range; the pipeline has ${steps.length} step${steps.length === 1 ? '' : 's'}.`,
          context: { step: selector },
        });
      }
      return step;
    }

    const normalized = selector.replace(/^\{|\}$/g, '');
    const step = steps.find(
      (candidate) =>
        candidate.uuid === selector ||
        candidate.uuid?.replace(/^\{|\}$/g, '') === normalized
    );
    if (!step) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: `No step matching '${selector}' found. Available steps: ${steps
          .map((candidate, index) => `${index + 1} (${candidate.uuid ?? '-'})`)
          .join(', ')}.`,
        context: { step: selector },
      });
    }
    return step;
  }
}
