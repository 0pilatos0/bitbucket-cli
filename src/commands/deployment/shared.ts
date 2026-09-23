/**
 * Shared helpers for the `bb deployment` command group.
 */

import type {
  Deployment,
  DeploymentEnvironment,
  DeploymentStateCompleted,
  DeploymentStateInProgress,
  DeploymentStateUndeployed,
  DeploymentsApi,
} from '../../generated/api.js';
import { collectPages } from '../../services/pagination.js';

// In-progress fields are a subset of completed ones; undeployed adds only
// `trigger_url`, which nothing here reads.
type AnyDeploymentState = Omit<DeploymentStateCompleted, 'name' | 'status'> & {
  name?:
    | DeploymentStateCompleted['name']
    | DeploymentStateInProgress['name']
    | DeploymentStateUndeployed['name'];
  // The generated status is an empty marker; its variants each carry `name`.
  status?: { name?: string };
};

/**
 * `Deployment.state` is typed as the empty `DeploymentState` base; the payload
 * is one of its generated variants.
 */
export function getDeploymentState(deployment: Deployment): AnyDeploymentState {
  return (deployment.state ?? {}) as AnyDeploymentState;
}

/**
 * The most specific status: the completed result (`SUCCESSFUL`, `FAILED`,
 * `STOPPED`) wins over the state name (`IN_PROGRESS`, `UNDEPLOYED`, ...).
 */
export function getDeploymentStatus(deployment: Deployment): string {
  const state = getDeploymentState(deployment);
  return state.status?.name ?? state.name ?? '-';
}

/** When the deployment finished, else when it started, else release time. */
export function getDeploymentDate(deployment: Deployment): string | undefined {
  const state = getDeploymentState(deployment);
  return (
    state.completion_date ?? state.start_date ?? deployment.release?.created_on
  );
}

/**
 * Map environment UUID to name, for the table only. Deployment payloads
 * reference environments by UUID, so names come from the environments
 * collection; a failed lookup falls back to showing UUIDs.
 */
export async function fetchEnvironmentNames(
  deploymentsApi: DeploymentsApi,
  request: { workspace: string; repoSlug: string }
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  try {
    const environments = await collectPages<DeploymentEnvironment>({
      limit: Number.POSITIVE_INFINITY,
      fetchPage: async (page, pagelen) => {
        const response = await deploymentsApi.getEnvironmentsForRepository(
          request,
          { params: { page, pagelen } }
        );
        return response.data;
      },
    });
    for (const environment of environments) {
      if (environment.uuid && environment.name) {
        names.set(environment.uuid, environment.name);
      }
    }
  } catch {
    return new Map();
  }
  return names;
}

/** Name of one deployment's environment, falling back to its UUID. */
export async function fetchEnvironmentName(
  deploymentsApi: DeploymentsApi,
  request: { workspace: string; repoSlug: string },
  deployment: Deployment
): Promise<string> {
  const environment = deployment.environment;
  if (environment?.name) return environment.name;
  if (!environment?.uuid) return '-';
  try {
    const response = await deploymentsApi.getEnvironmentForRepository({
      ...request,
      environmentUuid: environment.uuid,
    });
    return response.data.name ?? environment.uuid;
  } catch {
    return environment.uuid;
  }
}

export function getEnvironmentName(
  deployment: Deployment,
  names: Map<string, string>
): string {
  const environment = deployment.environment;
  return (
    environment?.name ??
    (environment?.uuid ? names.get(environment.uuid) : undefined) ??
    environment?.uuid ??
    '-'
  );
}
