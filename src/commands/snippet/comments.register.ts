import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerSnippetCommentsCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const snippetCommentsCmd = new Command('comments').description(
    'Manage snippet comments'
  );

  snippetCommentsCmd
    .command('list <id>')
    .description('List comments on a snippet')
    .option('--limit <number>', 'Maximum number of comments', '25')
    .option('--all', 'List all comments (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb snippet comments list kypj',
          'bb snippet comments list kypj --all',
          'bb snippet comments list kypj --limit 50 --json',
        ],
        defaults: { limit: '25' },
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListSnippetCommentsCommand,
        { id, ...options }
      );
    });

  snippetCommentsCmd
    .command('add <id> [message]')
    .description('Add a comment to a snippet (message is required)')
    .option(
      '-m, --message <text>',
      'Comment message (alternative to the positional [message] argument; one of the two is required)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb snippet comments add kypj "Great snippet!"',
          'bb snippet comments add kypj -m "Great snippet!"',
          'bb snippet comments add kypj "Great snippet!" --json',
        ],
      })
    )
    .action(async (id, message, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.AddSnippetCommentCommand,
        { id, ...options, message: message ?? options.message }
      );
    });

  snippetCommentsCmd
    .command('edit <snippet-id> <comment-id> <message>')
    .description('Edit a comment on a snippet')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb snippet comments edit kypj 123 "Updated comment"',
          'bb snippet comments edit kypj 123 "Updated comment" --json',
        ],
      })
    )
    .action(async (snippetId, commentId, message, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.EditSnippetCommentCommand,
        { snippetId, commentId, message }
      );
    });

  snippetCommentsCmd
    .command('delete <snippet-id> <comment-id>')
    .description('Delete a comment on a snippet')
    .option('-y, --yes', 'Skip confirmation prompt')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb snippet comments delete kypj 123',
          'bb snippet comments delete kypj 123 --yes',
        ],
      })
    )
    .action(async (snippetId, commentId, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.DeleteSnippetCommentCommand,
        { snippetId, commentId, ...options }
      );
    });

  parent.addCommand(snippetCommentsCmd);
}
