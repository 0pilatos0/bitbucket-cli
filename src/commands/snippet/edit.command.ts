/**
 * Edit snippet command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { SnippetsApi } from '../../generated/api.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface EditSnippetOptions {
  workspace?: string;
  title?: string;
  private?: boolean;
  public?: boolean;
}

export class EditSnippetCommand extends BaseCommand<
  { id: string } & EditSnippetOptions,
  void
> {
  public readonly name = 'edit';
  public readonly description = 'Edit a snippet';

  constructor(
    private readonly snippetsApi: SnippetsApi,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string } & EditSnippetOptions,
    context: CommandContext
  ): Promise<void> {
    const workspace = await this.resolveWorkspace(
      options.workspace ?? context.globalOptions.workspace
    );

    if (
      !options.title &&
      options.private === undefined &&
      options.public === undefined
    ) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: 'At least one of --title, --private, or --public is required.',
      });
    }

    const response = await this.snippetsApi.snippetsWorkspaceEncodedIdPut(
      {
        encodedId: options.id,
        workspace,
      },
      {
        data: {
          ...(options.title ? { title: options.title } : {}),
          ...(options.private !== undefined || options.public !== undefined
            ? { is_private: !options.public }
            : {}),
        },
      }
    );

    const snippet = response.data;

    if (context.globalOptions.json) {
      this.output.json(snippet);
      return;
    }

    this.output.success(`Updated snippet ${options.id}`);
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
