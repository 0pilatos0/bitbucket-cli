/**
 * Print a repository file's contents without cloning
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { CommitsApi, SourceApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';
import {
  COMMIT_DIRECTORY,
  DEFAULT_SOURCE_REF,
  fetchSourceEntry,
  normalizeSourcePath,
  resolveSourceCommit,
} from './shared.js';

export interface CatRepoFileOptions extends GlobalOptions {
  path: string;
  ref?: string;
}

export class CatRepoFileCommand extends BaseCommand<CatRepoFileOptions, void> {
  public readonly name = 'cat';
  public readonly description = 'Print the contents of a repository file';

  constructor(
    private readonly sourceApi: SourceApi,
    private readonly commitsApi: CommitsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: CatRepoFileOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const path = normalizeSourcePath(options.path);
    if (!path) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: this.appendHelpHint(
          'A file path is required. Use `bb repo ls` to browse the repository root.'
        ),
      });
    }

    const ref = options.ref ?? DEFAULT_SOURCE_REF;
    const commit = await resolveSourceCommit(this.commitsApi, repoContext, ref);
    const entry = await fetchSourceEntry(
      this.sourceApi,
      repoContext,
      commit,
      path,
      ref
    );

    if (entry.type === COMMIT_DIRECTORY) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: `'${path}' is a directory. Use \`bb repo ls ${path}\` to list it.`,
        context: { path },
      });
    }

    // Pin the content fetch to the commit the metadata came from, so a branch
    // moving between the two requests can't mix revisions.
    const pinnedCommit = entry.commit?.hash ?? commit;
    const response =
      await this.sourceApi.repositoriesWorkspaceRepoSlugSrcCommitPathGet(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          commit: pinnedCommit,
          path,
        },
        { responseType: 'arraybuffer' }
      );
    const bytes = new Uint8Array(response.data as unknown as ArrayBuffer);

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        ref,
        commit: pinnedCommit,
        path,
        size: bytes.byteLength,
        ...encodeContent(bytes),
      });
      return;
    }

    this.output.raw(bytes);
  }
}

/** UTF-8 text stays readable in JSON; anything else round-trips as base64. */
function encodeContent(bytes: Uint8Array): {
  encoding: 'utf-8' | 'base64';
  content: string;
} {
  try {
    return {
      encoding: 'utf-8',
      content: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    };
  } catch {
    return {
      encoding: 'base64',
      content: Buffer.from(bytes).toString('base64'),
    };
  }
}
