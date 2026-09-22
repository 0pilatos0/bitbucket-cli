import { Option } from 'commander';
import type { Command } from 'commander';
import { ServiceTokens } from '../core/container.js';
import {
  collectRepeated,
  withCompletionChoices,
} from '../core/command-options.js';
import type { CommandRegistrar } from '../core/command-registrar.js';
import { HTTP_METHODS } from '../services/api-passthrough.js';

export function registerApiCommand(
  parent: Command,
  registrar: CommandRegistrar
): void {
  const { buildHelpText } = registrar;

  parent
    .command('api [methodOrEndpoint] [endpoint]')
    .description(
      'Make an authenticated request to any Bitbucket Cloud 2.0 API endpoint'
    )
    .addOption(
      withCompletionChoices(
        new Option(
          '-X, --method <method>',
          'HTTP method (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS). Defaults to GET, or POST when fields/body are present.'
        ),
        HTTP_METHODS
      )
    )
    .option(
      '-f, --raw-field <key=value>',
      'Add a string parameter — query param on GET/HEAD, JSON body field otherwise (repeatable)',
      collectRepeated,
      [] as string[]
    )
    .option(
      '-F, --field <key=value>',
      'Add a typed parameter: true/false/null and numbers are converted; @file reads a file and @- reads stdin (repeatable)',
      collectRepeated,
      [] as string[]
    )
    .option(
      '--input <file>',
      'Read the request body from a file, or - for stdin (sent as application/json; mutually exclusive with -f/-F)'
    )
    .option(
      '-H, --header <key:value>',
      'Add a request header (repeatable). Authorization is managed automatically and cannot be set here.',
      collectRepeated,
      [] as string[]
    )
    .option(
      '-i, --include',
      'Print the HTTP status line and response headers before the body, on success and failure (text mode only)'
    )
    .option(
      '--paginate',
      'Follow the cursor (next) and merge every page into a single {"values": [...]} result (GET/HEAD only)'
    )
    .addHelpText(
      'before',
      '\nEscape hatch for endpoints not yet wrapped by a typed command.\n' +
        'The path is relative to https://api.bitbucket.org/2.0; {workspace} and\n' +
        '{repo} placeholders are filled from --workspace/--repo or the current repo.\n'
    )
    .addHelpText(
      'after',
      buildHelpText({
        examples: [
          'bb api /user',
          'bb api GET /user',
          'bb api /repositories/{workspace}/{repo}/pullrequests --paginate',
          'bb api POST /repositories/my-ws/my-repo/pipelines/ -f target.commit=abc1234',
          'bb api PUT /repositories/my-ws/my-repo/pullrequests/42 --input body.json',
          'cat body.json | bb api POST /repositories/my-ws/my-repo/pullrequests/42/comments --input -',
          "bb api /repositories/my-ws --jq '.values[].name'",
          'bb api -i /user',
        ],
        validValues: {
          'Valid methods': [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'HEAD',
            'OPTIONS',
          ],
        },
        seeAlso: [
          {
            label: 'Scripting & Automation',
            url: 'https://bitbucket-cli.paulvanderlei.com/guides/scripting/',
          },
          {
            label: 'Bitbucket REST API',
            url: 'https://developer.atlassian.com/cloud/bitbucket/rest/intro/',
          },
        ],
      })
    )
    .action(async (methodOrEndpoint, endpoint, options) => {
      // `bb api` output is already JSON, so `--jq` works without `--json`.
      await registrar.runWithGlobalOptions(
        ServiceTokens.ApiCommand,
        { methodOrEndpoint, endpoint, ...options },
        { allowJqWithoutJson: true }
      );
    });
}
