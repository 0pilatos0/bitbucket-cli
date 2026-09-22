import { Command, Option } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import { withCompletionChoices } from '../../core/command-options.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';
import { SnippetsWorkspaceGetRoleEnum } from '../../generated/api.js';
import { registerSnippetCommentsCommands } from './comments.register.js';

// Sourced from the generated OpenAPI enum so completion and the `validValues`
// help block track the spec on every `bun run generate:api`.
const SNIPPET_ROLES = Object.values(SnippetsWorkspaceGetRoleEnum);

export function registerSnippetCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const snippetCmd = new Command('snippet').description('Manage snippets');

  snippetCmd
    .command('list')
    .description('List snippets in a workspace')
    .addOption(
      withCompletionChoices(
        new Option(
          '--role <role>',
          'Filter by role (owner, contributor, member)'
        ),
        SNIPPET_ROLES
      )
    )
    .option('--limit <number>', 'Maximum number of snippets to list', '25')
    .option('--all', 'List all snippets (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb snippet list',
          'bb snippet list --role owner',
          'bb snippet list --all',
          'bb snippet list --limit 50 --json',
        ],
        validValues: {
          'Valid roles': [...SNIPPET_ROLES],
        },
        defaults: { limit: '25' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListSnippetsCommand,
        options
      );
    });

  snippetCmd
    .command('view <id>')
    .description('View snippet details')
    .option(
      '-f, --file <name>',
      'Print contents of a specific file in the snippet'
    )
    .option('--files', 'Print contents of all files in the snippet')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb snippet view kypj',
          'bb snippet view kypj --json',
          'bb snippet view kypj --file foo.txt',
          'bb snippet view kypj --files',
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ViewSnippetCommand, {
        id,
        ...options,
      });
    });

  snippetCmd
    .command('create')
    .description('Create a new snippet')
    .option('-t, --title <title>', 'Snippet title')
    .option(
      '-f, --file <path...>',
      'File(s) to include (variadic; pass multiple paths or repeat the flag)'
    )
    .option('--private', 'Create a private snippet (default)')
    .option('--public', 'Create a public snippet')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb snippet create -t "My snippet" -f file.txt',
          'bb snippet create -t "Config files" -f config.yml -f setup.sh --public',
        ],
        defaults: { private: 'true (visibility is private unless --public)' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.CreateSnippetCommand,
        options
      );
    });

  snippetCmd
    .command('edit <id>')
    .description('Edit a snippet')
    .option('-t, --title <title>', 'New snippet title')
    .option('--private', 'Make snippet private')
    .option('--public', 'Make snippet public')
    .option(
      '-f, --file <path...>',
      'Replace/add file(s) (variadic; pass multiple paths or repeat the flag; sends multipart update)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb snippet edit kypj -t "New title"',
          'bb snippet edit kypj --public',
          'bb snippet edit kypj -f updated.txt',
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.EditSnippetCommand, {
        id,
        ...options,
      });
    });

  snippetCmd
    .command('delete <id>')
    .description('Delete a snippet')
    .option('-y, --yes', 'Skip confirmation prompt')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb snippet delete kypj', 'bb snippet delete kypj --yes'],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.DeleteSnippetCommand, {
        id,
        ...options,
      });
    });

  snippetCmd
    .command('watch <id>')
    .description('Watch a snippet')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb snippet watch kypj', 'bb snippet watch kypj -w my-team'],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.WatchSnippetCommand, {
        id,
        ...options,
      });
    });

  snippetCmd
    .command('unwatch <id>')
    .description('Stop watching a snippet')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb snippet unwatch kypj',
          'bb snippet unwatch kypj -w my-team',
        ],
      })
    )
    .action(async (id, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.UnwatchSnippetCommand,
        { id, ...options }
      );
    });

  registerSnippetCommentsCommands(snippetCmd, registrar);

  parent.addCommand(snippetCmd);
}
