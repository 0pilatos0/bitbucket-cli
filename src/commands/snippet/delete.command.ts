/**
 * Delete snippet command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { SnippetsApi } from '../../generated/api.js';
import { resolveWorkspace } from '../../services/workspace-resolver.js';
import { BBError, ErrorCode } from '../../types/errors.js';

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
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & DeleteSnippetOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await resolveWorkspace(
      this.configService,
      options.workspace ?? context.globalOptions.workspace
    );

    if (!options.yes) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          `This will permanently delete snippet ${options.id}.\n` +
          'Use --yes to confirm deletion.',
      });
    }

    await this.snippetsApi.snippetsWorkspaceEncodedIdDelete({
      workspace,
      encodedId: options.id,
    });

    if (context.globalOptions.json) {
      this.output.json({
        success: true,
        snippetId: options.id,
        workspace,
      });
      return;
    }

    this.output.success(`Deleted snippet ${options.id}`);
  }
}
