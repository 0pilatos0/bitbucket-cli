/**
 * List a repository directory without cloning
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { CommitsApi, SourceApi, Treeentry } from '../../generated/api.js';
import { resolveLimit } from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';
import {
  BBError,
  ErrorCode,
  rethrowWithNotFoundContext,
} from '../../types/errors.js';
import {
  COMMIT_DIRECTORY,
  DEFAULT_SOURCE_REF,
  fetchSourceEntry,
  normalizeSourcePath,
  refNotFound,
  resolveSourceCommit,
} from './shared.js';

export interface ListRepoFilesOptions extends GlobalOptions {
  path?: string;
  ref?: string;
  limit?: string;
  all?: boolean;
}

export class ListRepoFilesCommand extends BaseCommand<
  ListRepoFilesOptions,
  void
> {
  public readonly name = 'ls';
  public readonly description = 'List the contents of a repository directory';

  constructor(
    private readonly sourceApi: SourceApi,
    private readonly commitsApi: CommitsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListRepoFilesOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    resolveLimit(options);

    const path = normalizeSourcePath(options.path);
    const ref = options.ref ?? DEFAULT_SOURCE_REF;
    let commit = await resolveSourceCommit(this.commitsApi, repoContext, ref);

    if (path) {
      const entry = await fetchSourceEntry(
        this.sourceApi,
        repoContext,
        commit,
        path,
        ref
      );
      if (entry.type !== COMMIT_DIRECTORY) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message: `'${path}' is a file. Use \`bb repo cat ${path}\` to print it.`,
          context: { path },
        });
      }
      commit = entry.commit?.hash ?? commit;
    }

    // Directory listings paginate with an opaque `page` cursor taken from the
    // previous page's `next` link; numeric page numbers are rejected.
    await this.runList<Treeentry>(
      {
        options,
        concurrency: 1,
        fetchPage: async (_page, pagelen, next) => {
          const cursor = nextPageCursor(next);
          const response = await this.sourceApi
            .repositoriesWorkspaceRepoSlugSrcCommitPathGet(
              {
                workspace: repoContext.workspace,
                repoSlug: repoContext.repoSlug,
                commit,
                path,
              },
              { params: cursor ? { pagelen, page: cursor } : { pagelen } }
            )
            .catch((error: unknown) =>
              rethrowWithNotFoundContext(error, refNotFound(ref, repoContext))
            );
          return response.data;
        },
        wrapperKey: 'entries',
        jsonMetadata: {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          ref,
          path,
        },
        emptyMessage: () =>
          path ? `Directory '${path}' is empty` : 'Repository is empty',
        tableHeaders: ['TYPE', 'SIZE', 'PATH'],
        mapRow: (entry) => {
          const isDirectory = entry.type === COMMIT_DIRECTORY;
          return [
            isDirectory ? 'dir' : 'file',
            !isDirectory && typeof entry.size === 'number'
              ? String(entry.size)
              : '-',
            isDirectory ? `${entry.path ?? ''}/` : (entry.path ?? '-'),
          ];
        },
        noun: 'entries',
      },
      context
    );
  }
}

function nextPageCursor(next: string | undefined): string | undefined {
  if (!next) {
    return undefined;
  }
  return new URL(next).searchParams.get('page') ?? undefined;
}
