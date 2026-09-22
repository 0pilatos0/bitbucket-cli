/**
 * Add GPG key command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type { IOutputService } from '../../core/interfaces/services.js';
import type { GPGApi, UsersApi } from '../../generated/api.js';
import {
  readPublicKey,
  resolveCurrentUserUuid,
} from '../../services/account-keys.js';

export interface AddGpgKeyOptions {
  keyFile: string;
}

export class AddGpgKeyCommand extends BaseCommand<AddGpgKeyOptions, void> {
  public readonly name = 'add';
  public readonly description =
    'Add an ASCII-armored GPG public key to your account';

  constructor(
    private readonly gpgApi: GPGApi,
    private readonly usersApi: UsersApi,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: AddGpgKeyOptions,
    context: CommandContext
  ): Promise<void> {
    const key = await readPublicKey(
      this.requireOption(options.keyFile, 'key-file'),
      () => this.readStdin()
    );
    const selectedUser = await resolveCurrentUserUuid(this.usersApi);

    const response = await this.gpgApi.usersSelectedUserGpgKeysPost({
      selectedUser,
      body: { type: 'gpg_key', key },
    });
    const gpgKey = response.data;

    if (context.globalOptions.json) {
      await this.output.json({ gpgKey });
      return;
    }

    this.output.success(
      `Added GPG key ${gpgKey.fingerprint ?? gpgKey.key_id ?? ''}`.trimEnd()
    );
  }

  protected async readStdin(): Promise<string> {
    return Bun.stdin.text();
  }
}
