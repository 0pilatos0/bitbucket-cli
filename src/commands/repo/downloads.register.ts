import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerRepoDownloadsCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const repoDownloadsCmd = new Command('downloads').description(
    'Manage download artifacts of a repository'
  );

  repoDownloadsCmd
    .command('list')
    .description('List download artifacts of a repository')
    .option('--limit <number>', 'Maximum number of downloads to list', '25')
    .option('--all', 'List all downloads (overrides --limit)')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb repo downloads list',
          'bb repo downloads list --all',
          "bb repo downloads list --json --jq '.downloads[].name'",
        ],
        defaults: { limit: '25' },
      })
    )
    .action(async (options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.ListDownloadsCommand,
        options
      );
    });

  repoDownloadsCmd
    .command('upload <files...>')
    .description(
      'Upload files as download artifacts (replaces artifacts with the same name)'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb repo downloads upload dist/app-1.0.0.tar.gz',
          'bb repo downloads upload build/*.zip',
        ],
      })
    )
    .action(async (files, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.UploadDownloadCommand,
        { files, ...options }
      );
    });

  repoDownloadsCmd
    .command('delete <filename>')
    .description('Delete a download artifact from a repository')
    .option('-y, --yes', 'Skip confirmation prompt')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb repo downloads delete app-1.0.0.tar.gz --yes'],
      })
    )
    .action(async (filename, options) => {
      await registrar.runWithGlobalOptions(
        ServiceTokens.DeleteDownloadCommand,
        { filename, ...options }
      );
    });

  parent.addCommand(repoDownloadsCmd);
}
