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
  WEBHOOK_SCOPES,
  describeTarget,
  resolveWebhookTarget,
  targetMetadata,
  webhookEndpoints,
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
    const target = await resolveWebhookTarget(
      this.parseEnumOption(options.scope ?? 'repo', 'scope', WEBHOOK_SCOPES),
      options,
      context,
      this.contextService
    );
    const endpoints = webhookEndpoints(this.webhooksApi, target);

    await this.runList<WebhookSubscription>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response = await endpoints.list({ params: { page, pagelen } });
          return response.data;
        },
        wrapperKey: 'webhooks',
        jsonMetadata: targetMetadata(target),
        emptyMessage: `No webhooks found for ${describeTarget(target)}`,
        tableHeaders: ['UUID', 'DESCRIPTION', 'URL', 'EVENTS', 'ACTIVE'],
        mapRow: (webhook) => [
          webhook.uuid ?? '',
          this.truncateText(
            webhook.description ?? '',
            40,
            context.globalOptions
          ),
          webhook.url ?? '',
          this.truncateText(
            (webhook.events ?? []).join(','),
            50,
            context.globalOptions
          ),
          webhook.active ? 'yes' : 'no',
        ],
        noun: 'webhooks',
      },
      context
    );
  }
}
