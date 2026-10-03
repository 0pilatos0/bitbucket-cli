import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';
import { DRY_RUN_DESCRIPTION } from '../../core/command-options.js';
import { PR_ID_ARGUMENT_DESCRIPTION } from './shared.js';

export function registerPrCommentsCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const prCommentsCmd = new Command('comments').description(
    'Manage pull request comments'
  );

  prCommentsCmd
    .command('list')
    .argument('[id]', PR_ID_ARGUMENT_DESCRIPTION)
    .description('List comments on a pull request')
    .option('--limit <number>', 'Maximum number of comments (default: 25)')
    .option('--all', 'List all comments (overrides --limit)')
    .option('--resolved', 'Only show resolved comments')
    .option('--unresolved', 'Only show unresolved comments')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr comments list',
          'bb pr comments list 42',
          'bb pr comments list 42 --no-truncate',
          'bb pr comments list 42 --unresolved',
          'bb pr comments list 42 --all',
          'bb pr comments list 42 --limit 50 --json',
        ],
        defaults: { limit: '25' },
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListCommentsPRCommand,
        { id, ...options }
      );
    });

  prCommentsCmd
    .command('add <id> [message]')
    .description('Add a comment to a pull request')
    .option(
      '-F, --body-file <file>',
      'Read comment text from file (- for stdin)'
    )
    .option('--file <path>', 'File path in the diff for inline comment')
    .option('--line-to <number>', 'Line number in the new file version')
    .option('--line-from <number>', 'Line number in the old file version')
    .option('--dry-run', DRY_RUN_DESCRIPTION)
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr comments add 42 "LGTM"',
          'bb pr comments add 42 "Fix this" --file src/main.ts --line-to 10',
          'bb pr comments add 42 -F review.md',
        ],
      })
    )
    .action(async (id, message, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.CommentPRCommand, {
        id,
        message,
        ...options,
      });
    });

  prCommentsCmd
    .command('edit <pr-id> <comment-id> <message>')
    .description('Edit a comment on a pull request')
    .option('--dry-run', DRY_RUN_DESCRIPTION)
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr comments edit 42 12345 "Updated comment"',
          'bb pr comments edit 42 12345 "Updated comment" --json',
        ],
      })
    )
    .action(async (prId, commentId, message, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.EditCommentPRCommand, {
        prId,
        commentId,
        message,
      });
    });

  prCommentsCmd
    .command('delete <pr-id> <comment-id>')
    .description('Delete a comment on a pull request')
    .option('-y, --yes', 'Skip confirmation prompt')
    .option('--dry-run', DRY_RUN_DESCRIPTION)
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr comments delete 42 12345',
          'bb pr comments delete 42 12345 --yes',
        ],
      })
    )
    .action(async (prId, commentId, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.DeleteCommentPRCommand,
        { prId, commentId, ...options }
      );
    });

  prCommentsCmd
    .command('view <pr-id> <comment-id>')
    .description('View a single comment on a pull request')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr comments view 42 12345',
          'bb pr comments view 42 12345 --json',
        ],
      })
    )
    .action(async (prId, commentId) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ViewCommentPRCommand, {
        prId,
        commentId,
      });
    });

  prCommentsCmd
    .command('reply <pr-id> <comment-id> [message]')
    .description('Reply to a comment on a pull request')
    .option('-F, --body-file <file>', 'Read reply text from file (- for stdin)')
    .option('--dry-run', DRY_RUN_DESCRIPTION)
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr comments reply 42 12345 "Good catch, fixed."',
          'bb pr comments reply 42 12345 "Fixed in the latest push" --json',
          'echo "Fixed, thanks" | bb pr comments reply 42 12345 -F -',
        ],
      })
    )
    .action(async (prId, commentId, message, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ReplyCommentPRCommand,
        { prId, commentId, message, ...options }
      );
    });

  prCommentsCmd
    .command('resolve <pr-id> <comment-id>')
    .description('Resolve a comment thread on a pull request')
    .option('--dry-run', DRY_RUN_DESCRIPTION)
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr comments resolve 42 12345',
          'bb pr comments resolve 42 12345 --json',
        ],
      })
    )
    .action(async (prId, commentId) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ResolveCommentPRCommand,
        { prId, commentId }
      );
    });

  prCommentsCmd
    .command('unresolve <pr-id> <comment-id>')
    .description('Reopen a resolved comment thread on a pull request')
    .option('--dry-run', DRY_RUN_DESCRIPTION)
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb pr comments unresolve 42 12345',
          'bb pr comments unresolve 42 12345 --json',
        ],
      })
    )
    .action(async (prId, commentId) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.UnresolveCommentPRCommand,
        { prId, commentId }
      );
    });

  parent.addCommand(prCommentsCmd);
}
