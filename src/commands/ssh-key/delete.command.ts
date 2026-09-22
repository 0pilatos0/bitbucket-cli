/**
 * Delete SSH key command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type { IOutputService } from '../../core/interfaces/services.js';
import type { SSHApi, UsersApi } from '../../generated/api.js';
import { resolveCurrentUserUuid } from '../../services/account-keys.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface DeleteSshKeyOptions {
  keyId: string;
  yes?: boolean;
}

export class DeleteSshKeyCommand extends BaseCommand<
  DeleteSshKeyOptions,
  void
> {
  public readonly name = 'delete';
  public readonly description = 'Delete an SSH key from your account';

  constructor(
    private readonly sshApi: SSHApi,
    private readonly usersApi: UsersApi,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: DeleteSshKeyOptions,
    context: CommandContext
  ): Promise<void> {
    const keyId = this.requireOption(options.keyId, 'key-id');

    this.requireConfirmation(
      options.yes,
      `This will permanently delete SSH key ${keyId} from your account.`
    );

    const selectedUser = await resolveCurrentUserUuid(this.usersApi);

    await this.sshApi
      .usersSelectedUserSshKeysKeyIdDelete({ selectedUser, keyId })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `SSH key ${keyId} not found on your account.`
        )
      );

    if (context.globalOptions.json) {
      await this.output.json({ success: true, keyId });
      return;
    }

    this.output.success(`Deleted SSH key ${keyId}`);
  }
}
