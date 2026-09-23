/**
 * Create webhook command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type { WebhooksApi } from '../../generated/api.js';
import { BBError, ErrorCode } from '../../types/errors.js';
import {
  DEFAULT_WEBHOOK_SCOPE,
  WEBHOOK_EVENTS,
  WEBHOOK_SCOPES,
  resolveWebhooks,
  type WebhookScopeOptions,
} from './shared.js';

export interface CreateWebhookOptions extends WebhookScopeOptions {
  url?: string;
  event?: string[];
  description?: string;
  secret?: string;
  inactive?: boolean;
}

export class CreateWebhookCommand extends BaseCommand<
  CreateWebhookOptions,
  void
> {
  public readonly name = 'create';
  public readonly description = 'Create a webhook';

  constructor(
    private readonly webhooksApi: WebhooksApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: CreateWebhookOptions,
    context: CommandContext
  ): Promise<void> {
    const url = this.requireOption(options.url, 'url');
    const rawEvents = options.event ?? [];
    if (rawEvents.length === 0) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: this.appendHelpHint(
          'At least one --event is required (e.g. --event repo:push).'
        ),
      });
    }
    const events = Array.from(
      new Set(
        rawEvents.map((event) =>
          this.parseEnumOption(event, 'event', WEBHOOK_EVENTS)
        )
      )
    );

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

    const webhook = await hooks.create({
      type: 'webhook_subscription',
      url,
      events,
      active: options.inactive !== true,
      ...(options.description !== undefined
        ? { description: options.description }
        : {}),
      ...(options.secret !== undefined ? { secret: options.secret } : {}),
    });

    if (context.globalOptions.json) {
      await this.output.json({ ...hooks.metadata, webhook });
      return;
    }

    this.output.success(
      `Created webhook ${webhook.uuid ?? url} for ${hooks.label}`
    );
  }
}
