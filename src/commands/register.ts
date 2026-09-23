import type { Command } from 'commander';
import type {
  CommandRegistrar,
  RegisterCommands,
} from '../core/command-registrar.js';
import { registerAliasCommands } from './alias/register.js';
import { registerApiCommand } from './api.register.js';
import { registerAuthCommands } from './auth/register.js';
import { registerBrowseCommand } from './browse.register.js';
import { registerCommitCommands } from './commit/register.js';
import { registerCompletionCommands } from './completion/register.js';
import { registerConfigCommands } from './config/register.js';
import { registerPipelineCommands } from './pipeline/register.js';
import { registerPrCommands } from './pr/register.js';
import { registerProjectCommands } from './project/register.js';
import { registerRepoCommands } from './repo/register.js';
import { registerSearchCommands } from './search/register.js';
import { registerSnippetCommands } from './snippet/register.js';
import { registerStatusCommands } from './status/register.js';
import { registerWebhookCommands } from './webhook/register.js';
import { registerWorkspaceCommands } from './workspace/register.js';

// Registration order is the order `bb --help` and shell completion list them.
const TOP_LEVEL_COMMANDS: readonly RegisterCommands[] = [
  registerAuthCommands,
  registerRepoCommands,
  registerPrCommands,
  registerSnippetCommands,
  registerPipelineCommands,
  registerCommitCommands,
  registerStatusCommands,
  registerWorkspaceCommands,
  registerProjectCommands,
  registerSearchCommands,
  registerWebhookCommands,
  registerBrowseCommand,
  registerApiCommand,
  registerAliasCommands,
  registerConfigCommands,
  registerCompletionCommands,
];

export function registerCommands(
  program: Command,
  registrar: CommandRegistrar
): void {
  for (const register of TOP_LEVEL_COMMANDS) {
    register(program, registrar);
  }
}
