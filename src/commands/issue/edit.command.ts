/**
 * Edit issue command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  IssueKindEnum,
  IssuePriorityEnum,
  IssueStateEnum,
  IssueTrackerApi,
} from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';
import {
  assigneeBody,
  cliStateToApi,
  ISSUE_KINDS,
  ISSUE_PRIORITIES,
  ISSUE_STATES,
  rethrowIssueNotFound,
  type IssueChanges,
} from './shared.js';

export interface EditIssueOptions extends GlobalOptions {
  id: string;
  title?: string;
  body?: string;
  kind?: string;
  priority?: string;
  assignee?: string;
  state?: string;
}

export class EditIssueCommand extends BaseCommand<EditIssueOptions, void> {
  public readonly name = 'edit';
  public readonly description = 'Edit an issue';

  constructor(
    private readonly issueTrackerApi: IssueTrackerApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: EditIssueOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const changes = this.buildChanges(options);

    const response = await this.issueTrackerApi
      .repositoriesWorkspaceRepoSlugIssuesIssueIdPut(
        {
          issueId: options.id,
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
        },
        // The generated client omits the request body for this endpoint (the
        // OpenAPI spec doesn't model it), so the partial update goes through
        // the raw axios config instead. Do NOT move this into the request
        // parameters — they are path-only.
        { data: changes }
      )
      .catch((error: unknown) =>
        rethrowIssueNotFound(
          error,
          options.id,
          repoContext.workspace,
          repoContext.repoSlug
        )
      );

    const issue = response.data;

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        issue,
      });
      return;
    }

    this.output.success(`Issue #${options.id} updated`);
  }

  /** Build the partial PUT body, requiring at least one editable flag. */
  private buildChanges(options: EditIssueOptions): IssueChanges {
    const kind = options.kind
      ? this.parseEnumOption(options.kind, 'kind', ISSUE_KINDS)
      : undefined;
    const priority = options.priority
      ? this.parseEnumOption(options.priority, 'priority', ISSUE_PRIORITIES)
      : undefined;
    const state = options.state
      ? this.parseEnumOption(options.state, 'state', ISSUE_STATES)
      : undefined;

    const changes: IssueChanges = {
      // 'type' is the ModelObject discriminator required on request bodies.
      type: 'issue',
      ...(options.title !== undefined ? { title: options.title } : {}),
      ...(options.body !== undefined ? { content: { raw: options.body } } : {}),
      ...(kind ? { kind: kind as IssueKindEnum } : {}),
      ...(priority ? { priority: priority as IssuePriorityEnum } : {}),
      ...(options.assignee ? { assignee: assigneeBody(options.assignee) } : {}),
      ...(state ? { state: cliStateToApi(state) as IssueStateEnum } : {}),
    };

    if (Object.keys(changes).length === 1) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: this.appendHelpHint(
          'At least one of --title, --body, --kind, --priority, --assignee, or --state is required.'
        ),
      });
    }

    return changes;
  }
}
