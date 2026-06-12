/**
 * Tests for the shared `BaseCommand.runList()` paginated list helper.
 *
 * Covers the common tail of all list-style commands: limit resolution,
 * page collection, the JSON envelope shape (metadata-first key order,
 * `count`, wrapper array key), empty-state messaging, table rendering,
 * the more-results hint, and the WRAPPER_ARRAY_KEYS drift guard.
 */

import { describe, it, expect } from 'bun:test';
import { BaseCommand, type RunListSpec } from '../../src/core/base-command.js';
import type { CommandContext } from '../../src/core/interfaces/commands.js';
import { BBError, ErrorCode } from '../../src/types/errors.js';
import { createMockOutputService } from '../setup.js';

interface Item {
  id: number;
  name: string;
}

class ListHarnessCommand extends BaseCommand<Record<string, unknown>, void> {
  public readonly name = 'list-harness';
  public readonly description = 'Test harness for runList';

  async execute(): Promise<void> {
    // Not used; tests drive callRunList directly.
  }

  public async callRunList(
    spec: RunListSpec<Item>,
    context: CommandContext
  ): Promise<void> {
    return this.runList(spec, context);
  }
}

function makeContext(json = false): CommandContext {
  return { globalOptions: json ? { json: true } : {} } as CommandContext;
}

function makeHarness() {
  const output = createMockOutputService();
  const command = new ListHarnessCommand(output);
  return { output, command };
}

/** A single-page fetcher returning the given items with no `next` link. */
function singlePage(items: Item[]) {
  return async () => ({ values: items, next: undefined });
}

const ITEMS: Item[] = [
  { id: 1, name: 'alpha' },
  { id: 2, name: 'beta' },
];

function baseSpec(
  overrides: Partial<RunListSpec<Item>> = {}
): RunListSpec<Item> {
  return {
    options: {},
    fetchPage: singlePage(ITEMS),
    wrapperKey: 'values',
    emptyMessage: 'No items found',
    tableHeaders: ['ID', 'NAME'],
    mapRow: (item) => [String(item.id), item.name],
    noun: 'items',
    ...overrides,
  };
}

