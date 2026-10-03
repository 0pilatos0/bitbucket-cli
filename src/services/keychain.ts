/**
 * OS keychain access (macOS Keychain, Windows Credential Manager, libsecret)
 * through `Bun.secrets`.
 */

import type { ISecretStorage } from '../core/interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';

const KEYCHAIN_SERVICE = 'bitbucket-cli';
// Storing can fall back to the file; secrets already in the keychain can only
// be reached by fixing access to it.
const STORE_HINT =
  "Run 'bb config set credentialStorage file' to keep credentials in the config file instead.";
const ACCESS_HINT =
  'Make sure the OS keychain is unlocked and reachable, then try again.';

type BunSecrets = typeof Bun.secrets;

export class KeychainSecretStorage implements ISecretStorage {
  // `null` stands for a runtime without the API (Bun.secrets is undefined
  // there).
  constructor(
    private readonly secrets: BunSecrets | null = Bun.secrets ?? null
  ) {}

  public async get(account: string): Promise<string | null> {
    return this.call('read', ACCESS_HINT, (secrets) =>
      secrets.get({ service: KEYCHAIN_SERVICE, name: account })
    );
  }

  public async set(account: string, value: string): Promise<void> {
    await this.call('write', STORE_HINT, (secrets) =>
      secrets.set({ service: KEYCHAIN_SERVICE, name: account, value })
    );
  }

  public async delete(account: string): Promise<void> {
    await this.call('write', ACCESS_HINT, (secrets) =>
      secrets.delete({ service: KEYCHAIN_SERVICE, name: account })
    );
  }

  private async call<T>(
    action: 'read' | 'write',
    hint: string,
    fn: (secrets: BunSecrets) => Promise<T>
  ): Promise<T> {
    const code =
      action === 'read'
        ? ErrorCode.CONFIG_READ_FAILED
        : ErrorCode.CONFIG_WRITE_FAILED;
    // Bun.secrets arrived in Bun 1.2.21; older runtimes have no keychain API.
    if (!this.secrets) {
      throw new BBError({
        code,
        message: `The OS keychain needs Bun 1.2.21 or newer. ${STORE_HINT}`,
      });
    }

    try {
      return await fn(this.secrets);
    } catch (error) {
      const detail = error instanceof Error ? `: ${error.message}` : '';
      throw new BBError({
        code,
        message: `Failed to ${action} the OS keychain${detail}. ${hint}`,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
}
