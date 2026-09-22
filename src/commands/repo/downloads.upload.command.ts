/**
 * Upload files as repository download artifacts
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { DownloadsApi } from '../../generated/api.js';
import { resolveUploadTimeoutMs } from '../../services/api-client.service.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface UploadDownloadOptions extends GlobalOptions {
  files: string[];
}

export class UploadDownloadCommand extends BaseCommand<
  UploadDownloadOptions,
  void
> {
  public readonly name = 'downloads.upload';
  public readonly description = 'Upload files as repository download artifacts';

  constructor(
    private readonly downloadsApi: DownloadsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: UploadDownloadOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const files = options.files ?? [];
    if (files.length === 0) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: this.appendHelpHint('At least one file is required.'),
      });
    }

    const form = new FormData();
    const names: string[] = [];
    let totalBytes = 0;
    for (const filePath of files) {
      if (!fs.existsSync(filePath)) {
        throw new BBError({
          code: ErrorCode.FILE_NOT_FOUND,
          message: `File not found: ${filePath}`,
          context: { file: filePath },
        });
      }
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message: stat.isDirectory()
            ? `'${filePath}' is a directory, not a file`
            : `'${filePath}' is not a regular file`,
          context: { file: filePath },
        });
      }
      const name = path.basename(filePath);
      if (names.includes(name)) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message: `Two files would both upload as '${name}'; artifact names must be unique.`,
          context: { file: filePath },
        });
      }
      // Wrapped in a File because FormData keeps a BunFile's own name (the
      // full path) and ignores the filename argument.
      form.append('files', new File([Bun.file(filePath)], name));
      names.push(name);
      totalBytes += stat.size;
    }

    // The spec models this endpoint without a request body; the multipart
    // form goes through the axios request options instead.
    await this.downloadsApi.repositoriesWorkspaceRepoSlugDownloadsPost(
      {
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
      },
      {
        data: form,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: resolveUploadTimeoutMs(totalBytes),
      }
    );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        uploaded: names,
      });
      return;
    }

    this.output.success(
      `Uploaded ${names.join(', ')} to ${repoContext.workspace}/${repoContext.repoSlug} downloads`
    );
  }
}
