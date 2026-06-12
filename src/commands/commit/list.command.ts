/**
 * List commits command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { BaseCommit, CommitsApi } from '../../generated/api.js';
import { resolveLimit } from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';
import { firstMessageLine, formatAuthor, shortHash } from './shared.js';

export interface ListCommitsOptions extends GlobalOptions {
  ref?: string;
  limit?: string;
  all?: boolean;
}

export class ListCommitsCommand extends BaseCommand<ListCommitsOptions, void> {
  public readonly name = 'list';
  public readonly description = 'List commits in a repository';

  constructor(
    private readonly commitsApi: CommitsApi,
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListCommitsOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    // Validate --limit before any network call; runList re-resolves the same
    // value.
    resolveLimit(options);

    const ref = options.ref ?? (await this.detectCurrentBranch());

    await this.runList<BaseCommit>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          // Pagination params are not modeled on the generated request
          // interfaces; they go through raw axios params.
          const axiosOptions = { params: { page, pagelen } };
          const response = ref
            ? await this.commitsApi
                .repositoriesWorkspaceRepoSlugCommitsRevisionGet(
                  {
                    workspace: repoContext.workspace,
                    repoSlug: repoContext.repoSlug,
                    revision: ref,
                  },
                  axiosOptions
                )
                .catch((error: unknown) =>
                  rethrowWithNotFoundContext(
                    error,
                    `Ref '${ref}' not found in ${repoContext.workspace}/${repoContext.repoSlug}. Pass --ref <branch|tag|sha> to choose a different ref.`
                  )
                )
            : await this.commitsApi.repositoriesWorkspaceRepoSlugCommitsGet(
                {
                  workspace: repoContext.workspace,
                  repoSlug: repoContext.repoSlug,
                },
                axiosOptions
              );
          return response.data;
        },
        wrapperKey: 'commits',
        jsonMetadata: {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          ...(ref ? { ref } : {}),
        },
        emptyMessage: () =>
          ref ? `No commits found on '${ref}'` : 'No commits found',
        tableHeaders: ['HASH', 'MESSAGE', 'AUTHOR', 'DATE'],
        mapRow: (commit) => [
          this.output.highlight(shortHash(commit.hash)),
          this.truncateText(
            firstMessageLine(commit.message),
            60,
            context.globalOptions
          ),
          formatAuthor(commit.author),
          commit.date ? this.output.formatDate(commit.date) : '-',
        ],
        noun: 'commits',
      },
      context
    );
  }

  /**
   * DX default: with no --ref, list the current git branch's history when run
   * inside a git repository. Outside a repo (or when branch detection fails,
   * e.g. detached HEAD states that error out) fall back to the repository's
   * default commit listing instead of failing.
   */
  private async detectCurrentBranch(): Promise<string | undefined> {
    try {
      const branch = await this.gitService.getCurrentBranch();
      return branch || undefined;
    } catch {
      return undefined;
    }
  }
}