describe('BaseCommand.runList', () => {
  describe('JSON mode', () => {
    it('emits the envelope with metadata keys first, then count, then the wrapper array', async () => {
      const { output, command } = makeHarness();

      await command.callRunList(
        baseSpec({
          jsonMetadata: { workspace: 'acme', repoSlug: 'site' },
        }),
        makeContext(true)
      );

      const jsonLog = output.logs.find((log) => log.startsWith('json:'));
      expect(jsonLog).toBeDefined();
      const payload = JSON.parse(jsonLog!.slice('json:'.length));
      expect(payload).toEqual({
        workspace: 'acme',
        repoSlug: 'site',
        count: 2,
        values: ITEMS,
      });
      // Key order is part of the observable API surface (metadata-first).
      expect(Object.keys(payload)).toEqual([
        'workspace',
        'repoSlug',
        'count',
        'values',
      ]);
    });

    it('emits the full envelope with count: 0 when there are no items', async () => {
      const { output, command } = makeHarness();

      await command.callRunList(
        baseSpec({
          fetchPage: singlePage([]),
          jsonMetadata: { workspace: 'acme' },
        }),
        makeContext(true)
      );

      const jsonLog = output.logs.find((log) => log.startsWith('json:'));
      expect(jsonLog).toBeDefined();
      expect(JSON.parse(jsonLog!.slice('json:'.length))).toEqual({
        workspace: 'acme',
        count: 0,
        values: [],
      });
      // JSON mode never prints the table-mode empty-state message.
      expect(output.logs.some((log) => log.startsWith('info:'))).toBe(false);
    });

    it('omits metadata when jsonMetadata is not provided', async () => {
      const { output, command } = makeHarness();

      await command.callRunList(baseSpec(), makeContext(true));

      const jsonLog = output.logs.find((log) => log.startsWith('json:'));
      expect(JSON.parse(jsonLog!.slice('json:'.length))).toEqual({
        count: 2,
        values: ITEMS,
      });
    });
  });

  describe('table mode', () => {
    it('renders headers and mapped rows', async () => {
      const { output, command } = makeHarness();

      await command.callRunList(baseSpec(), makeContext());

      expect(output.logs).toContain('table:ID,NAME');
      expect(output.logs).toContain(
        `table-rows:${JSON.stringify([
          ['1', 'alpha'],
          ['2', 'beta'],
        ])}`
      );
      expect(output.logs.some((log) => log.startsWith('json:'))).toBe(false);
    });

    it('prints a string empty-state message and no table when there are no items', async () => {
      const { output, command } = makeHarness();

      await command.callRunList(
        baseSpec({ fetchPage: singlePage([]) }),
        makeContext()
      );

      expect(output.logs).toContain('info:No items found');
      expect(output.logs.some((log) => log.startsWith('table:'))).toBe(false);
      expect(output.logs.some((log) => log.startsWith('text:'))).toBe(false);
    });

    it('evaluates a function empty-state message lazily', async () => {
      const { output, command } = makeHarness();
      let evaluated = false;

      await command.callRunList(
        baseSpec({
          fetchPage: singlePage([]),
          emptyMessage: () => {
            evaluated = true;
            return 'No items matched the filter';
          },
        }),
        makeContext()
      );

      expect(evaluated).toBe(true);
      expect(output.logs).toContain('info:No items matched the filter');
    });

    it('does not evaluate the empty-state message when items exist', async () => {
      const { command } = makeHarness();
      let evaluated = false;

      await command.callRunList(
        baseSpec({
          emptyMessage: () => {
            evaluated = true;
            return 'unused';
          },
        }),
        makeContext()
      );

      expect(evaluated).toBe(false);
    });

    it('prints the more-results hint when the limit truncates the listing', async () => {
      const { output, command } = makeHarness();

      await command.callRunList(
        baseSpec({ options: { limit: '1' } }),
        makeContext()
      );

      expect(output.logs).toContain(
        'text:Showing 1 items. Use --limit <n> or --all to see more.'
      );
    });

    it('omits the more-results hint when everything was shown', async () => {
      const { output, command } = makeHarness();

      await command.callRunList(baseSpec(), makeContext());

      expect(output.logs.some((log) => log.includes('Use --limit'))).toBe(
        false
      );
    });
  });

  describe('pagination and filtering', () => {
    it('applies shouldInclude to filter fetched items', async () => {
      const { output, command } = makeHarness();

      await command.callRunList(
        baseSpec({ shouldInclude: (item) => item.id !== 1 }),
        makeContext(true)
      );

      const jsonLog = output.logs.find((log) => log.startsWith('json:'));
      expect(JSON.parse(jsonLog!.slice('json:'.length))).toEqual({
        count: 1,
        values: [{ id: 2, name: 'beta' }],
      });
    });

    it('fetches every page when --all is set', async () => {
      const { output, command } = makeHarness();
      const pages: Item[][] = [
        [{ id: 1, name: 'alpha' }],
        [{ id: 2, name: 'beta' }],
      ];
      const requestedPages: number[] = [];

      await command.callRunList(
        baseSpec({
          options: { all: true },
          fetchPage: async (page) => {
            requestedPages.push(page);
            return {
              values: pages[page - 1] ?? [],
              next: page < pages.length ? 'next-url' : undefined,
            };
          },
        }),
        makeContext(true)
      );

      expect(requestedPages).toEqual([1, 2]);
      const jsonLog = output.logs.find((log) => log.startsWith('json:'));
      expect(JSON.parse(jsonLog!.slice('json:'.length)).count).toBe(2);
    });

    it('rejects an invalid --limit with a BBError before fetching', async () => {
      const { command } = makeHarness();
      let fetched = false;

      const promise = command.callRunList(
        baseSpec({
          options: { limit: 'abc' },
          fetchPage: async () => {
            fetched = true;
            return { values: [] };
          },
        }),
        makeContext()
      );

      await expect(promise).rejects.toBeInstanceOf(BBError);
      await promise.catch((error: BBError) => {
        expect(error.code).toBe(ErrorCode.VALIDATION_INVALID);
      });
      expect(fetched).toBe(false);
    });
  });

  describe('wrapperKey drift guard', () => {
    it('throws when wrapperKey is not registered in WRAPPER_ARRAY_KEYS', async () => {
      const { command } = makeHarness();

      await expect(
        command.callRunList(
          baseSpec({ wrapperKey: 'unregisteredKey' }),
          makeContext()
        )
      ).rejects.toThrow(/WRAPPER_ARRAY_KEYS/);
    });

    it('accepts every wrapper key used by the refactored list commands', async () => {
      // The six commands using runList and their JSON wrapper keys.
      const usedKeys = [
        'pullRequests', // pr list
        'repositories', // repo list
        'snippets', // snippet list
        'activities', // pr activity
        'comments', // pr comments list, snippet comments list
      ];

      for (const wrapperKey of usedKeys) {
        const { command } = makeHarness();
        await expect(
          command.callRunList(baseSpec({ wrapperKey }), makeContext())
        ).resolves.toBeUndefined();
      }
    });
  });
});
