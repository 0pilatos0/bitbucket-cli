/**
 * Create PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IContextService,
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  Account,
  PullrequestsApi,
  Pullrequest,
  UsersApi,
} from '../../generated/api.js';
import type { DefaultReviewerService } from '../../services/default-reviewer.service.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface CreatePROptions extends GlobalOptions {
  title?: string;
  body?: string;
  source?: string;
  destination?: string;
  closeSourceBranch?: boolean;
  draft?: boolean;
  reviewer?: string[];
  defaultReviewers?: boolean;
}

interface ResolvedReviewer {
  uuid: string;
  label: string;
}

export class CreatePRCommand extends BaseCommand<CreatePROptions, void> {
  public readonly name = 'create';
  public readonly description = 'Create a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly usersApi: UsersApi,
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    private readonly defaultReviewerService: DefaultReviewerService,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: CreatePROptions,
    context: CommandContext
  ): Promise<void> {
    if (!options.title) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: this.appendHelpHint(
          'Pull request title is required. Use --title option.'
        ),
      });
    }

    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    let sourceBranch = options.source;
    if (!sourceBranch) {
      sourceBranch = await this.gitService.getCurrentBranch();
    }

    const destinationBranch = options.destination || 'main';

    const includeDefaults = await this.shouldIncludeDefaults(options);
    const explicitUsernames = options.reviewer ?? [];
    const reviewers = await this.resolveReviewers(
      repoContext,
      includeDefaults,
      explicitUsernames
    );

    const request: Pullrequest = {
      type: 'pullrequest',
      title: options.title,
      source: {
        branch: { name: sourceBranch },
      } as Pullrequest['source'],
      destination: {
        branch: { name: destinationBranch },
      } as Pullrequest['destination'],
    };

    if (options.body) {
      request.description = options.body;
    }

    if (options.closeSourceBranch) {
      request.close_source_branch = true;
    }

    if (options.draft) {
      request.draft = true;
    }

    if (reviewers.length > 0) {
      request.reviewers = reviewers.map(
        (r) => ({ type: 'user', uuid: r.uuid }) as Account
      );
    }

    const spinner = this.output.spinner('Creating pull request...').start();
    let pr;
    try {
      const response =
        await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPost(
          {
            workspace: repoContext.workspace,
            repoSlug: repoContext.repoSlug,
            body: request,
          }
        );
      pr = response.data;
    } finally {
      spinner.stop();
    }
    const links = pr.links as { html?: { href?: string } } | undefined;

    if (context.globalOptions.json) {
      await this.output.json(pr);
      return;
    }

    this.output.success(`Created pull request #${pr.id}`);
    this.output.text(`  ${this.output.dim('Title:')} ${pr.title}`);
    this.output.text(`  ${this.output.dim('URL:')} ${links?.html?.href}`);
    if (reviewers.length > 0) {
      const labels = reviewers.map((r) => r.label).join(', ');
      this.output.text(`  ${this.output.dim('Reviewers:')} ${labels}`);
    }
  }

  private async shouldIncludeDefaults(
    options: CreatePROptions
  ): Promise<boolean> {
    if (typeof options.defaultReviewers === 'boolean') {
      return options.defaultReviewers;
    }

    const config = await this.configService.getConfig();
    return config.prCreateIncludeDefaultReviewers === true;
  }

  private async resolveReviewers(
    repoContext: { workspace: string; repoSlug: string },
    includeDefaults: boolean,
    explicitUsernames: string[]
  ): Promise<ResolvedReviewer[]> {
    const byUuid = new Map<string, ResolvedReviewer>();

    if (includeDefaults) {
      try {
        const defaults = await this.defaultReviewerService.list(
          repoContext,
          'effective'
        );
        for (const entry of defaults) {
          if (!entry.uuid) {
            continue;
          }
          byUuid.set(entry.uuid, {
            uuid: entry.uuid,
            label: entry.displayName ?? entry.nickname ?? entry.uuid,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.output.warning(
          `Could not fetch default reviewers: ${message}. Continuing without them.`
        );
      }
    }

    for (const username of explicitUsernames) {
      const userResponse = await this.usersApi.usersSelectedUserGet({
        selectedUser: username,
      });
      const user = userResponse.data;
      if (!user.uuid) {
        continue;
      }
      byUuid.set(user.uuid, {
        uuid: user.uuid,
        label: user.display_name ?? username,
      });
    }

    if (byUuid.size === 0) {
      return [];
    }

    const authorUuid = await this.getAuthorUuid();
    if (authorUuid) {
      byUuid.delete(authorUuid);
    }

    return Array.from(byUuid.values());
  }

  private async getAuthorUuid(): Promise<string | undefined> {
    try {
      const response = await this.usersApi.userGet();
      return response.data.uuid;
    } catch {
      // If the /user lookup fails we accept the risk that Bitbucket will
      // reject the PR with a 400 — better than failing the whole create.
      return undefined;
    }
  }
}
