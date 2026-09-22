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
  WEBHOOK_SCOPES,
  describeTarget,
  normalizeWebhookUid,
  resolveWebhookTarget,
  targetMetadata,
  webhookEndpoints,
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
    const target = await resolveWebhookTarget(
      this.parseEnumOption(options.scope ?? 'repo', 'scope', WEBHOOK_SCOPES),
      options,
      context,
      this.contextService
    );
    const endpoints = webhookEndpoints(this.webhooksApi, target);

    this.requireConfirmation(
      options.yes,
      `This will permanently delete webhook ${uid} from ${describeTarget(target)}.`
    );

    await endpoints
      .delete(uid)
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Webhook ${uid} not found for ${describeTarget(target)}.`
        )
      );

    if (context.globalOptions.json) {
      await this.output.json({
        success: true,
        ...targetMetadata(target),
        webhookId: uid,
      });
      return;
    }

    this.output.success(`Deleted webhook ${uid}`);
  }
}
