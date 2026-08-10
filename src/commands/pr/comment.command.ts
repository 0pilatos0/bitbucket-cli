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
  CommentInline,
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
    const validModesNote =
      'Valid modes: (1) general comment (no flags); (2) file-level comment (--file + --line-to or --line-from); (3) inline comment with line range (--file + --line-from + --line-to).';

    if ((options.lineTo || options.lineFrom) && !options.file) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: this.appendHelpHint(
          `--file is required when using --line-to or --line-from. ${validModesNote}`
        ),
        context: {
          validModes: ['general', 'file', 'inline'],
        },
      });
    }

    if (options.file && !options.lineTo && !options.lineFrom) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: this.appendHelpHint(
          `At least one of --line-to or --line-from is required when using --file. ${validModesNote}`
        ),
        context: {
          validModes: ['general', 'file', 'inline'],
        },
      });
    }

    const lineTo = options.lineTo
      ? this.parsePositiveInt(options.lineTo, 'line-to')
      : undefined;
    const lineFrom = options.lineFrom
      ? this.parsePositiveInt(options.lineFrom, 'line-from')
      : undefined;

    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const prId = this.parsePositiveInt(options.id, 'id');

    // Build inline object when --file is provided
    const inline: CommentInline | undefined = options.file
      ? {
          path: options.file,
          ...(lineTo !== undefined ? { to: lineTo } : {}),
          ...(lineFrom !== undefined ? { from: lineFrom } : {}),
        }
      : undefined;

    // Bitbucket rejects `type` here with 400 "extra keys not allowed", so the
    // required ModelObject.type is intentionally omitted.
    const body = {
      content: {
        raw: options.message,
      },
      ...(inline ? { inline } : {}),
    } as PullrequestComment;

    const response =
      await this.pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsPost(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          pullRequestId: prId,
          body,
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
