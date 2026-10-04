/**
 * Shared helpers for the `bb pipeline` command group.
 *
 * The generated `PipelineState` / `PipelineTarget` / `PipelineTrigger` models
 * are empty marker interfaces (the OpenAPI spec models their variants as
 * subtypes), so the helpers here narrow the runtime payloads through small
 * structural types instead of reaching into the generated hierarchy.
 */

import type {
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  Pipeline,
  PipelineStep,
  PipelinesApi,
} from '../../generated/api.js';
import {
  collectPages,
  type PaginatedCollection,
} from '../../services/pagination.js';
import { BBError, ErrorCode } from '../../types/errors.js';

interface PipelineStateLike {
  name?: string;
  result?: { name?: string };
  stage?: { name?: string };
}

interface PipelineTargetLike {
  ref_name?: string;
  ref_type?: string;
  commit?: { hash?: string };
  selector?: { type?: string; pattern?: string };
}

/**
 * The generated `PipelineStep` interface omits a few fields the REST API
 * actually returns (`name`, `duration_in_seconds`); widen it structurally.
 */
export type PipelineStepLike = PipelineStep & {
  name?: string;
  duration_in_seconds?: number;
};

/**
 * Fetch every step of a pipeline. The steps endpoint is paginated with a
 * server-side default `pagelen` of 10, so a single un-paginated request
 * silently drops steps 11+ on larger pipelines — follow `next` until the
 * collection is exhausted.
 */
export async function fetchAllPipelineSteps(
  pipelinesApi: PipelinesApi,
  request: { workspace: string; repoSlug: string; pipelineUuid: string }
): Promise<PipelineStepLike[]> {
  return collectPages<PipelineStepLike>({
    limit: Number.POSITIVE_INFINITY,
    fetchPage: async (page, pagelen) => {
      const response = await pipelinesApi.getPipelineStepsForRepository(
        request,
        { params: { page, pagelen } }
      );
      return response.data as PaginatedCollection<PipelineStepLike>;
    },
  });
}

/**
 * Resolve the most specific status name for a pipeline or step: the completed
 * result (`PASSED`, `FAILED`, ...) wins over the in-progress stage
 * (`RUNNING`, `PAUSED`, ...), which wins over the coarse state name
 * (`PENDING`, `IN_PROGRESS`, `COMPLETED`).
 */
export function getPipelineStatus(state: unknown): string {
  const stateLike = (state ?? {}) as PipelineStateLike;
  return (
    stateLike.result?.name ?? stateLike.stage?.name ?? stateLike.name ?? '-'
  );
}

/**
 * Colorize a pipeline/step status name: green for success, red for failure,
 * yellow for anything still moving, gray for terminal-but-neutral states.
 */
export function colorPipelineStatus(
  output: IOutputService,
  status: string
): string {
  switch (status.toUpperCase()) {
    case 'PASSED':
    case 'SUCCESSFUL':
      return output.green(status);
    case 'FAILED':
    case 'ERROR':
      return output.red(status);
    case 'PENDING':
    case 'BUILDING':
    case 'IN_PROGRESS':
    case 'RUNNING':
    case 'PARSING':
    case 'PAUSED':
    case 'READY':
      return output.yellow(status);
    case 'STOPPED':
    case 'HALTED':
    case 'EXPIRED':
    case 'NOT_RUN':
    case 'UNDEPLOYED':
      return output.gray(status);
    default:
      return status;
  }
}

/**
 * Human-readable duration from a seconds count (e.g. `1h 2m 3s`). Returns
 * `-` when the value is missing (pipeline still running or never started).
 */
export function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || !Number.isFinite(seconds)) {
    return '-';
  }
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * The ref a pipeline ran against: branch/tag name, falling back to the
 * commit hash for commit-target pipelines.
 */
export function getPipelineRef(pipeline: Pipeline): string {
  const target = (pipeline.target ?? {}) as PipelineTargetLike;
  return target.ref_name ?? target.commit?.hash?.slice(0, 12) ?? '-';
}

/** The custom pipeline definition name when one was selected, else undefined. */
export function getPipelineSelectorPattern(
  pipeline: Pipeline
): string | undefined {
  const target = (pipeline.target ?? {}) as PipelineTargetLike;
  return target.selector?.pattern;
}

/** Trigger name (`PUSH`, `MANUAL`, `SCHEDULE`, ...) from the trigger variant. */
export function getPipelineTrigger(pipeline: Pipeline): string {
  const trigger = (pipeline.trigger ?? {}) as { name?: string };
  return trigger.name ?? '-';
}

/**
 * Duration of a single step in seconds, preferring the API-reported value and
 * falling back to the started/completed timestamp delta.
 */
export function getStepDurationSeconds(
  step: PipelineStepLike
): number | undefined {
  if (typeof step.duration_in_seconds === 'number') {
    return step.duration_in_seconds;
  }
  if (step.started_on && step.completed_on) {
    const delta =
      (new Date(step.completed_on).getTime() -
        new Date(step.started_on).getTime()) /
      1000;
    return Number.isFinite(delta) ? delta : undefined;
  }
  return undefined;
}

/** A completed run is final; a paused one waits for a manual step. */
export function isPipelineSettled(state: unknown): boolean {
  return isPipelineCompleted(state) || isPipelinePaused(state);
}

export function isPipelineCompleted(state: unknown): boolean {
  return (state as PipelineStateLike | undefined)?.name === 'COMPLETED';
}

export function isPipelinePaused(state: unknown): boolean {
  const stateLike = (state ?? {}) as PipelineStateLike;
  return stateLike.name !== 'COMPLETED' && stateLike.stage?.name === 'PAUSED';
}

/** The API reports `SUCCESSFUL`; older payloads and fixtures use `PASSED`. */
export function isPipelineSuccessful(state: unknown): boolean {
  const result = (state as PipelineStateLike | undefined)?.result?.name;
  return result === 'SUCCESSFUL' || result === 'PASSED';
}

/**
 * The pipeline the user asked for, or the newest run on the current git
 * branch when no id was given. Returns the build number when the run has one
 * so messages read `Pipeline 42`, not a UUID.
 */
export async function resolvePipelineId(
  id: string | undefined,
  deps: {
    pipelinesApi: PipelinesApi;
    gitService: IGitService;
    workspace: string;
    repoSlug: string;
  }
): Promise<string> {
  if (id) {
    return id;
  }

  const branch = await deps.gitService.getCurrentBranch().catch(() => '');
  // `rev-parse --abbrev-ref HEAD` prints `HEAD` on a detached checkout.
  if (!branch || branch === 'HEAD') {
    throw new BBError({
      code: ErrorCode.VALIDATION_REQUIRED,
      message:
        'No pipeline id given and the current git branch could not be determined. Pass a build number or UUID.',
    });
  }

  const response = await deps.pipelinesApi.getPipelinesForRepository(
    {
      workspace: deps.workspace,
      repoSlug: deps.repoSlug,
      targetBranch: branch,
    },
    { params: { page: 1, pagelen: 1, sort: '-created_on' } }
  );
  const latest = Array.from(response.data.values ?? [])[0];
  const latestId = latest?.build_number ?? latest?.uuid;
  if (latestId === undefined) {
    throw new BBError({
      code: ErrorCode.API_NOT_FOUND,
      message: `No pipelines found for branch ${branch} in ${deps.workspace}/${deps.repoSlug}.`,
    });
  }
  return String(latestId);
}
