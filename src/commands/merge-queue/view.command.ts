/**
 * View merge-queue command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { MergeQueue, MergeQueuesApi } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface ViewMergeQueueOptions extends GlobalOptions {
  uuid: string;
}

export class ViewMergeQueueCommand extends BaseCommand<
  ViewMergeQueueOptions,
  void
> {
  public readonly name = 'view';
  public readonly description = 'View a merge queue';

  constructor(
    private readonly mergeQueuesApi: MergeQueuesApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ViewMergeQueueOptions,
    context: CommandContext
  ): Promise<void> {
    const mergeQueueUuid = this.parseUuidArg(
      this.requireOption(options.uuid, 'uuid'),
      'uuid'
    );
    const { workspace, repoSlug } =
      await this.contextService.requireRepoContextFor(options, context);

    const response = await this.mergeQueuesApi
      .getMergeQueue({ workspace, repoSlug, mergeQueueUuid })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Merge queue ${mergeQueueUuid} not found in ${workspace}/${repoSlug}.`
        )
      );
    const mergeQueue = response.data;

    if (context.globalOptions.json) {
      await this.output.json({ workspace, repoSlug, mergeQueue });
      return;
    }

    this.render(mergeQueue);
  }

  private render(mergeQueue: MergeQueue): void {
    this.output.text('');
    this.output.text(
      `${this.output.bold(mergeQueue.name)}  ${this.output.gray(`[${mergeQueue.state}]`)}`
    );
    this.output.separator();
    this.output.text(`UUID:   ${mergeQueue.uuid}`);
    this.output.text('');
  }
}
