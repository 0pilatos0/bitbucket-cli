/**
 * Add a default reviewer to a repository.
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { UsersApi } from '../../generated/api.js';
import type { DefaultReviewerService } from '../../services/default-reviewer.service.js';
import type { GlobalOptions } from '../../types/config.js';

export interface AddDefaultReviewerOptions extends GlobalOptions {
  username: string;
}

export class AddDefaultReviewerCommand extends BaseCommand<
  AddDefaultReviewerOptions,
  void
> {
  public readonly name = 'default-reviewers.add';
  public readonly description = 'Add a default reviewer to a repository';

  constructor(
    private readonly defaultReviewerService: DefaultReviewerService,
    private readonly usersApi: UsersApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: AddDefaultReviewerOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    // Bitbucket's default-reviewers PUT accepts account_id or {uuid} in the
    // URL path, but not the nickname. Resolve via the users API first so
    // users can pass whatever handle they know.
    const userResponse = await this.usersApi.usersSelectedUserGet({
      selectedUser: options.username,
    });
    const user = userResponse.data;
    const identifier = user.uuid ?? options.username;

    const entry = await this.defaultReviewerService.add(
      repoContext,
      identifier
    );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        reviewer: entry,
      });
      return;
    }

    this.output.success(
      `Added ${entry.displayName ?? user.display_name ?? options.username} as a default reviewer for ${repoContext.workspace}/${repoContext.repoSlug}`
    );
  }
}
