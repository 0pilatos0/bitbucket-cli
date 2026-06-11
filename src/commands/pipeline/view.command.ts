/**
 * View pipeline command implementation
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
import {
  colorPipelineStatus,
  formatDuration,
  getPipelineRef,
  getPipelineSelectorPattern,
  getPipelineStatus,
  getPipelineTrigger,
  getStepDurationSeconds,
  type PipelineStepLike,
} from './shared.js';

export interface ViewPipelineOptions extends GlobalOptions {
  id: string;
}

export class ViewPipelineCommand extends BaseCommand<
  ViewPipelineOptions,
  void
> {
  public readonly name = 'view';
  public readonly description = 'View pipeline details';

  constructor(
    private readonly pipelinesApi: PipelinesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ViewPipelineOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const id = this.requireOption(options.id, 'id');

    // The REST endpoint accepts either a pipeline UUID (curly braces
    // included) or a plain build number, so the user's value passes through
    // raw — humans paste build numbers, scripts pass UUIDs.
    const response = await this.pipelinesApi
      .getPipelineForRepository({
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

    const pipeline = response.data;
    const steps = await this.fetchSteps(repoContext, id);

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pipeline,
        steps,
      });
      return;
    }

    const status = getPipelineStatus(pipeline.state);
    const selector = getPipelineSelectorPattern(pipeline);

    this.output.text(
      `${this.output.bold(`Pipeline #${pipeline.build_number ?? '?'}`)} ${this.output.dim(pipeline.uuid ?? '')}`
    );
    this.output.text('');
    this.output.text(
      `  ${this.output.dim('Status:')} ${colorPipelineStatus(this.output, status)}`
    );
    this.output.text(
      `  ${this.output.dim('Ref:')} ${getPipelineRef(pipeline)}`
    );
    if (selector) {
      this.output.text(`  ${this.output.dim('Pipeline:')} ${selector}`);
    }
    this.output.text(
      `  ${this.output.dim('Trigger:')} ${getPipelineTrigger(pipeline)}`
    );
    this.output.text(
      `  ${this.output.dim('Creator:')} ${pipeline.creator?.display_name ?? '-'}`
    );
    this.output.text(
      `  ${this.output.dim('Created:')} ${pipeline.created_on ? this.output.formatDate(pipeline.created_on) : '-'}`
    );
    this.output.text(
      `  ${this.output.dim('Completed:')} ${pipeline.completed_on ? this.output.formatDate(pipeline.completed_on) : '-'}`
    );
    this.output.text(
      `  ${this.output.dim('Duration:')} ${formatDuration(pipeline.build_seconds_used)}`
    );

    if (steps.length > 0) {
      this.output.text('');
      this.output.text(this.output.bold('Steps'));
      this.output.table(
        ['#', 'NAME', 'STATUS', 'DURATION'],
        steps.map((step, index) => [
          String(index + 1),
          step.name ?? step.uuid ?? '-',
          colorPipelineStatus(this.output, getPipelineStatus(step.state)),
          formatDuration(getStepDurationSeconds(step)),
        ])
      );
    }
  }

  private async fetchSteps(
    repoContext: { workspace: string; repoSlug: string },
    id: string
  ): Promise<PipelineStepLike[]> {
    const response = await this.pipelinesApi.getPipelineStepsForRepository({
      workspace: repoContext.workspace,
      repoSlug: repoContext.repoSlug,
      pipelineUuid: id,
    });
    return response.data.values
      ? (Array.from(response.data.values) as PipelineStepLike[])
      : [];
  }
}
