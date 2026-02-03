/**
 * Edit PR command implementation
 */

import * as fs from 'node:fs';
import chalk from 'chalk';
import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi, Pullrequest } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { getLinkHref, toArray } from '../../types/api-helpers.js';

export interface EditPROptions extends GlobalOptions {
  id?: string;
  title?: string;
  body?: string;
  bodyFile?: string;
}

export class EditPRCommand extends BaseCommand<EditPROptions, void> {
  public readonly name = 'edit';
  public readonly description = 'Edit a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: EditPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    let prId: number;
    if (options.id) {
      prId = Number.parseInt(options.id, 10);
    } else {
      const currentBranch = await this.gitService.getCurrentBranch();

      const prsResponse =
        await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsGet(
          {
            workspace: repoContext.workspace,
            repoSlug: repoContext.repoSlug,
            state: 'OPEN',
          }
        );

      const values = toArray(prsResponse.data.values);
      const matchingPR = values.find((pr: Pullrequest) => {
        const source = pr.source as { branch?: { name?: string } } | undefined;
        return source?.branch?.name === currentBranch;
      });

      if (!matchingPR) {
        throw new Error(
          `No open pull request found for current branch '${currentBranch}'. Specify a PR ID explicitly.`
        );
      }

      prId = matchingPR.id!;
    }

    let body = options.body;
    if (options.bodyFile) {
      try {
        body = fs.readFileSync(options.bodyFile, 'utf-8');
      } catch (err) {
        throw new Error(
          `Failed to read file '${options.bodyFile}': ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    if (!options.title && !body) {
      throw new Error(
        'At least one of --title or --body (or --body-file) is required.'
      );
    }

    const request: Pullrequest = {
      type: 'pullrequest',
    };
    if (options.title) {
      request.title = options.title;
    }
    if (body) {
      request.description = body;
    }

    const response =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
          body: request,
        }
      );

    const pr = response.data;
    const url = getLinkHref(pr.links, 'html');

    this.output.success(`Updated pull request #${pr.id}`);
    this.output.text(`  ${chalk.dim('Title:')} ${pr.title}`);
    if (pr.description) {
      const truncatedDesc =
        pr.description.length > 100
          ? pr.description.substring(0, 100) + '...'
          : pr.description;
      this.output.text(`  ${chalk.dim('Description:')} ${truncatedDesc}`);
    }
    this.output.text(`  ${chalk.dim('URL:')} ${url ?? ''}`);
  }
}
