/**
 * View snippet command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Snippet, SnippetsApi } from '../../generated/api.js';
import {
  getUserDisplayName,
  getLinkHref,
} from '../../services/response-parsers.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface ViewSnippetOptions {
  workspace?: string;
}

export class ViewSnippetCommand extends BaseCommand<
  { id: string } & ViewSnippetOptions,
  void
> {
  public readonly name = 'view';
  public readonly description = 'View snippet details';

  constructor(
    private readonly snippetsApi: SnippetsApi,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & ViewSnippetOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await this.resolveWorkspace(
      options.workspace ?? context.globalOptions.workspace
    );

    const response = await this.snippetsApi.snippetsWorkspaceEncodedIdGet({
      workspace,
      encodedId: options.id,
    });

    const snippet = response.data;

    if (context.globalOptions.json) {
      this.output.json(snippet);
      return;
    }

    this.renderSnippet(snippet, workspace);
  }

  private renderSnippet(snippet: Snippet, workspace: string): void {
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

    // Files come through the dynamic properties of ModelObject
    const files = (snippet as Record<string, unknown>).files;
    if (files && typeof files === 'object') {
      const fileNames = Object.keys(files as Record<string, unknown>);
      if (fileNames.length > 0) {
        this.output.text('');
        this.output.text('Files:');
        for (const name of fileNames) {
          this.output.text(`  ${name}`);
        }
      }
    }

    const htmlHref = getLinkHref(
      (snippet as Record<string, unknown>).links,
      'html'
    );
    if (htmlHref) {
      this.output.text('');
      this.output.text(this.output.cyan(htmlHref));
    }

    this.output.text('');
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
