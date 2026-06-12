/**
 * Create issue command implementation
 */

import fs from 'node:fs';
import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  Issue,
  IssueKindEnum,
  IssuePriorityEnum,
  IssueTrackerApi,
} from '../../generated/api.js';
import { getLinkHref } from '../../services/response-parsers.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';
import {
  assigneeBody,
  ISSUE_KINDS,
  ISSUE_PRIORITIES,
  rethrowTrackerDisabled,
} from './shared.js';

export interface CreateIssueOptions extends GlobalOptions {
  title?: string;
  body?: string;
  bodyFile?: string;
  kind?: string;
  priority?: string;
  assignee?: string;
}

export class CreateIssueCommand extends BaseCommand<CreateIssueOptions, void> {
  public readonly name = 'create';
  public readonly description = 'Create an issue';

  constructor(
    private readonly issueTrackerApi: IssueTrackerApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: CreateIssueOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const title = this.requireOption(options.title, 'title');
    const body = this.resolveBody(options);
    const kind = options.kind
      ? this.parseEnumOption(options.kind, 'kind', ISSUE_KINDS)
      : undefined;
    const priority = options.priority
      ? this.parseEnumOption(options.priority, 'priority', ISSUE_PRIORITIES)
      : undefined;

    const issueBody: Issue = {
      // 'type' is the ModelObject discriminator required on request bodies.
      type: 'issue',
      title,
      ...(body !== undefined ? { content: { raw: body } } : {}),
      ...(kind ? { kind: kind as IssueKindEnum } : {}),
      ...(priority ? { priority: priority as IssuePriorityEnum } : {}),
      ...(options.assignee ? { assignee: assigneeBody(options.assignee) } : {}),
    };

    const response = await this.issueTrackerApi
      .repositoriesWorkspaceRepoSlugIssuesPost({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        issue: issueBody,
      })
      .catch((error: unknown) => rethrowTrackerDisabled(error));

    const issue = response.data;

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        issue,
      });
      return;
    }

    this.output.success(`Issue #${issue.id ?? '?'} created`);
    const url = getLinkHref(issue.links, 'html');
    if (url) {
      this.output.text(this.output.cyan(url));
    }
  }

  /** Resolve the issue body from --body or --body-file (mutually exclusive). */
  private resolveBody(options: CreateIssueOptions): string | undefined {
    if (options.body !== undefined && options.bodyFile !== undefined) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: this.appendHelpHint(
          '--body and --body-file cannot both be set.'
        ),
      });
    }
    if (options.bodyFile === undefined) {
      return options.body;
    }
    try {
      return fs.readFileSync(options.bodyFile, 'utf8');
    } catch (error) {
      throw new BBError({
        code: ErrorCode.FILE_NOT_FOUND,
        message: `Could not read --body-file: ${options.bodyFile}`,
        cause: error instanceof Error ? error : undefined,
        context: { file: options.bodyFile },
      });
    }
  }
}
