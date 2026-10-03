/**
 * Pipeline logs command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PipelinesApi } from '../../generated/api.js';
import {
  DEFAULT_POLL_INTERVAL_SECONDS,
  realSleep,
  type Sleep,
} from '../../services/polling.js';
import type { GlobalOptions } from '../../types/config.js';
import {
  APIError,
  BBError,
  ErrorCode,
  rethrowWithNotFoundContext,
} from '../../types/errors.js';
import {
  colorPipelineStatus,
  fetchAllPipelineSteps,
  getPipelineStatus,
  isPipelineCompleted,
  isPipelinePaused,
  resolvePipelineId,
  type PipelineStepLike,
} from './shared.js';

export interface LogsPipelineOptions extends GlobalOptions {
  id?: string;
  step?: string;
  follow?: boolean;
  interval?: string;
}

interface StepLogRequest {
  workspace: string;
  repoSlug: string;
  pipelineUuid: string;
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
    private readonly gitService: IGitService,
    output: IOutputService,
    private readonly sleep: Sleep = realSleep
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
    if (options.follow && context.globalOptions.json) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: this.appendHelpHint(
          '--follow streams raw log text and cannot be combined with --json. Use `bb pipeline watch --json` for the final state.'
        ),
      });
    }
    const intervalMs = options.follow
      ? this.parsePositiveInt(
          options.interval ?? DEFAULT_POLL_INTERVAL_SECONDS,
          'interval'
        ) * 1000
      : 0;
    const id = await resolvePipelineId(options.id, {
      pipelinesApi: this.pipelinesApi,
      gitService: this.gitService,
      ...repoContext,
    });

    if (options.follow) {
      await this.follow(
        { ...repoContext, pipelineUuid: id },
        options.step,
        intervalMs
      );
      return;
    }

    // The steps endpoint is paginated (default pagelen 10), so the fetch
    // walks every page — otherwise steps 11+ would be unselectable.
    const steps = await fetchAllPipelineSteps(this.pipelinesApi, {
      workspace: repoContext.workspace,
      repoSlug: repoContext.repoSlug,
      pipelineUuid: id,
    }).catch((error: unknown) =>
      rethrowWithNotFoundContext(
        error,
        `Pipeline ${id} not found in ${repoContext.workspace}/${repoContext.repoSlug}.`
      )
    );

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
   * Stream step logs until the pipeline settles: the `--step` step only, or
   * every step in order. Steps are printed one after another rather than
   * interleaved, so parallel steps catch up once the earlier one finishes.
   */
  private async follow(
    request: StepLogRequest,
    selector: string | undefined,
    intervalMs: number
  ): Promise<void> {
    const hasSelector = selector !== undefined && selector !== '';
    let cursor = 0;
    let announced = -1;
    let offset = 0;
    // Trailing bytes of a UTF-8 character split across two range reads.
    let carry: Uint8Array = new Uint8Array();
    let endsWithNewline = true;

    for (let poll = 0; ; poll++) {
      if (poll > 0) {
        await this.sleep(intervalMs);
      }
      // Step states are read before their log, so a step seen as completed
      // here has its whole log in the chunk fetched after.
      const [pipelineResponse, steps] = await Promise.all([
        this.pipelinesApi.getPipelineForRepository(request),
        fetchAllPipelineSteps(this.pipelinesApi, request),
      ]).catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Pipeline ${request.pipelineUuid} not found in ${request.workspace}/${request.repoSlug}.`
        )
      );
      const pipelineState = pipelineResponse.data.state;
      const selected =
        hasSelector && steps.length > 0
          ? this.selectStep(steps, selector)
          : undefined;
      const targets = selected ? [selected] : hasSelector ? [] : steps;

      while (cursor < targets.length) {
        const step = targets[cursor]!;
        if (announced !== cursor && targets.length > 1) {
          announced = cursor;
          this.output.text(
            `${endsWithNewline ? '' : '\n'}${this.output.bold(`==> Step ${cursor + 1}: ${step.name ?? step.uuid ?? '-'}`)}`
          );
          endsWithNewline = true;
        }
        const stepDone = isPipelineCompleted(step.state);
        const chunk = await this.fetchLogFrom(
          { ...request, stepUuid: step.uuid ?? '' },
          offset
        );
        offset += chunk.length;
        const [complete, rest] = splitIncompleteUtf8(concatBytes(carry, chunk));
        carry = stepDone ? new Uint8Array() : rest;
        const printable = stepDone ? concatBytes(complete, rest) : complete;
        if (printable.length > 0) {
          this.output.raw(printable);
          endsWithNewline = printable[printable.length - 1] === 0x0a;
        }
        if (!stepDone) {
          break;
        }
        cursor++;
        offset = 0;
      }

      // Steps and pipeline are fetched together, so a completed pipeline can
      // arrive with a step still listed as running: only stop once every
      // target step has been drained.
      const drained = cursor >= targets.length;
      const selectedDone = hasSelector && cursor > 0;
      const paused = isPipelinePaused(pipelineState);
      if (
        selectedDone ||
        (isPipelineCompleted(pipelineState) && drained) ||
        paused
      ) {
        if (!endsWithNewline) {
          this.output.text('');
        }
        if (paused && !selectedDone) {
          this.output.warning(
            `Pipeline ${request.pipelineUuid} is paused, waiting for a manual step.`
          );
        }
        return;
      }
    }
  }

  /**
   * Log bytes from `offset` on. The endpoint honours `Range`; a 200 means
   * the range was ignored, so the already-printed prefix is cut here. 404
   * (step not started) and 416 (nothing new) mean no new bytes yet.
   */
  private async fetchLogFrom(
    request: StepLogRequest & { stepUuid: string },
    offset: number
  ): Promise<Uint8Array> {
    try {
      const response = await this.pipelinesApi.getPipelineStepLogForRepository(
        request,
        {
          responseType: 'arraybuffer',
          ...(offset > 0 ? { headers: { Range: `bytes=${offset}-` } } : {}),
        }
      );
      const bytes = new Uint8Array(response.data as unknown as ArrayBuffer);
      return response.status === 206 ? bytes : bytes.subarray(offset);
    } catch (error) {
      if (
        error instanceof APIError &&
        (error.statusCode === 404 || error.statusCode === 416)
      ) {
        return new Uint8Array();
      }
      throw error;
    }
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

function concatBytes(head: Uint8Array, tail: Uint8Array): Uint8Array {
  if (head.length === 0) return tail;
  const joined = new Uint8Array(head.length + tail.length);
  joined.set(head);
  joined.set(tail, head.length);
  return joined;
}

/**
 * Split off a trailing, incomplete UTF-8 sequence so a terminal never decodes
 * half a character. Returns `[complete, incompleteTail]`.
 */
function splitIncompleteUtf8(bytes: Uint8Array): [Uint8Array, Uint8Array] {
  for (let back = 1; back <= Math.min(3, bytes.length); back++) {
    const byte = bytes[bytes.length - back]!;
    if ((byte & 0xc0) === 0x80) continue;
    const length = byte >= 0xf0 ? 4 : byte >= 0xe0 ? 3 : byte >= 0xc0 ? 2 : 1;
    const cut = length > back ? bytes.length - back : bytes.length;
    return [bytes.subarray(0, cut), bytes.subarray(cut)];
  }
  return [bytes, new Uint8Array()];
}
