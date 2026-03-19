/**
 * Watch snippet command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { SnippetsApi } from '../../generated/api.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface WatchSnippetOptions {
  workspace?: string;
}

export class WatchSnippetCommand extends BaseCommand<
  { id: string } & WatchSnippetOptions,
  void
> {
  public readonly name = 'watch';
  public readonly description = 'Watch a snippet';

  constructor(
    private readonly snippetsApi: SnippetsApi,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & WatchSnippetOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await this.resolveWorkspace(
      options.workspace ?? context.globalOptions.workspace
    );

    await this.snippetsApi.snippetsWorkspaceEncodedIdWatchPut({
      workspace,
      encodedId: options.id,
    });

    if (context.globalOptions.json) {
      this.output.json({
        success: true,
        snippetId: options.id,
        watching: true,
      });
      return;
    }

    this.output.success(`Now watching snippet ${options.id}`);
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
