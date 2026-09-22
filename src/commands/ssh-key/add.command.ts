/**
 * Add SSH key command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type { IOutputService } from '../../core/interfaces/services.js';
import type { SSHApi, UsersApi } from '../../generated/api.js';
import {
  readPublicKey,
  resolveCurrentUserUuid,
} from '../../services/account-keys.js';

export interface AddSshKeyOptions {
  keyFile: string;
  label?: string;
}

export class AddSshKeyCommand extends BaseCommand<AddSshKeyOptions, void> {
  public readonly name = 'add';
  public readonly description = 'Add an SSH public key to your account';

  constructor(
    private readonly sshApi: SSHApi,
    private readonly usersApi: UsersApi,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: AddSshKeyOptions,
    context: CommandContext
  ): Promise<void> {
    const key = await readPublicKey(
      this.requireOption(options.keyFile, 'key-file'),
      () => this.readStdin()
    );
    const selectedUser = await resolveCurrentUserUuid(this.usersApi);

    const response = await this.sshApi.usersSelectedUserSshKeysPost({
      selectedUser,
      body: {
        type: 'ssh_key',
        key,
        ...(options.label ? { label: options.label } : {}),
      },
    });
    const sshKey = response.data;

    if (context.globalOptions.json) {
      await this.output.json({ sshKey });
      return;
    }

    this.output.success(
      `Added SSH key ${sshKey.label || sshKey.fingerprint || sshKey.uuid || ''}`.trimEnd()
    );
    if (sshKey.uuid) {
      this.output.text(`  ${this.output.dim('UUID:')} ${sshKey.uuid}`);
    }
  }

  protected async readStdin(): Promise<string> {
    return Bun.stdin.text();
  }
}
