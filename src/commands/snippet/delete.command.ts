/**
 * Delete snippet command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { SnippetsApi } from '../../generated/api.js';

export interface DeleteSnippetOptions {
  workspace?: string;
  yes?: boolean;
}

export class DeleteSnippetCommand extends BaseCommand<
  { id: string } & DeleteSnippetOptions,
  void
> {
  public readonly name = 'delete';
  public readonly description = 'Delete a snippet';

  constructor(
    private readonly snippetsApi: SnippetsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & DeleteSnippetOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await this.contextService.requireWorkspace(
      options.workspace ?? context.globalOptions.workspace
    );

    this.requireConfirmation(
      options.yes,
      `This will permanently delete snippet ${options.id}.`
    );

    await this.snippetsApi.snippetsWorkspaceEncodedIdDelete({
      workspace,
      encodedId: options.id,
    });

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        snippetId: options.id,
        workspace,
      });
      return;
    }

    this.output.success(`Deleted snippet ${options.id}`);
  }
}
