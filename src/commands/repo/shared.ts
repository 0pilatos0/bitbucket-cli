/**
 * Shared helpers for the repository source commands (`repo cat`, `repo ls`)
 */

import type { CommitsApi, SourceApi, Treeentry } from '../../generated/api.js';
import { RepositoriesWorkspaceRepoSlugSrcCommitPathGetFormatEnum } from '../../generated/api.js';
import type { RepoContext } from '../../types/config.js';
import {
  BBError,
  ErrorCode,
  rethrowWithNotFoundContext,
} from '../../types/errors.js';

/** Bitbucket resolves `HEAD` to the repository's main branch. */
export const DEFAULT_SOURCE_REF = 'HEAD';

export const COMMIT_DIRECTORY = 'commit_directory';

/** Repository paths are root-relative; tolerate leading/trailing slashes. */
export function normalizeSourcePath(path: string | undefined): string {
  return (path ?? '').replace(/^\/+|\/+$/g, '');
}

/**
 * Resolve `--ref` to something the `/src/{commit}/{path}` route accepts.
 * That route splits on the first `/` even when it is percent-encoded, so a
 * branch like `feature/x` is read as ref `feature` and 404s. Such refs are
 * resolved to their head commit hash through the commits endpoint, which
 * handles them correctly.
 */
export async function resolveSourceCommit(
  commitsApi: CommitsApi,
  repoContext: RepoContext,
  ref: string
): Promise<string> {
  if (!ref.includes('/')) {
    return ref;
  }

  const response = await commitsApi
    .repositoriesWorkspaceRepoSlugCommitsRevisionGet(
      {
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        revision: ref,
      },
      { params: { pagelen: 1 } }
    )
    .catch((error: unknown) =>
      rethrowWithNotFoundContext(error, refNotFound(ref, repoContext))
    );

  const [head] = Array.from(response.data.values ?? []);
  if (!head?.hash) {
    throw new BBError({
      code: ErrorCode.API_NOT_FOUND,
      message: refNotFound(ref, repoContext),
      context: { ref },
    });
  }
  return head.hash;
}

export function refNotFound(ref: string, repoContext: RepoContext): string {
  return `Ref '${ref}' not found in ${repoContext.workspace}/${repoContext.repoSlug}.`;
}

/**
 * Fetch the metadata object (`?format=meta`) for a file or directory, so
 * callers can tell the two apart before requesting contents: without it a
 * directory listing and a `.json` file are both JSON bodies.
 */
export async function fetchSourceEntry(
  sourceApi: SourceApi,
  repoContext: RepoContext,
  commit: string,
  path: string,
  ref: string
): Promise<Treeentry> {
  const response = await sourceApi
    .repositoriesWorkspaceRepoSlugSrcCommitPathGet({
      workspace: repoContext.workspace,
      repoSlug: repoContext.repoSlug,
      commit,
      path,
      format: RepositoriesWorkspaceRepoSlugSrcCommitPathGetFormatEnum.Meta,
    })
    .catch((error: unknown) =>
      rethrowWithNotFoundContext(
        error,
        `Path '${path}' not found at ref '${ref}' in ${repoContext.workspace}/${repoContext.repoSlug}.`
      )
    );

  // The spec only models the directory-listing response; `format=meta`
  // returns a single tree entry instead.
  return response.data as unknown as Treeentry;
}
