import { Command } from 'commander';
import { ServiceTokens } from '../../core/container.js';
import type { CommandRegistrar } from '../../core/command-registrar.js';

export function registerAuthCommands(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  const authCmd = new Command('auth').description(
    'Authenticate with Bitbucket'
  );

  authCmd
    .command('login')
    .description('Authenticate with Bitbucket (OAuth or API token)')
    .option(
      '-u, --username <username>',
      'Atlassian account email (implies API token auth)'
    )
    .option(
      '-p, --password <password>',
      'Bitbucket API token (implies API token auth)'
    )
    .option(
      '--app-password',
      'Use API token authentication (instead of OAuth). App passwords are retired; use API tokens.'
    )
    .option(
      '--with-token',
      'Read the API token from stdin (keeps it out of shell history and process args)'
    )
    .option('--client-id <clientId>', 'Custom OAuth consumer client ID')
    .option(
      '--client-secret <clientSecret>',
      'Custom OAuth consumer client secret'
    )
    .addHelpText(
      'before',
      '\nInteractive: choose OAuth or an API token. Without a terminal, use an API\n' +
        'token (BB_API_TOKEN, --with-token, or -u with -p); browser login fails with 1001.\n' +
        'For CI/CD: API token via --app-password or BB_API_TOKEN env var.\n' +
        'For headless/secret-safe: pipe the token in with --with-token.\n' +
        'OAuth needs a loopback browser (http://localhost:19872/callback); there\n' +
        'is no device-code flow, so use token auth on headless hosts.\n' +
        'Note: Bitbucket app passwords are retired; use OAuth or an API token.\n' +
        'Logs in to the current account (`default` unless switched); pass\n' +
        '--account <name> to add or re-authenticate another account. The\n' +
        'account you log in to becomes the active one.\n'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb auth login',
          'bb auth login -u you@example.com --with-token < token.txt',
          'printf \'%s\' "$BB_API_TOKEN" | bb auth login -u you@example.com --with-token',
          'bb auth login --client-id <id> --client-secret <secret>',
          'BB_USERNAME=you@example.com bb auth login --with-token < token.txt',
          'bb auth login --account work',
        ],
        envVars: {
          BB_USERNAME:
            'Atlassian account email used when --username is not provided',
          BB_API_TOKEN:
            'Used when --password is not provided (implies API token auth)',
        },
      })
    )
    .action(async (options) => {
      await registrar.run(ServiceTokens.LoginCommand, options);
    });

  authCmd
    .command('logout')
    .description('Log out of Bitbucket')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb auth logout', 'bb auth logout --json'],
      })
    )
    .action(async () => {
      await registrar.run(ServiceTokens.LogoutCommand);
    });

  authCmd
    .command('status')
    .description('Show authentication status')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb auth status', 'bb auth status --json'],
      })
    )
    .action(async () => {
      await registrar.run(ServiceTokens.StatusCommand);
    });

  authCmd
    .command('token')
    .description('Print the current access token')
    .addHelpText(
      'after',
      buildHelpText({
        examples: ['bb auth token', 'bb auth token | pbcopy'],
      })
    )
    .action(async () => {
      await registrar.run(ServiceTokens.TokenCommand);
    });

  authCmd
    .command('switch [account]')
    .description('Switch the active account')
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb auth switch work',
          'bb auth switch',
          'bb --account personal pr list',
        ],
        envVars: {
          BB_ACCOUNT:
            'Use this account for one invocation without switching (--account wins)',
        },
      })
    )
    .action(async (account: string | undefined) => {
      await registrar.run(ServiceTokens.SwitchCommand, { account });
    });

  parent.addCommand(authCmd);
}
