/**
 * Compile-time contract for the DI tokens and the command registrar.
 * `bun run lint` type-checks this file: every `@ts-expect-error` line must
 * fail to compile and everything else must pass.
 */

import { Container, ServiceTokens } from '../../src/core/container.js';
import type { DependencyTokens } from '../../src/core/container.js';
import type { CommandRegistrar } from '../../src/core/command-registrar.js';
import type { CloneCommand } from '../../src/commands/repo/clone.command.js';

type CloneDeps = DependencyTokens<ConstructorParameters<typeof CloneCommand>>;

export const wired: CloneDeps = [
  ServiceTokens.GitService,
  ServiceTokens.ContextService,
  ServiceTokens.ConfigService,
  ServiceTokens.OutputService,
];

export const swapped: CloneDeps = [
  // @ts-expect-error swapped dependencies
  ServiceTokens.ContextService,
  // @ts-expect-error swapped dependencies
  ServiceTokens.GitService,
  ServiceTokens.ConfigService,
  ServiceTokens.OutputService,
];

// @ts-expect-error missing dependency
export const missing: CloneDeps = [
  ServiceTokens.GitService,
  ServiceTokens.ContextService,
];

const container = new Container();
const configFactory = () => container.resolve(ServiceTokens.ConfigService);
// @ts-expect-error factory returns the wrong service
container.register(ServiceTokens.GitService, configFactory);

export async function dispatch(registrar: CommandRegistrar): Promise<void> {
  await registrar.run(ServiceTokens.SetConfigCommand, { key: 'k', value: 'v' });
  await registrar.run(ServiceTokens.SetConfigCommand, {
    // @ts-expect-error renamed option
    name: 'k',
    value: 'v',
  });

  await registrar.run(ServiceTokens.ListConfigCommand);
  // @ts-expect-error command takes no options
  await registrar.run(ServiceTokens.ListConfigCommand, {});

  // @ts-expect-error not a command token
  await registrar.run(ServiceTokens.ConfigService, {});

  await registrar.runWithGlobalOptions(ServiceTokens.ViewPRCommand, {
    id: '1',
    workspace: 'ws',
  });
  await registrar.runWithGlobalOptions(ServiceTokens.ViewPRCommand, {
    // @ts-expect-error renamed positional
    prId: '1',
  });
}
