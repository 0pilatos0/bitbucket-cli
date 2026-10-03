/**
 * PR status command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  PullrequestsApi,
  Pullrequest,
  UsersApi,
} from '../../generated/api.js';
import {
  collectPagesWithMeta,
  DEFAULT_LIMIT,
  type CollectPagesResult,
} from '../../services/pagination.js';
import {
  bbqlString,
  CURRENT_USER,
  resolveUserUuid,
} from '../../services/pr-filters.js';
import type { GlobalOptions, RepoContext } from '../../types/config.js';

export interface StatusPROptions extends GlobalOptions {}

export class StatusPRCommand extends BaseCommand<StatusPROptions, void> {
  public readonly name = 'status';
  public readonly description = 'Show the status of your pull requests';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly usersApi: UsersApi,
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: StatusPROptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const [currentBranch, uuid] = await Promise.all([
      this.getLocalBranchFor(repoContext),
      resolveUserUuid(this.usersApi, CURRENT_USER),
    ]);

    const [branchMatches, createdByYou, reviewRequested] = await Promise.all([
      currentBranch
        ? this.listOpen(
            repoContext,
            `source.branch.name=${bbqlString(currentBranch)}`,
            1
          )
        : undefined,
      this.listOpen(repoContext, `author.uuid=${bbqlString(uuid)}`),
      this.listOpen(repoContext, `reviewers.uuid=${bbqlString(uuid)}`),
    ]);
    const currentBranchPullRequest = branchMatches?.items[0] ?? null;

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        currentBranch,
        currentBranchPullRequest,
        createdByYou: createdByYou.items,
        reviewRequested: reviewRequested.items,
      });
      return;
    }

    this.output.text(
      this.output.bold(`${repoContext.workspace}/${repoContext.repoSlug}`)
    );

    this.printHeading('Current branch');
    if (!currentBranch) {
      this.printEmpty('Not on a branch of this repository');
    } else if (currentBranchPullRequest) {
      this.printPullRequest(currentBranchPullRequest, context);
    } else {
      this.printEmpty(`No open pull request for ${currentBranch}`);
    }

    this.printSection(
      'Created by you',
      createdByYou,
      'You have no open pull requests',
      `bb pr list --author ${CURRENT_USER} --all`,
      context
    );
    this.printSection(
      'Requesting your review',
      reviewRequested,
      'No open pull requests are requesting your review',
      `bb pr list --reviewer ${CURRENT_USER} --all`,
      context
    );
  }

  /**
   * The checked-out branch, but only when the working directory is a clone of
   * the target repository: with `--repo` pointing elsewhere the local branch
   * name says nothing about that repository's pull requests.
   */
  private async getLocalBranchFor(
    repoContext: RepoContext
  ): Promise<string | null> {
    const local = await this.contextService.getRepoContextFromGit();
    const sameRepo =
      local?.workspace.toLowerCase() === repoContext.workspace.toLowerCase() &&
      local.repoSlug.toLowerCase() === repoContext.repoSlug.toLowerCase();
    if (!sameRepo) {
      return null;
    }
    const branch = await this.gitService.getCurrentBranch();
    // `rev-parse --abbrev-ref HEAD` prints `HEAD` on a detached checkout.
    return branch === 'HEAD' ? null : branch;
  }

  private listOpen(
    repoContext: RepoContext,
    query: string,
    limit = DEFAULT_LIMIT
  ): Promise<CollectPagesResult<Pullrequest>> {
    return collectPagesWithMeta<Pullrequest>({
      limit,
      fetchPage: async (page, pagelen) => {
        const response =
          await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsGet(
            {
              workspace: repoContext.workspace,
              repoSlug: repoContext.repoSlug,
              state: 'OPEN',
            },
            { params: { page, pagelen, q: query } }
          );
        return response.data;
      },
    });
  }

  private printSection(
    heading: string,
    result: CollectPagesResult<Pullrequest>,
    emptyMessage: string,
    moreCommand: string,
    context: CommandContext
  ): void {
    this.printHeading(heading);
    if (result.items.length === 0) {
      this.printEmpty(emptyMessage);
      return;
    }
    for (const pr of result.items) {
      this.printPullRequest(pr, context);
    }
    if (result.hasMore) {
      this.output.text(
        this.output.dim(
          `  Showing ${result.items.length}. Run \`${moreCommand}\` to see all.`
        )
      );
    }
  }

  private printHeading(heading: string): void {
    this.output.text('');
    this.output.text(this.output.bold(heading));
  }

  private printEmpty(message: string): void {
    this.output.text(this.output.dim(`  ${message}`));
  }

  private printPullRequest(pr: Pullrequest, context: CommandContext): void {
    const title = pr.draft ? `[DRAFT] ${pr.title}` : (pr.title ?? '');
    const source = pr.source as { branch?: { name?: string } } | undefined;
    const branch = source?.branch?.name ?? 'unknown';
    this.output.text(
      `  #${pr.id}  ${this.truncateText(title, 60, context.globalOptions)}  ${this.output.dim(`[${branch}]`)}`
    );
  }
}
