/**
 * Add comment to PR command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import { BBError, ErrorCode } from '../../types/errors.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  PullrequestsApi,
  PullrequestComment,
} from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';

export interface CommentPROptions extends GlobalOptions {
  file?: string;
  lineTo?: string;
  lineFrom?: string;
}

export class CommentPRCommand extends BaseCommand<
  { id: string; message: string } & CommentPROptions,
  void
> {
  public readonly name = 'comment';
  public readonly description = 'Add a comment to a pull request';

  constructor(
    private readonly pullrequestsApi: PullrequestsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: { id: string; message: string } & CommentPROptions,
    context: CommandContext
  ): Promise<void> {
    // Validate inline flag combinations
    if ((options.lineTo || options.lineFrom) && !options.file) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: '--file is required when using --line-to or --line-from',
      });
    }

    if (options.file && !options.lineTo && !options.lineFrom) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message:
          'At least one of --line-to or --line-from is required when using --file',
      });
    }

    if (options.lineTo) {
      const parsed = Number.parseInt(options.lineTo, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message: '--line-to must be a positive integer',
        });
      }
    }

    if (options.lineFrom) {
      const parsed = Number.parseInt(options.lineFrom, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message: '--line-from must be a positive integer',
        });
      }
    }

    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const prId = Number.parseInt(options.id, 10);

    // Build inline object when --file is provided
    const inline = options.file
      ? {
          path: options.file,
          ...(options.lineTo
            ? { to: Number.parseInt(options.lineTo, 10) }
            : {}),
          ...(options.lineFrom
            ? { from: Number.parseInt(options.lineFrom, 10) }
            : {}),
        }
      : undefined;

    const body: PullrequestComment = {
      content: {
        raw: options.message,
      },
      ...(inline ? { inline: inline as object } : {}),
    } as PullrequestComment;

    const response =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsPost(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
          pullrequestComment: body,
        }
      );

    if (context.globalOptions.json) {
      const jsonOutput: Record<string, unknown> = {
        success: true,
        pullRequestId: prId,
        comment: response.data,
      };
      if (inline) {
        jsonOutput.inline = inline;
      }
      await this.output.json(jsonOutput);
      return;
    }

    if (inline) {
      if (inline.to) {
        this.output.success(
          `Added inline comment on ${inline.path}:${inline.to} to pull request #${prId}`
        );
      } else {
        this.output.success(
          `Added inline comment on ${inline.path} (old line ${inline.from}) to pull request #${prId}`
        );
      }
    } else {
      this.output.success(`Added comment to pull request #${prId}`);
    }
  }
}
