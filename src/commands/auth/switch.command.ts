/**
 * Switch command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  ICredentialStore,
  IOutputService,
} from '../../core/interfaces/services.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface SwitchOptions {
  account?: string;
}

export class SwitchCommand extends BaseCommand<SwitchOptions, void> {
  public readonly name = 'switch';
  public readonly description = 'Switch the active account';

  constructor(
    private readonly credentialStore: ICredentialStore,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: SwitchOptions,
    context: CommandContext
  ): Promise<void> {
    const accounts = await this.credentialStore.listAccounts();
    if (accounts.length === 0) {
      throw new BBError({
        code: ErrorCode.AUTH_REQUIRED,
        message: "No saved accounts. Run 'bb auth login' first.",
      });
    }

    const account =
      options.account ??
      (await context.prompt?.select(
        'Which account should be active?',
        accounts.map((summary) => ({
          value: summary.name,
          label: summary.active ? `${summary.name} (active)` : summary.name,
        }))
      ));

    if (!account) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: `Account name is required. Saved accounts: ${accounts.map((summary) => summary.name).join(', ')}.`,
      });
    }

    await this.credentialStore.switchAccount(account);

    if (context.globalOptions.json) {
      await this.output.json({ success: true, account });
      return;
    }

    this.output.success(`Switched to account ${account}`);
  }
}
