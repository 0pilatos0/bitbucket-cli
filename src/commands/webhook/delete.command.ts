/**
 * Delete webhook command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { WebhooksApi } from '../../generated/api.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';
import {
  DEFAULT_WEBHOOK_SCOPE,
  WEBHOOK_SCOPES,
  normalizeWebhookUid,
  resolveWebhooks,
  type WebhookScopeOptions,
} from './shared.js';

export interface DeleteWebhookOptions extends WebhookScopeOptions {
  uid: string;
  yes?: boolean;
}

export class DeleteWebhookCommand extends BaseCommand<
  DeleteWebhookOptions,
  void
> {
  public readonly name = 'delete';
  public readonly description = 'Delete a webhook';

  constructor(
    private readonly webhooksApi: WebhooksApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: DeleteWebhookOptions,
    context: CommandContext
  ): Promise<void> {
    const uid = normalizeWebhookUid(this.requireOption(options.uid, 'uid'));
    const hooks = await resolveWebhooks(
      this.parseEnumOption(
        options.scope ?? DEFAULT_WEBHOOK_SCOPE,
        'scope',
        WEBHOOK_SCOPES
      ),
      options,
      context,
      this.contextService,
      this.webhooksApi
    );

    await this.requireConfirmation(
      options.yes,
      `This will permanently delete webhook ${uid} from ${hooks.label}.`,
      context
    );

    await hooks
      .delete(uid)
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Webhook ${uid} not found for ${hooks.label}.`
        )
      );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        ...hooks.metadata,
        webhookId: uid,
      });
      return;
    }

    this.output.success(`Deleted webhook ${uid}`);
  }
}
