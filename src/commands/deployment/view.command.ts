/**
 * View deployment command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Deployment, DeploymentsApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';
import { colorPipelineStatus } from '../pipeline/shared.js';
import {
  fetchEnvironmentName,
  getDeploymentState,
  getDeploymentStatus,
} from './shared.js';

export interface ViewDeploymentOptions extends GlobalOptions {
  uuid: string;
}

export class ViewDeploymentCommand extends BaseCommand<
  ViewDeploymentOptions,
  void
> {
  public readonly name = 'view';
  public readonly description = 'View deployment details';

  constructor(
    private readonly deploymentsApi: DeploymentsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ViewDeploymentOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const deploymentUuid = this.requireOption(options.uuid, 'uuid');
    const request = {
      workspace: repoContext.workspace,
      repoSlug: repoContext.repoSlug,
    };

    const response = await this.deploymentsApi
      .getDeploymentForRepository({ ...request, deploymentUuid })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Deployment ${deploymentUuid} not found in ${repoContext.workspace}/${repoContext.repoSlug}.`
        )
      );
    const deployment = response.data;

    if (context.globalOptions.json) {
      await this.output.json({ ...request, deployment });
      return;
    }

    const environmentName = await fetchEnvironmentName(
      this.deploymentsApi,
      request,
      deployment
    );
    this.render(deployment, environmentName);
  }

  private render(deployment: Deployment, environmentName: string): void {
    const state = getDeploymentState(deployment);
    const release = deployment.release;

    this.output.text('');
    this.output.text(
      `${this.output.bold(environmentName)}  ${colorPipelineStatus(this.output, getDeploymentStatus(deployment))}`
    );
    this.output.separator();
    this.output.text(`UUID:        ${deployment.uuid ?? '-'}`);
    if (release?.name) {
      this.output.text(`Release:     ${release.name}`);
    }
    if (release?.commit?.hash) {
      this.output.text(`Commit:      ${release.commit.hash}`);
    }
    if (state.deployer?.display_name) {
      this.output.text(`Deployer:    ${state.deployer.display_name}`);
    }
    if (state.start_date) {
      this.output.text(
        `Started:     ${this.output.formatDate(state.start_date)}`
      );
    }
    if (state.completion_date) {
      this.output.text(
        `Completed:   ${this.output.formatDate(state.completion_date)}`
      );
    }
    const url = state.url ?? release?.url;
    if (url) {
      this.output.text('');
      this.output.text(this.output.cyan(url));
    }
    this.output.text('');
  }
}
