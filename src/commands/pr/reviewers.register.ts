import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerPrReviewersCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const prReviewersCmd = new Command('reviewers').description(
    'Manage pull request reviewers'
  );

  prReviewersCmd
    .command('list <id>')
    .description('List reviewers on a pull request')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb pr reviewers list 42', 'bb pr reviewers list 42 --json'],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListReviewersPRCommand,
        { id, ...options }
      );
    });

  prReviewersCmd
    .command('add <id> <user>')
    .description(
      'Add a reviewer to a pull request (user is an account ID or {uuid})'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr reviewers add 42 "712020:3cfed7e0-0ed6-49fc-bb35-410a00ccee6f"',
          'bb pr reviewers add 42 "{c1cb1bb5-2e32-456e-a373-43978dc12aa1}"',
        ],
      })
    )
    .action(async (id, user, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.AddReviewerPRCommand, {
        id,
        username: user,
        ...options,
      });
    });

  prReviewersCmd
    .command('remove <id> <user>')
    .description(
      'Remove a reviewer from a pull request (user is an account ID or {uuid})'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr reviewers remove 42 "712020:3cfed7e0-0ed6-49fc-bb35-410a00ccee6f"',
          'bb pr reviewers remove 42 "{c1cb1bb5-2e32-456e-a373-43978dc12aa1}"',
        ],
      })
    )
    .action(async (id, user, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.RemoveReviewerPRCommand,
        { id, username: user, ...options }
      );
    });

  parent.addCommand(prReviewersCmd);
}
