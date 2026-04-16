/**
 * Shared workspace resolution for commands that don't need a full repo context
 * (e.g. snippet commands which operate at workspace scope only).
 */

import type { IConfigService } from '../core/interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';

const NO_WORKSPACE_MESSAGE =
  'No workspace specified. Use --workspace option or set a default workspace with `bb config set defaultWorkspace <name>`.';

export async function resolveWorkspace(
  configService: IConfigService,
  explicit?: string
): Promise<string> {
  if (explicit && explicit.length > 0) {
    return explicit;
  }

  const config = await configService.getConfig();
  if (config.defaultWorkspace && config.defaultWorkspace.length > 0) {
    return config.defaultWorkspace;
  }

  throw new BBError({
    code: ErrorCode.CONTEXT_WORKSPACE_NOT_FOUND,
    message: NO_WORKSPACE_MESSAGE,
  });
}
