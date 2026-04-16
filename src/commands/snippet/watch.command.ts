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
import { resolveWorkspace } from '../../services/workspace-resolver.js';

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
    const workspace = await resolveWorkspace(
      this.configService,
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
}
