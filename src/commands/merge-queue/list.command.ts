/**
 * List merge-queue command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { MergeQueue, MergeQueuesApi } from '../../generated/api.js';

export interface ListMergeQueuesOptions {
  workspace?: string;
  repo?: string;
  limit?: string;
  all?: boolean;
}

export class ListMergeQueuesCommand extends BaseCommand<
  ListMergeQueuesOptions,
  void
> {
  public readonly name = 'list';
  public readonly description = 'List merge queues in a repository';

  constructor(
    private readonly mergeQueuesApi: MergeQueuesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListMergeQueuesOptions,
    context: CommandContext
  ): Promise<void> {
    const { workspace, repoSlug } =
      await this.contextService.requireRepoContextFor(options, context);

    await this.runList<MergeQueue>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response = await this.mergeQueuesApi.listMergeQueues({
            workspace,
            repoSlug,
            page,
            pagelen,
          });
          return response.data;
        },
        wrapperKey: 'mergeQueues',
        jsonMetadata: { workspace, repoSlug },
        emptyMessage: 'No merge queues found',
        tableHeaders: ['Name', 'State', 'UUID'],
        mapRow: (queue) => [queue.name, queue.state, queue.uuid],
        noun: 'merge queues',
      },
      context
    );
  }
}
