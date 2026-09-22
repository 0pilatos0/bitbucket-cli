/**
 * List GPG keys command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type { IOutputService } from '../../core/interfaces/services.js';
import type { GPGAccountKey, GPGApi, UsersApi } from '../../generated/api.js';
import { resolveCurrentUserUuid } from '../../services/account-keys.js';
import { resolveLimit } from '../../services/pagination.js';

export interface ListGpgKeysOptions {
  limit?: string;
  all?: boolean;
}

export class ListGpgKeysCommand extends BaseCommand<ListGpgKeysOptions, void> {
  public readonly name = 'list';
  public readonly description = 'List GPG keys on your account';

  constructor(
    private readonly gpgApi: GPGApi,
    private readonly usersApi: UsersApi,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListGpgKeysOptions,
    context: CommandContext
  ): Promise<void> {
    resolveLimit(options);
    const selectedUser = await resolveCurrentUserUuid(this.usersApi);

    await this.runList<GPGAccountKey>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response = await this.gpgApi.usersSelectedUserGpgKeysGet(
            { selectedUser },
            { params: { page, pagelen } }
          );
          return response.data;
        },
        wrapperKey: 'gpgKeys',
        emptyMessage: 'No GPG keys found on your account',
        tableHeaders: ['FINGERPRINT', 'KEY ID', 'NAME', 'ADDED', 'EXPIRES'],
        mapRow: (key) => [
          key.fingerprint ?? '-',
          key.key_id ?? '-',
          this.truncateText(key.name || '-', 30, context.globalOptions),
          key.added_on ? this.output.formatDate(key.added_on) : '-',
          key.expires_on ? this.output.formatDate(key.expires_on) : 'never',
        ],
        noun: 'GPG keys',
      },
      context
    );
  }
}
