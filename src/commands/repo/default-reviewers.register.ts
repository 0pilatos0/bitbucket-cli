import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerRepoDefaultReviewersCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const repoDefaultReviewersCmd = new Command('default-reviewers').description(
    'Manage default reviewers for a repository'
  );

  repoDefaultReviewersCmd
    .command('list')
    .description('List default reviewers for a repository')
    .option(
      '--repo-only',
      'Only show reviewers configured on the repository (exclude project-inherited)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb repo default-reviewers list',
          'bb repo default-reviewers list --repo-only',
          'bb repo default-reviewers list --json',
        ],
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListDefaultReviewersCommand,
        options
      );
    });

  repoDefaultReviewersCmd
    .command('add <user>')
    .description(
      'Add a default reviewer to a repository (accepts account ID or {uuid})'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb repo default-reviewers add "712020:3cfed7e0-0ed6-49fc-bb35-410a00ccee6f"',
          'bb repo default-reviewers add "{c1cb1bb5-2e32-456e-a373-43978dc12aa1}"',
        ],
      })
    )
    .action(async (username, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.AddDefaultReviewerCommand,
        { username, ...options }
      );
    });

  repoDefaultReviewersCmd
    .command('remove <user>')
    .description(
      'Remove a default reviewer from a repository (accepts account ID or {uuid})'
    )
    .option('-y, --yes', 'Skip confirmation prompt')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb repo default-reviewers remove "712020:3cfed7e0-0ed6-49fc-bb35-410a00ccee6f" --yes',
        ],
      })
    )
    .action(async (username, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.RemoveDefaultReviewerCommand,
        { username, ...options }
      );
    });

  parent.addCommand(repoDefaultReviewersCmd);
}
