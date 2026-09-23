/**
 * Delete GPG key command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type { IOutputService } from '../../core/interfaces/services.js';
import type { GPGApi, UsersApi } from '../../generated/api.js';
import { resolveCurrentUserUuid } from '../../services/account-keys.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';

export interface DeleteGpgKeyOptions {
  fingerprint: string;
  yes?: boolean;
}

export class DeleteGpgKeyCommand extends BaseCommand<
  DeleteGpgKeyOptions,
  void
> {
  public readonly name = 'delete';
  public readonly description = 'Delete a GPG key from your account';

  constructor(
    private readonly gpgApi: GPGApi,
    private readonly usersApi: UsersApi,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: DeleteGpgKeyOptions,
    context: CommandContext
  ): Promise<void> {
    const fingerprint = this.requireOption(options.fingerprint, 'fingerprint');

    await this.requireConfirmation(
      options.yes,
      `This will permanently delete GPG key ${fingerprint} from your account.`,
      context
    );

    const selectedUser = await resolveCurrentUserUuid(this.usersApi);

    await this.gpgApi
      .usersSelectedUserGpgKeysFingerprintDelete({ selectedUser, fingerprint })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `GPG key ${fingerprint} not found on your account.`
        )
      );

    if (context.globalOptions.json) {
      await this.output.json({ success: true, fingerprint });
      return;
    }

    this.output.success(`Deleted GPG key ${fingerprint}`);
  }
}
