import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';
import { registerRepoDefaultReviewersCommands } from './default-reviewers.register.js';
import { registerRepoDownloadsCommands } from './downloads.register.js';

export function registerRepoCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const repoCmd = new Command('repo').description('Manage repositories');

  repoCmd
    .command('clone <repository>')
    .description('Clone a Bitbucket repository')
    .option('-d, --directory <dir>', 'Directory to clone into')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb repo clone workspace/repo-name',
          'bb repo clone workspace/repo-name -d my-directory',
        ],
      })
    )
    .action(async (repository, options) => {
      await registrar.run(ServiceTokens.CloneCommand, {
        repository,
        ...options,
      });
    });

  repoCmd
    .command('create <name>')
    .description('Create a new repository')
    .option('-d, --description <description>', 'Repository description')
    .option('--private', 'Create a private repository (default)')
    .option('--public', 'Create a public repository')
    .option('-p, --project <project>', 'Project key')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb repo create my-repo',
          'bb repo create my-repo --public -p PROJ',
          'bb repo create my-repo -d "My new repository"',
        ],
        defaults: { private: 'true (visibility is private unless --public)' },
      })
    )
    .action(async (name, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.CreateRepoCommand, {
        name,
        ...options,
      });
    });

  repoCmd
    .command('list')
    .description('List repositories')
    .option('--limit <number>', 'Maximum number of repositories to list', '25')
    .option('--all', 'List all repositories (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb repo list',
          'bb repo list --limit 50',
          'bb repo list --all',
          'bb repo list --json',
        ],
        defaults: { limit: '25' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListReposCommand,
        options
      );
    });

  repoCmd
    .command('view [repository]')
    .description('View repository details')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb repo view',
          'bb repo view workspace/repo-name',
          'bb repo view workspace/repo-name --json',
        ],
      })
    )
    .action(async (repository, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ViewRepoCommand, {
        repository,
        ...options,
      });
    });

  repoCmd
    .command('delete <repository>')
    .description('Delete a repository')
    .option('-y, --yes', 'Skip confirmation prompt')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb repo delete workspace/repo-name',
          'bb repo delete workspace/repo-name --yes',
        ],
      })
    )
    .action(async (repository, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.DeleteRepoCommand, {
        repository,
        ...options,
      });
    });

  repoCmd
    .command('cat <path>')
    .description('Print the contents of a repository file without cloning')
    .option(
      '--ref <ref>',
      'Branch, tag, or commit to read from (default: the repository main branch)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb repo cat README.md',
          'bb repo cat src/index.ts --ref develop',
          'bb repo cat package.json | jq .version',
          'bb repo cat logo.png --ref v1.0.0 > logo.png',
        ],
        defaults: { ref: 'the repository main branch' },
      })
    )
    .action(async (path, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.CatRepoFileCommand, {
        path,
        ...options,
      });
    });

  repoCmd
    .command('ls [path]')
    .description(
      'List a repository directory without cloning (default: the repository root)'
    )
    .option(
      '--ref <ref>',
      'Branch, tag, or commit to list (default: the repository main branch)'
    )
    .option('--limit <number>', 'Maximum number of entries to list', '25')
    .option('--all', 'List all entries (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb repo ls',
          'bb repo ls src --ref develop',
          'bb repo ls docs --all',
          "bb repo ls --json --jq '.entries[].path'",
        ],
        defaults: { ref: 'the repository main branch', limit: '25' },
      })
    )
    .action(async (path, options) => {
      await registrar.runWithGlobalOptions(ServiceTokens.ListRepoFilesCommand, {
        path,
        ...options,
      });
    });

  registerRepoDefaultReviewersCommands(repoCmd, registrar);
  registerRepoDownloadsCommands(repoCmd, registrar);

  parent.addCommand(repoCmd);
}
