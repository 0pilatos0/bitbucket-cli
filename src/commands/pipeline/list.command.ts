/**
 * List pipelines command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { Pipeline, PipelinesApi } from '../../generated/api.js';
import {
  GetPipelinesForRepositorySortEnum,
  GetPipelinesForRepositoryStatusEnum,
} from '../../generated/api.js';
import { resolveLimit } from '../../services/pagination.js';
import type { GlobalOptions } from '../../types/config.js';
import {
  colorPipelineStatus,
  formatDuration,
  getPipelineRef,
  getPipelineStatus,
  getPipelineTrigger,
} from './shared.js';

export const PIPELINE_STATUSES = Object.values(
  GetPipelinesForRepositoryStatusEnum
) as readonly string[];

// Every generated sort attribute plus its descending `-` form. The REST API
// accepts the leading `-` even though the generated enum only lists the
// ascending names, so the CLI single-sources both directions from the enum.
export const PIPELINE_SORTS: readonly string[] = Object.values(
  GetPipelinesForRepositorySortEnum
).flatMap((value) => [value, `-${value}`]);

export const DEFAULT_PIPELINE_SORT = '-created_on';

export interface ListPipelinesOptions extends GlobalOptions {
  status?: string;
  branch?: string;
  sort?: string;
  limit?: string;
  all?: boolean;
}

export class ListPipelinesCommand extends BaseCommand<
  ListPipelinesOptions,
  void
> {
  public readonly name = 'list';
  public readonly description = 'List pipelines for a repository';

  constructor(
    private readonly pipelinesApi: PipelinesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListPipelinesOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    // Validate --limit before the enum options so an invalid limit fails
    // fast; runList re-resolves the same value.
    resolveLimit(options);

    const status = options.status
      ? this.parseEnumOption(
          options.status.toUpperCase(),
          'status',
          PIPELINE_STATUSES
        )
      : undefined;
    const sort = options.sort
      ? this.parseEnumOption(options.sort, 'sort', PIPELINE_SORTS)
      : DEFAULT_PIPELINE_SORT;

    const hasFilters = Boolean(status ?? options.branch);

    await this.runList<Pipeline>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response = await this.pipelinesApi.getPipelinesForRepository(
            {
              workspace: repoContext.workspace,
              repoSlug: repoContext.repoSlug,
              ...(status
                ? { status: status as GetPipelinesForRepositoryStatusEnum }
                : {}),
              ...(options.branch ? { targetBranch: options.branch } : {}),
            },
            // `sort` goes through raw params: the generated enum only models
            // ascending names, but the API accepts the `-` descending prefix.
            { params: { page, pagelen, sort } }
          );

          return response.data;
        },
        wrapperKey: 'pipelines',
        jsonMetadata: {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          ...(status ? { status } : {}),
          ...(options.branch ? { branch: options.branch } : {}),
          sort,
        },
        emptyMessage: () =>
          hasFilters
            ? 'No pipelines found matching the given filters'
            : 'No pipelines found',
        tableHeaders: ['ID', 'STATUS', 'REF', 'TRIGGER', 'CREATED', 'DURATION'],
        mapRow: (pipeline) => {
          const pipelineStatus = getPipelineStatus(pipeline.state);
          const completed = Boolean(pipeline.completed_on);
          return [
            `#${pipeline.build_number ?? '?'}`,
            colorPipelineStatus(this.output, pipelineStatus),
            this.truncateText(
              getPipelineRef(pipeline),
              40,
              context.globalOptions
            ),
            getPipelineTrigger(pipeline),
            pipeline.created_on
              ? this.output.formatDate(pipeline.created_on)
              : '-',
            completed ? formatDuration(pipeline.build_seconds_used) : '-',
          ];
        },
        noun: 'pipelines',
      },
      context
    );
  }
}
