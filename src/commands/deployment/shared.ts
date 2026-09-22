/**
 * Shared helpers for the `bb deployment` command group.
 *
 * The generated `DeploymentState` is an empty marker interface (the spec
 * models its variants as subtypes), and list responses carry only the
 * environment `uuid`, so payloads are narrowed structurally here.
 */

import type { IOutputService } from '../../core/interfaces/services.js';
import type {
  Deployment,
  DeploymentEnvironment,
  DeploymentsApi,
} from '../../generated/api.js';
import { collectPages } from '../../services/pagination.js';

interface DeploymentStateLike {
  name?: string;
  status?: { name?: string };
  url?: string;
  deployer?: { display_name?: string };
  start_date?: string;
  completion_date?: string;
}

export function getDeploymentState(
  deployment: Deployment
): DeploymentStateLike {
  return (deployment.state ?? {}) as DeploymentStateLike;
}

/**
 * The most specific status: the completed result (`SUCCESSFUL`, `FAILED`,
 * `STOPPED`) wins over the state name (`IN_PROGRESS`, `UNDEPLOYED`, ...).
 */
export function getDeploymentStatus(deployment: Deployment): string {
  const state = getDeploymentState(deployment);
  return state.status?.name ?? state.name ?? '-';
}

export function colorDeploymentStatus(
  output: IOutputService,
  status: string
): string {
  switch (status.toUpperCase()) {
    case 'SUCCESSFUL':
      return output.green(status);
    case 'FAILED':
      return output.red(status);
    case 'IN_PROGRESS':
      return output.yellow(status);
    case 'STOPPED':
    case 'UNDEPLOYED':
      return output.gray(status);
    default:
      return status;
  }
}

/** When the deployment finished, else when it started, else release time. */
export function getDeploymentDate(deployment: Deployment): string | undefined {
  const state = getDeploymentState(deployment);
  return (
    state.completion_date ?? state.start_date ?? deployment.release?.created_on
  );
}

/**
 * Map environment UUID to name. Deployment payloads reference environments
 * by UUID only, so names come from the environments collection.
 */
export async function fetchEnvironmentNames(
  deploymentsApi: DeploymentsApi,
  request: { workspace: string; repoSlug: string }
): Promise<Map<string, string>> {
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
  const names = new Map<string, string>();
  for (const environment of environments) {
    if (environment.uuid && environment.name) {
      names.set(environment.uuid, environment.name);
    }
  }
  return names;
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
