/**
 * List deployments command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Deployment, DeploymentsApi } from '../../generated/api.js';
import { resolveLimit } from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';
import { colorPipelineStatus } from '../pipeline/shared.js';
import {
  fetchEnvironmentNames,
  getDeploymentDate,
  getDeploymentStatus,
  getEnvironmentName,
} from './shared.js';

export interface ListDeploymentsOptions extends GlobalOptions {
  limit?: string;
  all?: boolean;
}

export class ListDeploymentsCommand extends BaseCommand<
  ListDeploymentsOptions,
  void
> {
  public readonly name = 'list';
  public readonly description = 'List deployments for a repository';

  constructor(
    private readonly deploymentsApi: DeploymentsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListDeploymentsOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    resolveLimit(options);
    const request = {
      workspace: repoContext.workspace,
      repoSlug: repoContext.repoSlug,
    };
    // JSON consumers get the raw payloads; names only feed the table and are
    // fetched alongside the first page.
    const environmentNamesPromise = context.globalOptions.json
      ? Promise.resolve(new Map<string, string>())
      : fetchEnvironmentNames(this.deploymentsApi, request);
    let environmentNames = new Map<string, string>();

    await this.runList<Deployment>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const [response, names] = await Promise.all([
            this.deploymentsApi.getDeploymentsForRepository(request, {
              params: { page, pagelen },
            }),
            environmentNamesPromise,
          ]);
          environmentNames = names;
          return response.data;
        },
        wrapperKey: 'deployments',
        jsonMetadata: request,
        emptyMessage: `No deployments found in ${repoContext.workspace}/${repoContext.repoSlug}`,
        tableHeaders: [
          'UUID',
          'ENVIRONMENT',
          'STATUS',
          'RELEASE',
          'COMMIT',
          'DATE',
        ],
        mapRow: (deployment) => {
          const date = getDeploymentDate(deployment);
          return [
            deployment.uuid ?? '-',
            getEnvironmentName(deployment, environmentNames),
            colorPipelineStatus(this.output, getDeploymentStatus(deployment)),
            deployment.release?.name ?? '-',
            deployment.release?.commit?.hash?.slice(0, 12) ?? '-',
            date ? this.output.formatDate(date) : '-',
          ];
        },
        noun: 'deployments',
      },
      context
    );
  }
}
