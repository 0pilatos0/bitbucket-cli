/**
 * List branch restrictions command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  BranchRestrictionsApi,
  Branchrestriction,
} from '../../generated/api.js';
import { resolveLimit } from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';
import { BRANCH_RESTRICTION_KINDS, describeBranchMatch } from './shared.js';

export interface ListBranchRestrictionsOptions extends GlobalOptions {
  kind?: string;
  pattern?: string;
  limit?: string;
  all?: boolean;
}

export class ListBranchRestrictionsCommand extends BaseCommand<
  ListBranchRestrictionsOptions,
  void
> {
  public readonly name = 'list';
  public readonly description = 'List branch restrictions for a repository';

  constructor(
    private readonly branchRestrictionsApi: BranchRestrictionsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListBranchRestrictionsOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const kind =
      options.kind === undefined
        ? undefined
        : this.parseEnumOption(options.kind, 'kind', BRANCH_RESTRICTION_KINDS);
    resolveLimit(options);

    await this.runList<Branchrestriction>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response =
            await this.branchRestrictionsApi.repositoriesWorkspaceRepoSlugBranchRestrictionsGet(
              {
                workspace: repoContext.workspace,
                repoSlug: repoContext.repoSlug,
                kind,
                pattern: options.pattern,
              },
              { params: { page, pagelen } }
            );
          return response.data;
        },
        wrapperKey: 'branchRestrictions',
        jsonMetadata: {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          filters: { kind: kind ?? null, pattern: options.pattern ?? null },
        },
        emptyMessage: `No branch restrictions found in ${repoContext.workspace}/${repoContext.repoSlug}`,
        tableHeaders: ['ID', 'KIND', 'BRANCH', 'VALUE'],
        mapRow: (restriction) => [
          String(restriction.id ?? '-'),
          restriction.kind,
          describeBranchMatch(restriction),
          restriction.value === undefined || restriction.value === null
            ? '-'
            : String(restriction.value),
        ],
        noun: 'branch restrictions',
      },
      context
    );
  }
}
