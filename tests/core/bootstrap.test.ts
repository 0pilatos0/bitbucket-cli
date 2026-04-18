/**
 * Bootstrap/DI integration tests
 *
 * The CLI does not exercise bootstrap() end-to-end at test time — a missed
 * registration or a wrong constructor argument would only surface at
 * runtime when a user invokes that command. These tests resolve every
 * registered token and verify each command can be instantiated, so a
 * broken wiring fails in CI instead of production.
 */

import { describe, it, expect } from 'bun:test';
import { bootstrap } from '../../src/bootstrap.js';
import { Container, ServiceTokens } from '../../src/core/container.js';
import { BaseCommand } from '../../src/core/base-command.js';
import { OutputService } from '../../src/services/output.service.js';
import { ViewRepoCommand } from '../../src/commands/repo/view.command.js';
import { CreatePRCommand } from '../../src/commands/pr/create.command.js';

describe('bootstrap()', () => {
  it('returns a Container with every registered service token wired up', () => {
    const container = bootstrap();

    for (const token of Object.values(ServiceTokens)) {
      expect(container.has(token)).toBe(true);
    }
  });

  it('resolves each registered ServiceToken without throwing', () => {
    const container = bootstrap();

    for (const token of Object.values(ServiceTokens)) {
      expect(() => container.resolve(token)).not.toThrow();
    }
  });

  it('returns a BaseCommand instance for every command token', () => {
    const container = bootstrap();

    const commandTokens = Object.entries(ServiceTokens)
      .filter(([key]) => key.endsWith('Command'))
      .map(([, token]) => token);

    // Sanity — we should have a meaningful number of commands.
    expect(commandTokens.length).toBeGreaterThanOrEqual(40);

    for (const token of commandTokens) {
      const resolved = container.resolve(token);
      expect(resolved).toBeInstanceOf(BaseCommand);
    }
  });

  it('returns the same instance for singleton services (default behavior)', () => {
    const container = bootstrap();

    const configA = container.resolve(ServiceTokens.ConfigService);
    const configB = container.resolve(ServiceTokens.ConfigService);
    expect(configA).toBe(configB);

    const outputA = container.resolve(ServiceTokens.OutputService);
    const outputB = container.resolve(ServiceTokens.OutputService);
    expect(outputA).toBe(outputB);
  });

  it('propagates noColor option to the OutputService', () => {
    Container.reset();
    const container = bootstrap({ noColor: true });

    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );

    // With noColor, color helpers should pass through.
    expect(output.red('x')).toBe('x');
    expect(output.green('y')).toBe('y');
    expect(output.bold('z')).toBe('z');
  });

  it('defaults to colorized output when noColor is unset', () => {
    Container.reset();
    const container = bootstrap({});
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );

    // Without noColor the format() helper uses the provided formatter.
    expect(output.format('ping', (t) => `<${t}>`)).toBe('<ping>');
  });

  it('re-registers the same container singleton across calls', () => {
    Container.reset();
    const first = bootstrap();
    const second = bootstrap();
    // Container is itself a singleton, so both returns are the same object.
    expect(first).toBe(second);
  });

  it('resolves a command end-to-end with its dependencies wired in constructor order', () => {
    Container.reset();
    const container = bootstrap();

    // A simple 3-dep command: RepositoriesApi, ContextService, OutputService
    const viewRepo = container.resolve<ViewRepoCommand>(
      ServiceTokens.ViewRepoCommand
    );
    expect(viewRepo).toBeInstanceOf(ViewRepoCommand);
    expect(viewRepo.name).toBe('view');

    // A dense 7-dep command exercises the deps-array path more thoroughly.
    const createPR = container.resolve<CreatePRCommand>(
      ServiceTokens.CreatePRCommand
    );
    expect(createPR).toBeInstanceOf(CreatePRCommand);
    expect(createPR.name).toBe('create');

    // Both commands share the same OutputService singleton, proving the
    // helpers resolve from the same container rather than re-instantiating.
    const output = container.resolve(ServiceTokens.OutputService);
    expect((viewRepo as unknown as { output: unknown }).output).toBe(output);
    expect((createPR as unknown as { output: unknown }).output).toBe(output);
  });

  it('every command exposes the required public shape (name, description, run)', () => {
    const container = bootstrap();
    const commandTokens = Object.entries(ServiceTokens)
      .filter(([key]) => key.endsWith('Command'))
      .map(([, token]) => token);

    for (const token of commandTokens) {
      const command = container.resolve<BaseCommand<unknown, unknown>>(token);
      expect(typeof command.name).toBe('string');
      expect(command.name.length).toBeGreaterThan(0);
      expect(typeof command.description).toBe('string');
      expect(typeof (command as unknown as { run?: unknown }).run).toBe(
        'function'
      );
      expect(typeof (command as unknown as { execute?: unknown }).execute).toBe(
        'function'
      );
    }
  });
});
