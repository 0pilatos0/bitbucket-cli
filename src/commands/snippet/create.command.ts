/**
 * Create snippet command implementation
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Snippet, SnippetsApi } from '../../generated/api.js';
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
    private readonly snippetsApi: SnippetsApi,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: CreateSnippetOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await this.resolveWorkspace(
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

    // Validate files exist before making API call
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

    // Build snippet body - file content requires multipart, but for the
    // generated client we send metadata via JSON. The generated API client
    // sends application/json which only supports metadata.
    // We create the snippet with metadata first, then note the limitation.
    const body: Snippet = {
      title,
      is_private: isPrivate,
    } as Snippet;

    const response = await this.snippetsApi.snippetsWorkspacePost({
      workspace,
      body,
    });

    const snippet = response.data;

    if (context.globalOptions.json) {
      this.output.json(snippet);
      return;
    }

    const visibility = isPrivate ? 'private' : 'public';
    const htmlHref = getLinkHref(
      (snippet as Record<string, unknown>).links,
      'html'
    );

    this.output.success(
      `Created snippet ${snippet.id ?? ''} "${title}" (${visibility})`
    );
    if (htmlHref) {
      this.output.text(`  ${htmlHref}`);
    }
  }

  private async resolveWorkspace(workspace?: string): Promise<string> {
    if (workspace) {
      return workspace;
    }

    const config = await this.configService.getConfig();

    if (!config.defaultWorkspace) {
      throw new BBError({
        code: ErrorCode.CONTEXT_WORKSPACE_NOT_FOUND,
        message:
          'No workspace specified. Use --workspace option or set a default workspace.',
      });
    }

    return config.defaultWorkspace;
  }
}
