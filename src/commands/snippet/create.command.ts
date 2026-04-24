/**
 * Create snippet command implementation
 *
 * Bitbucket's POST /snippets/{workspace} requires multipart/form-data with
 * at least one `file` part. We bypass the generated OpenAPI client (which
 * only serializes JSON) and use SnippetFilesService for the upload.
 */

import fs from 'node:fs';
import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
  ISnippetFilesService,
} from '../../core/interfaces/services.js';
import { getLinkHref } from '../../services/response-parsers.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface CreateSnippetOptions {
  workspace?: string;
  title?: string;
  file?: string[];
  private?: boolean;
  public?: boolean;
}

export class CreateSnippetCommand extends BaseCommand<
  CreateSnippetOptions,
  void
> {
  public readonly name = 'create';
  public readonly description = 'Create a snippet';

  constructor(
    private readonly snippetFilesService: ISnippetFilesService,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: CreateSnippetOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await this.contextService.requireWorkspace(
      options.workspace ?? context.globalOptions.workspace
    );

    const title = this.requireOption(
      options.title,
      'title',
      'Snippet title is required. Use --title option.'
    );

    if (!options.file || options.file.length === 0) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: 'At least one file is required. Use --file option.',
      });
    }

    if (options.private && options.public) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: '--private and --public cannot both be set.',
      });
    }

    for (const filePath of options.file) {
      if (!fs.existsSync(filePath)) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message: `File not found: ${filePath}`,
          context: { file: filePath },
        });
      }
    }

    const isPrivate = !options.public;

    const snippet = (await this.snippetFilesService.createWithFiles({
      workspace,
      title,
      isPrivate,
      files: options.file.map((path) => ({ path })),
    })) as Record<string, unknown>;

    if (context.globalOptions.json) {
      await this.output.json(snippet);
      return;
    }

    const visibility = isPrivate ? 'private' : 'public';
    const htmlHref = getLinkHref(snippet.links, 'html');

    this.output.success(
      `Created snippet ${String(snippet.id ?? '')} "${title}" (${visibility})`
    );
    if (htmlHref) {
      this.output.text(`  ${htmlHref}`);
    }
  }
}
