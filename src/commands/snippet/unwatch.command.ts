/**
 * Unwatch snippet command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { SnippetsApi } from '../../generated/api.js';
import { resolveWorkspace } from '../../services/workspace-resolver.js';

export interface UnwatchSnippetOptions {
  workspace?: string;
}

export class UnwatchSnippetCommand extends BaseCommand<
  { id: string } & UnwatchSnippetOptions,
  void
> {
  public readonly name = 'unwatch';
  public readonly description = 'Stop watching a snippet';

  constructor(
    private readonly snippetsApi: SnippetsApi,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & UnwatchSnippetOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await resolveWorkspace(
      this.configService,
      options.workspace ?? context.globalOptions.workspace
    );

    await this.snippetsApi.snippetsWorkspaceEncodedIdWatchDelete({
      workspace,
      encodedId: options.id,
    });

    if (context.globalOptions.json) {
      this.output.json({
        success: true,
        snippetId: options.id,
        watching: false,
      });
      return;
    }

    this.output.success(`Stopped watching snippet ${options.id}`);
  }
}
