/**
 * Edit snippet command implementation
 *
 * Supports metadata-only edits (title / visibility) via a JSON PUT and
 * file replacement / addition via a multipart PUT. The generated OpenAPI
 * client doesn't model either body shape, so we route through
 * SnippetFilesService.
 */

import fs from 'node:fs';
import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
  ISnippetFilesService,
} from '../../core/interfaces/services.js';
import { resolveWorkspace } from '../../services/workspace-resolver.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface EditSnippetOptions {
  workspace?: string;
  title?: string;
  private?: boolean;
  public?: boolean;
  file?: string[];
}

export class EditSnippetCommand extends BaseCommand<
  { id: string } & EditSnippetOptions,
  void
> {
  public readonly name = 'edit';
  public readonly description = 'Edit a snippet';

  constructor(
    private readonly snippetFilesService: ISnippetFilesService,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & EditSnippetOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await resolveWorkspace(
      this.configService,
      options.workspace ?? context.globalOptions.workspace
    );

    const hasTitle = options.title !== undefined;
    const hasVisibility =
      options.private !== undefined || options.public !== undefined;
    const hasFiles = options.file !== undefined && options.file.length > 0;

    if (!hasTitle && !hasVisibility && !hasFiles) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          'At least one of --title, --private, --public, or --file is required.',
      });
    }

    if (options.private && options.public) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: '--private and --public cannot both be set.',
      });
    }

    if (hasFiles) {
      for (const filePath of options.file!) {
        if (!fs.existsSync(filePath)) {
          throw new BBError({
            code: ErrorCode.VALIDATION_INVALID,
            message: `File not found: ${filePath}`,
            context: { file: filePath },
          });
        }
      }
    }

    const isPrivate = hasVisibility ? !options.public : undefined;

    const snippet = hasFiles
      ? await this.snippetFilesService.editWithFiles({
          workspace,
          encodedId: options.id,
          title: options.title,
          isPrivate,
          files: options.file!.map((path) => ({ path })),
        })
      : await this.snippetFilesService.editMetadata({
          workspace,
          encodedId: options.id,
          title: options.title,
          isPrivate,
        });

    if (context.globalOptions.json) {
      this.output.json(snippet);
      return;
    }

    this.output.success(`Updated snippet ${options.id}`);
  }
}
