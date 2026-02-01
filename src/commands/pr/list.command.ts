/**
 * List PRs command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IConfigService,
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Pullrequest } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import type { PullrequestsApiWrapper } from '../../services/api-wrapper.js';

export interface ListPRsOptions extends GlobalOptions {
  state?: string;
  limit?: string;
  mine?: boolean;
}

export class ListPRsCommand extends BaseCommand<ListPRsOptions, void> {
  public readonly name = 'list';
  public readonly description = 'List pull requests';

  constructor(
    private readonly pullrequestsApi: PullrequestsApiWrapper,
    private readonly contextService: IContextService,
    private readonly configService: IConfigService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListPRsOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContext({
      ...context.globalOptions,
      ...options,
    });

    const state = (options.state || 'OPEN') as
      | 'OPEN'
      | 'MERGED'
      | 'DECLINED'
      | 'SUPERSEDED';

    let query: string | undefined;

    if (options.mine) {
      const userUuid = await this.configService.getUserUuid();
      if (userUuid) {
        query = `reviewers.uuid="${userUuid}"`;
      } else {
        this.output.warning(
          'Could not determine your user UUID. Showing all PRs.'
        );
      }
    }

    try {
      const response = await this.pullrequestsApi.list(
        repoContext.workspace,
        repoContext.repoSlug,
        state,
        query
      );

      const values = response.values;

      if (values.length === 0) {
        this.output.text(`No ${state.toLowerCase()} pull requests found`);
        return;
      }

      const rows = values.map((pr) => {
        const title = pr.draft ? `[DRAFT] ${pr.title}` : pr.title;
        const source = pr.source as { branch?: { name?: string } } | undefined;
        const destination = pr.destination as
          | { branch?: { name?: string } }
          | undefined;
        return [
          `#${pr.id}`,
          this.truncate(title ?? '', 50),
          pr.author?.display_name ?? 'Unknown',
          `${source?.branch?.name ?? 'unknown'} → ${destination?.branch?.name ?? 'unknown'}`,
        ];
      });

      this.output.table(['ID', 'TITLE', 'AUTHOR', 'BRANCHES'], rows);
    } catch (error) {
      this.handleError(error, context);
      throw error;
    }
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}
