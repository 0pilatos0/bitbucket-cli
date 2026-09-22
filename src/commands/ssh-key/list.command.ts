/**
 * List SSH keys command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type { IOutputService } from '../../core/interfaces/services.js';
import type { SSHApi, SshAccountKey, UsersApi } from '../../generated/api.js';
import { resolveCurrentUserUuid } from '../../services/account-keys.js';
import { resolveLimit } from '../../services/pagination.js';

export interface ListSshKeysOptions {
  limit?: string;
  all?: boolean;
}

export class ListSshKeysCommand extends BaseCommand<ListSshKeysOptions, void> {
  public readonly name = 'list';
  public readonly description = 'List SSH keys on your account';

  constructor(
    private readonly sshApi: SSHApi,
    private readonly usersApi: UsersApi,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ListSshKeysOptions,
    context: CommandContext
  ): Promise<void> {
    resolveLimit(options);
    const selectedUser = await resolveCurrentUserUuid(this.usersApi);

    await this.runList<SshAccountKey>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response = await this.sshApi.usersSelectedUserSshKeysGet(
            { selectedUser },
            { params: { page, pagelen } }
          );
          return response.data;
        },
        wrapperKey: 'sshKeys',
        emptyMessage: 'No SSH keys found on your account',
        tableHeaders: ['UUID', 'LABEL', 'FINGERPRINT', 'CREATED', 'LAST USED'],
        mapRow: (key) => [
          key.uuid ?? '-',
          this.truncateText(key.label || '-', 30, context.globalOptions),
          key.fingerprint ?? '-',
          key.created_on ? this.output.formatDate(key.created_on) : '-',
          key.last_used ? this.output.formatDate(key.last_used) : 'never',
        ],
        noun: 'SSH keys',
      },
      context
    );
  }
}
