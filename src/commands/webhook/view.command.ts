/**
 * View webhook command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { WebhookSubscription, WebhooksApi } from '../../generated/api.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';
import {
  DEFAULT_WEBHOOK_SCOPE,
  WEBHOOK_SCOPES,
  normalizeWebhookUid,
  resolveWebhooks,
  type WebhookScopeOptions,
} from './shared.js';

export interface ViewWebhookOptions extends WebhookScopeOptions {
  uid: string;
}

export class ViewWebhookCommand extends BaseCommand<ViewWebhookOptions, void> {
  public readonly name = 'view';
  public readonly description = 'View webhook details';

  constructor(
    private readonly webhooksApi: WebhooksApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ViewWebhookOptions,
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

    const webhook = await hooks
      .get(uid)
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Webhook ${uid} not found for ${hooks.label}.`
        )
      );

    if (context.globalOptions.json) {
      await this.output.json({ ...hooks.metadata, webhook });
      return;
    }

    this.renderWebhook(webhook);
  }

  private renderWebhook(webhook: WebhookSubscription): void {
    const state = webhook.active ? 'active' : 'inactive';

    this.output.text('');
    this.output.text(
      `${this.output.bold(webhook.uuid ?? '')}  ${webhook.description ?? ''}  ${this.output.gray(`[${state}]`)}`
    );
    this.output.separator();

    if (webhook.url) {
      this.output.text(`URL:        ${webhook.url}`);
    }
    if (webhook.subject_type) {
      this.output.text(`Scope:      ${webhook.subject_type}`);
    }
    this.output.text(`Secret:     ${webhook.secret_set ? 'set' : 'not set'}`);
    if (webhook.created_at) {
      this.output.text(
        `Created:    ${this.output.formatDate(webhook.created_at)}`
      );
    }

    const events = webhook.events ?? [];
    if (events.length > 0) {
      this.output.text('');
      this.output.text('Events:');
      for (const event of events) {
        this.output.text(`  ${event}`);
      }
    }

    this.output.text('');
  }
}
