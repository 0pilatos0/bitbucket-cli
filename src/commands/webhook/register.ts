import { Command, Option } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';
import { withCompletionChoices } from '../../core/command-options.js';
import {
  DEFAULT_WEBHOOK_SCOPE,
  WEBHOOK_EVENTS,
  WEBHOOK_SCOPES,
} from './shared.js';

export function registerWebhookCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const webhookCmd = new Command('webhook').description(
    'Manage repository and workspace webhooks'
  );

  const webhookScopeOption = (): Option =>
    withCompletionChoices(
      new Option(
        '--scope <scope>',
        'Webhook scope: repo (current repository) or workspace'
      ),
      WEBHOOK_SCOPES
    );

  webhookCmd
    .command('list')
    .description('List webhooks')
    .addOption(webhookScopeOption())
    .option('--limit <number>', 'Maximum number of webhooks to list', '25')
    .option('--all', 'List all webhooks (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb webhook list',
          'bb webhook list --scope workspace -w my-workspace',
          "bb webhook list --json --jq '.webhooks[].url'",
        ],
        validValues: { 'Valid scopes': [...WEBHOOK_SCOPES] },
        defaults: { scope: DEFAULT_WEBHOOK_SCOPE, limit: '25' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListWebhooksCommand,
        options
      );
    });

  webhookCmd
    .command('view <uid>')
    .description('View webhook details (uid: webhook UUID)')
    .addOption(webhookScopeOption())
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb webhook view {a1b2c3d4-0000-0000-0000-000000000000}',
          'bb webhook view a1b2c3d4-0000-0000-0000-000000000000 --scope workspace',
          "bb webhook view {a1b2c3d4-0000-0000-0000-000000000000} --json --jq '.webhook.events'",
        ],
        validValues: { 'Valid scopes': [...WEBHOOK_SCOPES] },
        defaults: { scope: DEFAULT_WEBHOOK_SCOPE },
      })
    )
    .action(async (uid, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ViewWebhookCommand, {
        uid,
        ...options,
      });
    });

  webhookCmd
    .command('create')
    .description('Create a webhook')
    .addOption(webhookScopeOption())
    .option('--url <url>', 'URL events are delivered to (required)')
    .addOption(
      withCompletionChoices(
        new Option(
          '-e, --event <event...>',
          'Event to subscribe to (required; repeatable)'
        ),
        WEBHOOK_EVENTS
      )
    )
    .option('-d, --description <description>', 'Webhook description')
    .option(
      '--secret <secret>',
      'Secret used to sign deliveries (X-Hub-Signature)'
    )
    .option('--inactive', 'Create the webhook disabled')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb webhook create --url https://ci.example.com/hook --event repo:push',
          'bb webhook create --url https://example.com/hook -e pullrequest:created -e pullrequest:fulfilled -d "PR bot"',
          'bb webhook create --scope workspace -w my-workspace --url https://example.com/hook -e repo:push --secret "$WEBHOOK_SECRET"',
        ],
        validValues: {
          'Valid scopes': [...WEBHOOK_SCOPES],
          'Valid events': [...WEBHOOK_EVENTS],
        },
        defaults: { scope: DEFAULT_WEBHOOK_SCOPE },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.CreateWebhookCommand,
        options
      );
    });

  webhookCmd
    .command('delete <uid>')
    .description('Delete a webhook (uid: webhook UUID)')
    .addOption(webhookScopeOption())
    .option('-y, --yes', 'Skip confirmation prompt')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb webhook delete {a1b2c3d4-0000-0000-0000-000000000000}',
          'bb webhook delete a1b2c3d4-0000-0000-0000-000000000000 --scope workspace --yes',
        ],
        validValues: { 'Valid scopes': [...WEBHOOK_SCOPES] },
        defaults: { scope: DEFAULT_WEBHOOK_SCOPE },
      })
    )
    .action(async (uid, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.DeleteWebhookCommand, {
        uid,
        ...options,
      });
    });

  parent.addCommand(webhookCmd);
}
