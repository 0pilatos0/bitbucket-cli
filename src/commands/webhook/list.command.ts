/**
 * List webhooks command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { WebhookSubscription, WebhooksApi } from '../../generated/api.js';
import {
  DEFAULT_WEBHOOK_SCOPE,
  WEBHOOK_SCOPES,
  resolveWebhooks,
  type WebhookScopeOptions,
} from './shared.js';

export interface ListWebhooksOptions extends WebhookScopeOptions {
  limit?: string;
  all?: boolean;
}

export class ListWebhooksCommand extends BaseCommand<
  ListWebhooksOptions,
  void
> {
  public readonly name = 'list';
  public readonly description = 'List webhooks';

  constructor(
    private readonly webhooksApi: WebhooksApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListWebhooksOptions,
    context: CommandContext
  ): Promise<void> {
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

    await this.runList<WebhookSubscription>(
      {
        options,
        concurrency: 1,
        fetchPage: (page, pagelen, next) => hooks.list(page, pagelen, next),
        wrapperKey: 'webhooks',
        jsonMetadata: hooks.metadata,
        emptyMessage: `No webhooks found for ${hooks.label}`,
        tableHeaders: ['UUID', 'DESCRIPTION', 'URL', 'EVENTS', 'ACTIVE'],
        mapRow: (webhook) => [
          webhook.uuid ?? '',
          webhook.description ?? '',
          webhook.url ?? '',
          (webhook.events ?? []).join(','),
          webhook.active ? 'yes' : 'no',
        ],
        flexColumns: [1, 3],
        noun: 'webhooks',
      },
      context
    );
  }
}
