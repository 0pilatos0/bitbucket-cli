/**
 * View snippet command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
  ISnippetFilesService,
} from '../../core/interfaces/services.js';
import type { Snippet, SnippetsApi } from '../../generated/api.js';
import {
  getUserDisplayName,
  getLinkHref,
} from '../../services/response-parsers.js';
import { resolveWorkspace } from '../../services/workspace-resolver.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface ViewSnippetOptions {
  workspace?: string;
  /** Print contents of a specific file within the snippet */
  file?: string;
  /** Print contents of all files within the snippet */
  files?: boolean;
}

export class ViewSnippetCommand extends BaseCommand<
  { id: string } & ViewSnippetOptions,
  void
> {
  public readonly name = 'view';
  public readonly description = 'View snippet details';

  constructor(
    private readonly snippetsApi: SnippetsApi,
    private readonly snippetFilesService: ISnippetFilesService,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & ViewSnippetOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await resolveWorkspace(
      this.configService,
      options.workspace ?? context.globalOptions.workspace
    );

    const response = await this.snippetsApi.snippetsWorkspaceEncodedIdGet({
      workspace,
      encodedId: options.id,
    });

    const snippet = response.data as Snippet & Record<string, unknown>;
    const fileNames = this.extractFileNames(snippet);

    if (options.file !== undefined) {
      if (!fileNames.includes(options.file)) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message: `File not found in snippet: ${options.file}`,
          context: { file: options.file, available: fileNames },
        });
      }
      const content = await this.snippetFilesService.getFileContent(
        workspace,
        options.id,
        options.file
      );
      if (context.globalOptions.json) {
        this.output.json({ file: options.file, content });
        return;
      }
      this.output.text(content);
      return;
    }

    if (options.files) {
      const contents: Record<string, string> = {};
      for (const name of fileNames) {
        contents[name] = await this.snippetFilesService.getFileContent(
          workspace,
          options.id,
          name
        );
      }
      if (context.globalOptions.json) {
        this.output.json({ snippet, files: contents });
        return;
      }
      this.renderSnippet(snippet, fileNames);
      for (const name of fileNames) {
        this.output.text('');
        this.output.text(this.output.bold(`── ${name} ──`));
        this.output.text(contents[name] ?? '');
      }
      return;
    }

    if (context.globalOptions.json) {
      this.output.json(snippet);
      return;
    }

    this.renderSnippet(snippet, fileNames);
  }

  private extractFileNames(
    snippet: Snippet & Record<string, unknown>
  ): string[] {
    const files = snippet.files;
    if (files && typeof files === 'object') {
      return Object.keys(files as Record<string, unknown>);
    }
    return [];
  }

  private renderSnippet(
    snippet: Snippet & Record<string, unknown>,
    fileNames: string[]
  ): void {
    const visibility = snippet.is_private ? 'private' : 'public';

    this.output.text('');
    this.output.text(
      `${this.output.bold(String(snippet.id ?? ''))}  ${snippet.title ?? 'Untitled'}  ${this.output.gray(`[${visibility}]`)}`
    );
    this.output.text(this.output.gray('─'.repeat(60)));

    const creator = getUserDisplayName(snippet.creator);
    if (creator) {
      this.output.text(`Creator:    ${creator}`);
    }

    const owner = getUserDisplayName(snippet.owner);
    if (owner) {
      this.output.text(`Owner:      ${owner}`);
    }

    if (snippet.created_on) {
      this.output.text(
        `Created:    ${this.output.formatDate(snippet.created_on)}`
      );
    }

    if (snippet.updated_on) {
      this.output.text(
        `Updated:    ${this.output.formatDate(snippet.updated_on)}`
      );
    }

    if (fileNames.length > 0) {
      this.output.text('');
      this.output.text('Files:');
      for (const name of fileNames) {
        this.output.text(`  ${name}`);
      }
    }

    const url =
      getLinkHref(snippet.links, 'html') ?? getLinkHref(snippet.links, 'self');
    if (url) {
      this.output.text('');
      this.output.text(this.output.cyan(url));
    }

    this.output.text('');
  }
}
