/**
 * List deployment environments command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  DeploymentEnvironment,
  DeploymentsApi,
} from '../../generated/api.js';
import { resolveLimit } from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';

export interface ListEnvironmentsOptions extends GlobalOptions {
  limit?: string;
  all?: boolean;
}

/** `environment_type` is returned by the API but absent from the spec. */
type EnvironmentLike = DeploymentEnvironment & {
  environment_type?: { name?: string };
};

export class ListEnvironmentsCommand extends BaseCommand<
  ListEnvironmentsOptions,
  void
> {
  public readonly name = 'environments';
  public readonly description = 'List deployment environments for a repository';

  constructor(
    private readonly deploymentsApi: DeploymentsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListEnvironmentsOptions,
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

    await this.runList<EnvironmentLike>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response =
            await this.deploymentsApi.getEnvironmentsForRepository(request, {
              params: { page, pagelen },
            });
          return response.data;
        },
        wrapperKey: 'environments',
        jsonMetadata: request,
        emptyMessage: `No deployment environments found in ${repoContext.workspace}/${repoContext.repoSlug}`,
        tableHeaders: ['NAME', 'TYPE', 'UUID'],
        mapRow: (environment) => [
          this.output.bold(environment.name ?? '-'),
          environment.environment_type?.name ?? '-',
          environment.uuid ?? '-',
        ],
        noun: 'environments',
      },
      context
    );
  }
}
