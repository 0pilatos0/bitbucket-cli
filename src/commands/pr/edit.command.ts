/**
 * Edit PR command implementation
 */

import * as fs from 'node:fs';
import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { PullrequestsApi, Pullrequest } from '../../generated/api.js';
import { collectPages, MAX_PAGE_LENGTH } from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

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

      const matches = await collectPages<Pullrequest>({
        limit: 1,
        pageSize: MAX_PAGE_LENGTH,
        fetchPage: async (page, pagelen) => {
          const response =
            await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsGet(
              {
                workspace: repoContext.workspace,
                repoSlug: repoContext.repoSlug,
                state: 'OPEN',
              },
              {
                params: { page, pagelen },
              }
            );

          return response.data;
        },
        shouldInclude: (pullRequest) => {
          const source = pullRequest.source as
            | { branch?: { name?: string } }
            | undefined;
          return source?.branch?.name === currentBranch;
        },
      });
      const matchingPR = matches[0];

      if (!matchingPR) {
        throw new BBError({
          code: ErrorCode.API_NOT_FOUND,
          message: `No open pull request found for current branch '${currentBranch}'. Specify a PR ID explicitly.`,
          context: { branch: currentBranch },
        });
      }

      prId = matchingPR.id!;
    }

    let body = options.body;
    if (options.bodyFile) {
      try {
        body = fs.readFileSync(options.bodyFile, 'utf-8');
      } catch (err) {
        throw new BBError({
          code: ErrorCode.UNKNOWN,
          message: `Failed to read file '${options.bodyFile}': ${err instanceof Error ? err.message : 'Unknown error'}`,
          cause: err instanceof Error ? err : undefined,
          context: { bodyFile: options.bodyFile },
        });
      }
    }

    if (!options.title && !body) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          'At least one of --title or --body (or --body-file) is required.',
      });
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
          pullrequest: request,
        }
      );

    const pr = response.data;
    const links = pr.links as { html?: { href?: string } } | undefined;

    if (context.globalOptions.json) {
      this.output.json(pr);
      return;
    }

    this.output.success(`Updated pull request #${pr.id}`);
    this.output.text(`  ${this.output.dim('Title:')} ${pr.title}`);
    if (pr.description) {
      const truncatedDesc =
        pr.description.length > 100
          ? pr.description.substring(0, 100) + '...'
          : pr.description;
      this.output.text(`  ${this.output.dim('Description:')} ${truncatedDesc}`);
    }
    this.output.text(`  ${this.output.dim('URL:')} ${links?.html?.href}`);
  }
}
