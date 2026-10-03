/**
 * OutputService tests
 */

import { chmod, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import chalk from 'chalk';
import {
  OutputService,
  fitColumnWidths,
  needsWindowsJqBunUpgrade,
  truncateToWidth,
} from '../../src/services/output.service.js';

type Terminal = { isTTY: boolean; columns?: number };

describe('truncateToWidth', () => {
  it('returns text that already fits unchanged', () => {
    expect(truncateToWidth('hello', 5)).toBe('hello');
  });

  it('cuts by visible width and appends an ellipsis', () => {
    expect(truncateToWidth('hello world', 8)).toBe('hello...');
  });

  it('counts wide characters as two columns', () => {
    const cut = truncateToWidth('漢字漢字漢字', 7);
    expect(cut).toBe('漢字...');
    expect(Bun.stringWidth(cut)).toBeLessThanOrEqual(7);
  });

  it('ignores color codes when measuring and drops them when cutting', () => {
    expect(truncateToWidth('\x1b[32mok\x1b[39m', 2)).toBe('\x1b[32mok\x1b[39m');
    expect(truncateToWidth('\x1b[32mpassing\x1b[39m', 6)).toBe('pas...');
  });

  it('skips the ellipsis when the column is too narrow for it', () => {
    expect(truncateToWidth('abcdef', 3)).toBe('abc');
  });
});

describe('fitColumnWidths', () => {
  it('keeps natural widths when the row fits or the width is unknown', () => {
    expect(fitColumnWidths([5, 10], [0, 1], 80)).toEqual([5, 10]);
    expect(fitColumnWidths([50, 100], [0, 1], undefined)).toEqual([50, 100]);
  });

  it('shrinks the widest flexible column first', () => {
    // 4 + 2 + 60 + 2 + 20 = 88 > 60: the title gives up 28 columns while the
    // shorter flexible column keeps its width.
    expect(fitColumnWidths([4, 60, 20], [1, 2], 60)).toEqual([4, 32, 20]);
  });

  it('shares the space between flexible columns that are both too wide', () => {
    expect(fitColumnWidths([4, 60, 60], [1, 2], 50)).toEqual([4, 21, 21]);
  });

  it('never shrinks fixed columns', () => {
    expect(fitColumnWidths([38, 60], [1], 60)).toEqual([38, 20]);
  });

  it('stops at a minimum width and lets the row overflow', () => {
    expect(fitColumnWidths([38, 60], [1], 40)).toEqual([38, 10]);
  });
});

describe('Windows jq runtime requirement', () => {
  it('requires an upgrade before Bun 1.4.2 on Windows', () => {
    expect(needsWindowsJqBunUpgrade('win32', '1.3.14')).toBe(true);
    expect(needsWindowsJqBunUpgrade('win32', '1.4.0')).toBe(true);
    expect(needsWindowsJqBunUpgrade('win32', '1.4.1')).toBe(true);
    expect(needsWindowsJqBunUpgrade('win32', '1.4.2')).toBe(false);
    expect(needsWindowsJqBunUpgrade('win32', '1.4.2+build')).toBe(false);
    expect(needsWindowsJqBunUpgrade('win32', '2.0.0')).toBe(false);
  });

  it('does not restrict other platforms or unknown versions', () => {
    expect(needsWindowsJqBunUpgrade('darwin', '1.3.14')).toBe(false);
    expect(needsWindowsJqBunUpgrade('linux', '1.3.14')).toBe(false);
    expect(needsWindowsJqBunUpgrade('win32', 'unknown')).toBe(false);
  });
});

describe('OutputService', () => {
  let output: OutputService;
  let terminal: Terminal;
  let stdoutLines: string[];
  let stderrLines: string[];
  let stdoutSpy: ReturnType<typeof spyOn>;
  let stderrSpy: ReturnType<typeof spyOn>;

  const captureLines =
    (lines: string[]) =>
    (chunk: unknown): boolean => {
      lines.push(String(chunk).replace(/\n$/, ''));
      return true;
    };

  beforeEach(() => {
    stdoutLines = [];
    stderrLines = [];
    stdoutSpy = spyOn(process.stdout, 'write').mockImplementation(
      captureLines(stdoutLines)
    );
    stderrSpy = spyOn(process.stderr, 'write').mockImplementation(
      captureLines(stderrLines)
    );

    // Table tests describe the terminal layout unless they opt out.
    terminal = { isTTY: true };
    output = new OutputService({ terminal });
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  describe('json', () => {
    const setStdoutTTY = (value: boolean): void => {
      terminal.isTTY = value;
    };

    beforeEach(() => {
      setStdoutTTY(false);
    });

    it('pretty-prints JSON when stdout is a terminal', async () => {
      setStdoutTTY(true);
      await output.json({ name: 'test', value: 42 });

      expect(stdoutLines).toEqual(['{\n  "name": "test",\n  "value": 42\n}']);
    });

    it('prints compact JSON when stdout is piped', async () => {
      setStdoutTTY(false);
      await output.json({ name: 'test', nested: { value: 42 } });

      expect(stdoutLines).toEqual(['{"name":"test","nested":{"value":42}}']);
    });

    it('prints compact --jq results when stdout is piped', async () => {
      setStdoutTTY(false);
      output.setJsonFormatOptions({ jq: '.items[]' });
      await output.json({ items: [{ id: 1 }, { id: 2 }] });

      expect(stdoutLines).toEqual(['{"id":1}\n{"id":2}']);
    });

    it('pretty-prints --jq results when stdout is a terminal', async () => {
      setStdoutTTY(true);
      output.setJsonFormatOptions({ jq: '.items[0]' });
      await output.json({ items: [{ id: 1 }] });

      expect(stdoutLines).toEqual(['{\n  "id": 1\n}']);
    });

    it('should handle arrays', async () => {
      await output.json([1, 2, 3]);

      expect(stdoutLines[0]).toContain('1');
      expect(stdoutLines[0]).toContain('2');
      expect(stdoutLines[0]).toContain('3');
    });

    it('should handle null and undefined', async () => {
      await output.json(null);
      expect(stdoutLines[0]).toBe('null');
    });
  });

  describe('json with --json fields projection', () => {
    it('projects fields on a single object', async () => {
      output.setJsonFormatOptions({ fields: ['id', 'title'] });
      await output.json({ id: 1, title: 'hello', state: 'OPEN' });

      const parsed = JSON.parse(stdoutLines[0]!);
      expect(parsed).toEqual({ id: 1, title: 'hello' });
    });

    it('projects per-item on a top-level array', async () => {
      output.setJsonFormatOptions({ fields: ['id'] });
      await output.json([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ]);

      const parsed = JSON.parse(stdoutLines[0]!);
      expect(parsed).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('drops the wrapper and projects per-item on a known wrapper key', async () => {
      output.setJsonFormatOptions({ fields: ['id', 'title'] });
      await output.json({
        workspace: 'ws',
        count: 2,
        pullRequests: [
          { id: 1, title: 'first', state: 'OPEN' },
          { id: 2, title: 'second', state: 'OPEN' },
        ],
      });

      const parsed = JSON.parse(stdoutLines[0]!);
      expect(parsed).toEqual([
        { id: 1, title: 'first' },
        { id: 2, title: 'second' },
      ]);
    });

    it('supports dotted-path field selectors', async () => {
      output.setJsonFormatOptions({ fields: ['id', 'author.display_name'] });
      await output.json([
        { id: 1, author: { display_name: 'alice' } },
        { id: 2, author: { display_name: 'bob' } },
      ]);

      const parsed = JSON.parse(stdoutLines[0]!);
      expect(parsed).toEqual([
        { id: 1, 'author.display_name': 'alice' },
        { id: 2, 'author.display_name': 'bob' },
      ]);
    });

    it('falls back to projecting the wrapper itself when no items array matches', async () => {
      output.setJsonFormatOptions({ fields: ['workspace', 'count'] });
      await output.json({
        workspace: 'ws',
        count: 0,
        unrelated: { foo: 'bar' },
      });

      const parsed = JSON.parse(stdoutLines[0]!);
      expect(parsed).toEqual({ workspace: 'ws', count: 0 });
    });

    // Lock in wrapper-key parity with the actual JSON shapes produced by
    // commands in src/commands/**. If a command renames its wrapper key,
    // this test fails — and either the command or WRAPPER_ARRAY_KEYS needs
    // to be updated together.
    it.each([
      ['pullRequests', 'pr list'],
      ['repositories', 'repo list'],
      ['snippets', 'snippet list'],
      ['comments', 'pr/snippet comments list'],
      ['reviewers', 'pr reviewers list, repo default-reviewers list'],
      ['activities', 'pr activity'],
      ['statuses', 'pr checks'],
      ['files', 'pr diff --stat / --name-only'],
      ['pipelines', 'pipeline list'],
      ['commits', 'commit list'],
      ['workspaces', 'workspace list'],
      ['projects', 'project list'],
      ['entries', 'repo ls'],
      ['downloads', 'repo downloads list'],
      ['results', 'search code'],
      ['webhooks', 'webhook list'],
      ['values', 'generic paginated payloads'],
    ])('drops the wrapper for the %s key (used by %s)', async (key) => {
      output.setJsonFormatOptions({ fields: ['id'] });
      await output.json({
        workspace: 'ws',
        count: 1,
        [key]: [{ id: 99, other: 'x' }],
      });

      const parsed = JSON.parse(stdoutLines[0]!);
      expect(parsed).toEqual([{ id: 99 }]);
    });

    it('returns an empty array for a known wrapper key holding an empty array', async () => {
      output.setJsonFormatOptions({ fields: ['id'] });
      await output.json({ workspace: 'ws', count: 0, pullRequests: [] });

      const parsed = JSON.parse(stdoutLines[0]!);
      expect(parsed).toEqual([]);
    });

    it('skips a known wrapper key that holds a non-array and keeps scanning', async () => {
      output.setJsonFormatOptions({ fields: ['id'] });
      await output.json({
        workspace: 'ws',
        count: 1,
        comments: { nested: 'object' },
        pullRequests: [{ id: 1, other: 'x' }],
      });

      // A buggy implementation that stopped at the first non-array wrapper
      // key would project the envelope instead; the later array key wins.
      const parsed = JSON.parse(stdoutLines[0]!);
      expect(parsed).toEqual([{ id: 1 }]);
    });
  });

  describe('json with --jq', () => {
    it('runs the jq expression against the data', async () => {
      output.setJsonFormatOptions({ jq: '.[] | .id' });
      await output.json([{ id: 1 }, { id: 2 }, { id: 3 }]);

      // jq emits one value per line.
      const lines = stdoutLines.join('').trim().split('\n');
      expect(lines).toEqual(['1', '2', '3']);
    });

    it('combines field projection with jq filtering', async () => {
      output.setJsonFormatOptions({
        fields: ['id', 'title'],
        jq: '.[] | .title',
      });
      await output.json({
        pullRequests: [
          { id: 1, title: 'first', state: 'OPEN' },
          { id: 2, title: 'second', state: 'MERGED' },
        ],
      });

      const lines = stdoutLines.join('').trim().split('\n');
      expect(lines).toEqual(['"first"', '"second"']);
    });

    it('quotes string results by default', async () => {
      output.setJsonFormatOptions({ jq: '.[].title' });
      await output.json([{ title: 'first' }, { title: 'a "quoted" one' }]);

      expect(stdoutLines).toEqual(['"first"\n"a \\"quoted\\" one"']);
    });

    it('prints string results unquoted with rawOutput', async () => {
      output.setJsonFormatOptions({ jq: '.[].title', rawOutput: true });
      await output.json([{ title: 'first' }, { title: 'a "quoted" one' }]);

      expect(stdoutLines).toEqual(['first\na "quoted" one']);
    });

    it('throws BBError on invalid jq expression', async () => {
      output.setJsonFormatOptions({ jq: '.invalid syntax [' });

      await expect(output.json({ id: 1 })).rejects.toThrow(/jq evaluation/);
    });
  });

  describe('json with --lean', () => {
    const pullRequest = {
      id: 1,
      links: {
        self: { href: 'https://api.bitbucket.org/2.0/pr/1' },
        html: { href: 'https://bitbucket.org/ws/repo/pull-requests/1' },
        diff: { href: 'https://api.bitbucket.org/2.0/pr/1/diff' },
      },
      author: {
        display_name: 'Jane',
        links: { avatar: { href: 'https://avatar' } },
      },
      reviewers: [
        {
          display_name: 'Joe',
          links: {
            self: { href: 'https://api' },
            html: { href: 'https://bitbucket.org/joe' },
          },
        },
      ],
    };

    it('keeps only links.html in every links map', async () => {
      output.setJsonFormatOptions({ lean: true });
      await output.json({ count: 1, pullRequests: [pullRequest] });

      expect(JSON.parse(stdoutLines[0]!)).toEqual({
        count: 1,
        pullRequests: [
          {
            id: 1,
            links: {
              html: { href: 'https://bitbucket.org/ws/repo/pull-requests/1' },
            },
            author: { display_name: 'Jane' },
            reviewers: [
              {
                display_name: 'Joe',
                links: { html: { href: 'https://bitbucket.org/joe' } },
              },
            ],
          },
        ],
      });
    });

    it('leaves output unchanged without lean', async () => {
      await output.json(pullRequest);

      expect(JSON.parse(stdoutLines[0]!)).toEqual(pullRequest);
    });

    it('prunes after field projection and before jq', async () => {
      output.setJsonFormatOptions({
        lean: true,
        fields: ['id', 'author'],
        jq: '.[0].author | keys',
      });
      await output.json({ pullRequests: [pullRequest] });

      expect(JSON.parse(stdoutLines.join(''))).toEqual(['display_name']);
    });
  });

  describe('setJsonFormatOptions', () => {
    it('clears previous options when called with empty object', async () => {
      output.setJsonFormatOptions({ fields: ['id'] });
      output.setJsonFormatOptions({});
      await output.json({ id: 1, title: 'hello' });

      const parsed = JSON.parse(stdoutLines[0]!);
      expect(parsed).toEqual({ id: 1, title: 'hello' });
    });
  });

  describe('isJsonMode', () => {
    it('returns false by default', () => {
      expect(output.isJsonMode()).toBe(false);
    });

    it('returns true after setJsonFormatOptions({ json: true })', () => {
      output.setJsonFormatOptions({ json: true });
      expect(output.isJsonMode()).toBe(true);
    });

    it('returns false when json is false or undefined', () => {
      output.setJsonFormatOptions({ json: false });
      expect(output.isJsonMode()).toBe(false);

      output.setJsonFormatOptions({ fields: ['id'] });
      expect(output.isJsonMode()).toBe(false);
    });

    it('clears json mode when options are reset to {}', () => {
      output.setJsonFormatOptions({ json: true });
      expect(output.isJsonMode()).toBe(true);

      output.setJsonFormatOptions({});
      expect(output.isJsonMode()).toBe(false);
    });
  });

  describe('jsonError', () => {
    it('should output compact JSON to stderr', () => {
      output.jsonError({ name: 'BBError', code: 4003, message: 'Invalid key' });

      expect(stderrLines).toHaveLength(1);
      expect(stderrLines[0]).toBe(
        '{"name":"BBError","code":4003,"message":"Invalid key"}'
      );
    });
  });

  describe('table', () => {
    it('should output formatted table', () => {
      output.table(
        ['NAME', 'VALUE'],
        [
          ['foo', 'bar'],
          ['baz', 'qux'],
        ]
      );

      expect(stdoutLines.length).toBeGreaterThanOrEqual(3); // header, separator, 2 rows
      expect(stdoutLines[0]).toContain('NAME');
      expect(stdoutLines[0]).toContain('VALUE');
      expect(stdoutLines[1]).toMatch(/^-+/); // separator
    });

    it('should handle empty rows', () => {
      output.table(['NAME'], []);

      expect(stdoutLines).toHaveLength(0);
    });

    it('should pad columns to equal width', () => {
      output.table(
        ['SHORT', 'LONGER_HEADER'],
        [
          ['a', 'b'],
          ['longvalue', 'c'],
        ]
      );

      // Check that columns are aligned (lines should have consistent spacing)
      expect(stdoutLines.length).toBeGreaterThan(0);
    });

    it('should handle missing values in rows', () => {
      output.table(
        ['A', 'B', 'C'],
        [['only', 'two']] // Missing third column
      );

      expect(stdoutLines.length).toBeGreaterThan(0);
    });
  });

  describe('success', () => {
    it('should output success message with symbol', () => {
      output.success('Operation completed');

      expect(stdoutLines[0]).toContain('✓');
      expect(stdoutLines[0]).toContain('Operation completed');
    });
  });

  describe('error', () => {
    it('should output error message with symbol', () => {
      output.error('Something failed');

      expect(stderrLines[0]).toContain('✗');
      expect(stderrLines[0]).toContain('Something failed');
    });
  });

  describe('warning', () => {
    it('should output warning message with symbol', () => {
      output.warning('Be careful');

      expect(stderrLines[0]).toContain('⚠');
      expect(stderrLines[0]).toContain('Be careful');
    });
  });

  describe('info', () => {
    it('should output info message with symbol', () => {
      output.info('Here is some info');

      expect(stdoutLines[0]).toContain('ℹ');
      expect(stdoutLines[0]).toContain('Here is some info');
    });

    it('writes to stderr in JSON mode so stdout stays parseable', () => {
      output.setJsonFormatOptions({ json: true });
      output.info('Opening browser...');

      expect(stdoutLines).toEqual([]);
      expect(stderrLines[0]).toContain('Opening browser...');
    });
  });

  describe('text', () => {
    it('should output plain text', () => {
      output.text('Plain message');

      expect(stdoutLines[0]).toBe('Plain message');
    });

    it('should handle empty string', () => {
      output.text('');

      expect(stdoutLines[0]).toBe('');
    });
  });

  describe('stderr', () => {
    it('writes raw text to stderr with no symbol prefix', () => {
      output.stderr('Bad Request');

      expect(stderrLines[0]).toBe('Bad Request');
      expect(stdoutLines).toHaveLength(0);
    });

    it('strips terminal control sequences', () => {
      output.stderr('ok\x1b]0;pwned\x07after');

      expect(stderrLines[0]).toBe('okafter');
    });
  });

  describe('raw', () => {
    let writes: unknown[];
    let writeSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
      writes = [];
      writeSpy = spyOn(process.stdout, 'write').mockImplementation(
        (chunk: unknown) => {
          writes.push(chunk);
          return true;
        }
      );
    });

    afterEach(() => {
      writeSpy.mockRestore();
    });

    it('writes the exact bytes with no trailing newline when piped', () => {
      terminal.isTTY = false;
      const bytes = new Uint8Array([0x89, 0x50, 0x1b, 0x5d, 0x00, 0x0a]);

      output.raw(bytes);

      expect(writes).toEqual([bytes]);
      expect(stdoutLines).toHaveLength(0);
    });

    it('strips terminal control sequences when stdout is a TTY', () => {
      terminal.isTTY = true;

      output.raw(new TextEncoder().encode('ok\x1b]0;pwned\x07after\n'));

      expect(writes).toEqual(['okafter\n']);
    });
  });

  describe('separator', () => {
    it('should render a 60-character Unicode line by default', () => {
      output.separator();

      expect(stdoutLines).toHaveLength(1);
      // Strip ANSI color codes for the character/length assertion
      const plain = stdoutLines[0]!.replace(/\[[0-9;]*m/g, '');
      expect(plain).toBe('─'.repeat(60));
    });

    it('should respect a custom width', () => {
      output.separator(20);

      const plain = stdoutLines[0]!.replace(/\[[0-9;]*m/g, '');
      expect(plain).toBe('─'.repeat(20));
    });

    it('should print an empty line for non-positive widths', () => {
      output.separator(0);
      output.separator(-5);

      expect(stdoutLines).toEqual(['', '']);
    });

    it('should emit no ANSI codes when noColor is true', () => {
      const noColorOutput = new OutputService({ noColor: true });
      noColorOutput.separator(10);

      expect(stdoutLines[0]).toBe('─'.repeat(10));
    });
  });

  describe('formatDate', () => {
    it('should format ISO date string', () => {
      const result = output.formatDate('2024-06-15T10:30:00.000Z');

      expect(result).toContain('2024');
      expect(result).toContain('Jun');
      expect(result).toContain('15');
    });

    it('should format Date object', () => {
      const date = new Date('2024-12-25T08:00:00.000Z');
      const result = output.formatDate(date);

      expect(result).toContain('2024');
      expect(result).toContain('Dec');
      expect(result).toContain('25');
    });
  });

  describe('truncate', () => {
    it('returns the input unchanged when it fits', () => {
      expect(output.truncate('hello', 10)).toBe('hello');
    });

    it('appends the default ellipsis when the input is too long', () => {
      expect(output.truncate('hello world', 8)).toBe('hello...');
    });

    it('honors a custom suffix', () => {
      expect(output.truncate('hello world', 8, '…')).toBe('hello w…');
    });

    it('returns the input unchanged when maxLength <= 0', () => {
      expect(output.truncate('hello', 0)).toBe('hello');
      expect(output.truncate('hello', -1)).toBe('hello');
    });

    it('falls back to a hard slice when the suffix is longer than maxLength', () => {
      expect(output.truncate('hello world', 2, '...')).toBe('he');
    });
  });

  describe('noUnicode option', () => {
    it('passes through unicode glyphs by default', () => {
      const out = new OutputService();
      expect(out.symbol('✓', 'OK')).toBe('✓');
      expect(out.symbol('─', '-')).toBe('─');
      expect(out.symbol('→', '->')).toBe('→');
    });

    it('returns the ASCII fallback when noUnicode is true', () => {
      const out = new OutputService({ noUnicode: true });
      expect(out.symbol('✓', 'OK')).toBe('OK');
      expect(out.symbol('─', '-')).toBe('-');
      expect(out.symbol('→', '->')).toBe('->');
    });

    it('substitutes ASCII fallbacks in success output', () => {
      const out = new OutputService({ noUnicode: true });
      out.success('done');

      expect(stdoutLines[0]).toContain('OK');
      expect(stdoutLines[0]).toContain('done');
      expect(stdoutLines[0]).not.toContain('✓');
    });

    it('substitutes ASCII fallbacks in error output', () => {
      const out = new OutputService({ noUnicode: true });
      out.error('boom');

      expect(stderrLines[0]).toContain('ERR');
      expect(stderrLines[0]).toContain('boom');
      expect(stderrLines[0]).not.toContain('✗');
    });

    it('substitutes ASCII fallbacks in warning output', () => {
      const out = new OutputService({ noUnicode: true });
      out.warning('careful');

      expect(stderrLines[0]).toContain('!!');
      expect(stderrLines[0]).toContain('careful');
      expect(stderrLines[0]).not.toContain('⚠');
    });

    it('substitutes ASCII fallbacks in info output', () => {
      const out = new OutputService({ noUnicode: true });
      out.info('hello');

      expect(stdoutLines[0]).toContain('hello');
      expect(stdoutLines[0]).not.toContain('ℹ');
    });

    it('keeps Unicode glyphs in info/success/warning/error when noUnicode is false', () => {
      const out = new OutputService({ noUnicode: false });
      out.success('a');
      out.error('b');
      out.warning('c');
      out.info('d');

      expect(stdoutLines[0]).toContain('✓');
      expect(stderrLines[0]).toContain('✗');
      expect(stderrLines[1]).toContain('⚠');
      expect(stdoutLines[1]).toContain('ℹ');
    });

    it('is independent from noColor', () => {
      // noColor and noUnicode are orthogonal: a terminal with full color
      // support may still have broken glyph rendering, and vice versa.
      const colored = new OutputService({ noColor: false, noUnicode: true });
      expect(colored.symbol('✓', 'OK')).toBe('OK');

      const plain = new OutputService({ noColor: true, noUnicode: false });
      expect(plain.symbol('✓', 'OK')).toBe('✓');
    });
  });

  describe('noColor option', () => {
    it('should strip colors when noColor is true', () => {
      const noColorOutput = new OutputService({ noColor: true });

      const formatted = noColorOutput.format(
        'test',
        (t) => `\x1b[32m${t}\x1b[0m`
      );

      expect(formatted).toBe('test');
    });

    it('should apply colors when noColor is false', () => {
      const colorOutput = new OutputService({ noColor: false });

      const formatted = colorOutput.format(
        'test',
        (t) => `[colored]${t}[/colored]`
      );

      expect(formatted).toBe('[colored]test[/colored]');
    });
  });

  describe('dim', () => {
    it('should return dimmed text', () => {
      const result = output.dim('dimmed text');

      expect(result).toContain('dimmed text');
    });

    it('should return plain text when noColor is true', () => {
      const noColorOutput = new OutputService({ noColor: true });
      const result = noColorOutput.dim('text');

      expect(result).toBe('text');
    });
  });

  describe('highlight', () => {
    it('should return highlighted text', () => {
      const result = output.highlight('important');

      expect(result).toContain('important');
    });
  });

  describe('bold', () => {
    it('should return bold text', () => {
      const result = output.bold('strong');

      expect(result).toContain('strong');
    });
  });

  describe('color helpers with noColor=true', () => {
    let noColorOutput: OutputService;

    beforeEach(() => {
      noColorOutput = new OutputService({ noColor: true });
    });

    it('should pass text through each color helper unchanged', () => {
      // Every chalk-backed helper must respect --no-color, so the contract
      // is: when noColor is true, the input string is returned verbatim.
      for (const helper of [
        'dim',
        'highlight',
        'bold',
        'red',
        'green',
        'yellow',
        'cyan',
        'magenta',
        'gray',
        'blue',
        'underline',
      ] as const) {
        const result = noColorOutput[helper]('payload');
        expect(result).toBe('payload');
      }
    });

    it('should not emit ANSI escape codes in formatted output', () => {
      const joined = [
        noColorOutput.red('a'),
        noColorOutput.green('b'),
        noColorOutput.yellow('c'),
        noColorOutput.cyan('d'),
        noColorOutput.magenta('e'),
        noColorOutput.gray('f'),
        noColorOutput.blue('g'),
        noColorOutput.underline('h'),
        noColorOutput.bold('i'),
        noColorOutput.dim('j'),
        noColorOutput.highlight('k'),
      ].join('');

      expect(joined).toBe('abcdefghijk');
      // Explicit ANSI-escape check
      // eslint-disable-next-line no-control-regex
      expect(/\u001b\[/.test(joined)).toBe(false);
    });

    it('should pass text through format() helper unchanged', () => {
      const result = noColorOutput.format('boom', (t) => `<<${t}>>`);
      expect(result).toBe('boom');
    });
  });

  describe('color helpers with noColor=false', () => {
    let colorOutput: OutputService;
    let originalLevel: typeof chalk.level;

    beforeEach(() => {
      // Force chalk to emit ANSI codes so we can assert on them. Under Bun
      // test runners the TTY detection may leave chalk.level at 0.
      originalLevel = chalk.level;
      chalk.level = 3;
      colorOutput = new OutputService({ noColor: false });
    });

    afterEach(() => {
      chalk.level = originalLevel;
    });

    it.each([
      ['red', '31'],
      ['green', '32'],
      ['yellow', '33'],
      ['blue', '34'],
      ['magenta', '35'],
      ['cyan', '36'],
    ])(
      '%s should wrap input text with the expected ANSI color code',
      (helper, code) => {
        const result = (
          colorOutput as unknown as Record<string, (t: string) => string>
        )[helper]('hello');
        expect(result).toContain('hello');
        expect(result).toContain(`\u001b[${code}m`);
        expect(result).toContain('\u001b[39m'); // color reset
      }
    );

    it('gray should produce ANSI output (chalk alias for blackBright)', () => {
      const result = colorOutput.gray('hello');
      expect(result).toContain('hello');
      // eslint-disable-next-line no-control-regex
      expect(/\u001b\[/.test(result)).toBe(true);
    });

    it('bold should wrap input with bold ANSI sequence', () => {
      const result = colorOutput.bold('hello');
      expect(result).toContain('hello');
      expect(result).toContain('\u001b[1m');
      expect(result).toContain('\u001b[22m');
    });

    it('dim should wrap input with dim ANSI sequence', () => {
      const result = colorOutput.dim('hello');
      expect(result).toContain('hello');
      expect(result).toContain('\u001b[2m');
    });

    it('underline should wrap input with underline ANSI sequence', () => {
      const result = colorOutput.underline('hello');
      expect(result).toContain('hello');
      expect(result).toContain('\u001b[4m');
    });

    it('highlight should use the cyan ANSI sequence', () => {
      const result = colorOutput.highlight('hello');
      expect(result).toContain('\u001b[36m');
    });

    it('format() should apply the provided formatter function', () => {
      const result = colorOutput.format('hello', (t) => `<<${t}>>`);
      expect(result).toBe('<<hello>>');
    });
  });

  describe('jsonError', () => {
    it('should serialize objects without pretty-printing', () => {
      output.jsonError({ code: 1, nested: { ok: true } });

      expect(stderrLines[0]).toBe('{"code":1,"nested":{"ok":true}}');
      // Pretty-printed would contain newlines / indentation.
      expect(stderrLines[0]).not.toContain('\n');
    });
  });

  describe('table alignment', () => {
    it('should pad rows based on the widest value in each column', () => {
      output.table(
        ['A', 'BBBB'],
        [
          ['1', 'x'],
          ['22', 'yy'],
        ]
      );

      // Header is padded to the wider column width; rows follow suit.
      const [headerLine, separator, row1, row2] = stdoutLines;
      expect(headerLine).toContain('A ');
      expect(headerLine).toContain('BBBB');
      expect(separator).toMatch(/^-+  -+$/);
      // The second column starts at the same offset on every row.
      expect(row1.indexOf('x')).toBe(row2.indexOf('yy'));
    });
  });

  describe('control character sanitization', () => {
    // Untrusted strings (PR titles, descriptions, branch names, snippet
    // names, repo descriptions) flow into `text/info/success/warning/error`
    // and `table()` cells. Without sanitization an attacker can inject:
    //   * OSC-8 hyperlinks (\x1b]8;;<url>\x1b\\Click\x1b]8;;\x1b\\)
    //   * Terminal title rewrites (\x1b]0;evil\x07)
    //   * Cursor / screen manipulation (\x1b[2J\x1b[H)
    //   * Older OSC fontsetting sequences with a CVE history
    // This block locks in the strip behavior for every text output method
    // and the table renderer.
    it.each([
      ['text', 'stdout'],
      ['info', 'stdout'],
      ['success', 'stdout'],
      ['warning', 'stderr'],
      ['error', 'stderr'],
    ] as const)(
      '%s strips ESC, OSC and cursor-manipulation sequences',
      (method, channel) => {
        const payloads = [
          '\x1b[2Jevil',
          '\x1b]0;Untrusted Title\x07suffix',
          '\x1b]8;;https://evil.example.com\x1b\\Click here\x1b]8;;\x1b\\',
          'before\x07after',
          'tab\x08bs',
        ];

        for (const payload of payloads) {
          stdoutLines.length = 0;
          stderrLines.length = 0;

          (output as unknown as Record<string, (m: string) => void>)[method](
            payload
          );

          const sink = channel === 'stdout' ? stdoutLines : stderrLines;
          const printed = sink.join('');
          // No raw ESC byte should survive sanitization.
          expect(printed).not.toContain('\x1b');
          // BEL and BS should also be stripped.
          expect(printed).not.toContain('\x07');
          expect(printed).not.toContain('\x08');
        }
      }
    );

    it('table() strips control chars from headers and cells', () => {
      output.table(
        ['NA\x1b]0;evil\x07ME', 'VAL\x1b[2JUE'],
        [
          ['\x1b]8;;https://evil\x1b\\foo\x1b]8;;\x1b\\', 'b\x07ar'],
          ['baz', '\x1b[31Jqux'],
        ]
      );

      const printed = stdoutLines.join('\n');
      expect(printed).not.toContain('\x1b');
      expect(printed).not.toContain('\x07');
      // Visible characters survive stripping.
      expect(printed).toContain('NAME');
      expect(printed).toContain('VALUE');
      expect(printed).toContain('foo');
      expect(printed).toContain('bar');
      expect(printed).toContain('baz');
      expect(printed).toContain('qux');
    });

    it('table() column widths are computed from sanitized cell lengths', () => {
      // If we used raw lengths, the OSC sequence would inflate the width and
      // the visible alignment would break.
      output.table(
        ['A', 'B'],
        [['\x1b]8;;https://evil\x1b\\x\x1b]8;;\x1b\\', 'y']]
      );

      const printed = stdoutLines.join('\n');
      expect(printed).not.toContain('\x1b');
      // Width should match 'x' (1 char), not the raw escape-laden string.
      const dataRow = stdoutLines[2];
      expect(dataRow).toMatch(/^x\s+y\s*$/);
    });

    it('table() neutralizes newlines/CR/tabs in cells so rows stay on one line', () => {
      // Regression for issue #241: a repository description containing an
      // embedded newline (real data returned by the Bitbucket API) breaks the
      // table layout. stripControl() intentionally preserves \n/\r/\t for
      // text(), but table() must collapse them — otherwise the tail of the
      // cell drops to column 0 on the next visual line (the stray
      // "To connec ..." fragment seen in the bug report) and column widths are
      // computed from the wrong length.
      output.table(
        ['REPOSITORY', 'VISIBILITY', 'DESCRIPTION'],
        [
          ['ws/repo-a', 'private', 'Various tools\nTo connect to the database'],
          ['ws/repo-b', 'private', 'tab\tseparated\tdesc'],
          ['ws/repo-c', 'private', 'carriage\r\nreturn'],
        ]
      );

      // table() emits exactly one console.log per visual line: header,
      // separator, then one line per row. No emitted line may contain an
      // embedded whitespace control char, or it spans multiple terminal rows.
      expect(stdoutLines).toHaveLength(5); // header + separator + 3 rows
      for (const line of stdoutLines) {
        expect(line).not.toContain('\n');
        expect(line).not.toContain('\r');
        expect(line).not.toContain('\t');
      }

      // The description tail must not start a new line at column 0.
      expect(stdoutLines.some((line) => /^To connect/.test(line))).toBe(false);

      // Visible words survive — only the control chars are removed/collapsed.
      const printed = stdoutLines.join('\n');
      expect(printed).toContain('Various tools');
      expect(printed).toContain('To connect to the database');
    });

    it('preserves chalk SGR codes embedded by callers', () => {
      // Callers commonly compose colored strings before handing them to
      // text() — e.g. `output.text(`${output.bold('#42')} ${pr.title}`)`.
      // Stripping must not destroy the SGR codes chalk produced.
      const originalLevel = chalk.level;
      chalk.level = 3;
      try {
        const colored = chalk.bold('#42');
        const composed = `${colored} normal`;
        output.text(composed);

        expect(stdoutLines[0]).toContain('\x1b[1m');
        expect(stdoutLines[0]).toContain('#42');
        expect(stdoutLines[0]).toContain('normal');
      } finally {
        chalk.level = originalLevel;
      }
    });

    it('strips dangerous CSI codes mixed with chalk SGR', () => {
      // Attacker could try to splice cursor manipulation between chalk
      // sequences. SGR survives, the rest gets stripped.
      const originalLevel = chalk.level;
      chalk.level = 3;
      try {
        const composed = `${chalk.red('safe')}\x1b[2Jevil`;
        output.text(composed);

        const printed = stdoutLines[0]!;
        expect(printed).toContain('\x1b[31m'); // chalk red foreground
        expect(printed).toContain('safe');
        expect(printed).toContain('evil');
        // Screen-clear sequence is gone.
        expect(printed).not.toContain('\x1b[2J');
      } finally {
        chalk.level = originalLevel;
      }
    });
  });

  describe('table layout', () => {
    it('prints tab-separated rows without a header when piped', () => {
      terminal.isTTY = false;

      output.table(
        ['ID', 'TITLE'],
        [
          ['#1', 'A long title that is never cut'],
          ['#2', 'tab\tinside'],
        ]
      );

      expect(stdoutLines).toEqual([
        '#1\tA long title that is never cut',
        '#2\ttab inside',
      ]);
    });

    it('keeps an empty field for missing cells when piped', () => {
      terminal.isTTY = false;

      output.table(['A', 'B', 'C'], [['only']]);

      expect(stdoutLines).toEqual(['only\t\t']);
    });

    it('aligns colored and wide cells by their visible width', () => {
      const originalLevel = chalk.level;
      chalk.level = 1;
      try {
        output.table(
          ['NAME', 'STATE'],
          [
            [chalk.green('ok'), 'x'],
            ['漢字', 'y'],
            ['abcd', 'z'],
          ]
        );
      } finally {
        chalk.level = originalLevel;
      }

      const rows = stdoutLines.slice(2);
      const stateColumn = rows.map(
        (row) => Bun.stringWidth(row) - Bun.stringWidth(row.at(-1)!)
      );
      expect(new Set(stateColumn).size).toBe(1);
      expect(stateColumn[0]).toBe(6); // 'NAME' + two-space gap
    });

    it('does not pad the last column', () => {
      output.table(
        ['A', 'B'],
        [
          ['1', 'long value'],
          ['2', 'x'],
        ]
      );

      for (const line of stdoutLines) {
        expect(line).toBe(line.trimEnd());
      }
    });

    it('fits rows to the terminal width by cutting flexible columns', () => {
      terminal.columns = 30;
      const title = 'A pull request title that is far too long';

      output.table(['ID', 'TITLE', 'BY'], [['#1', title, 'paul']], {
        flexColumns: [1],
      });

      for (const line of stdoutLines) {
        expect(Bun.stringWidth(line)).toBeLessThanOrEqual(30);
      }
      expect(stdoutLines[2]).toContain('#1');
      expect(stdoutLines[2]).toContain('...');
      expect(stdoutLines[2]).toEndWith('paul');
    });

    it('prints full values with --no-truncate', () => {
      terminal.columns = 30;
      const title = 'A pull request title that is far too long';

      new OutputService({ noTruncate: true, terminal }).table(
        ['ID', 'TITLE'],
        [['#1', title]]
      );

      expect(stdoutLines[2]).toBe(`#1  ${title}`);
    });
  });

  describe('formatRelativeDate', () => {
    const now = new Date('2026-10-03T12:00:00Z');

    it('renders relative times on a terminal', () => {
      expect(output.formatRelativeDate('2026-10-03T11:59:30Z', now)).toBe(
        '30 seconds ago'
      );
      expect(output.formatRelativeDate('2026-10-03T09:00:00Z', now)).toBe(
        '3 hours ago'
      );
      expect(output.formatRelativeDate('2026-10-02T09:00:00Z', now)).toBe(
        'yesterday'
      );
      expect(output.formatRelativeDate('2026-07-01T12:00:00Z', now)).toBe(
        '3 months ago'
      );
      expect(output.formatRelativeDate('2028-10-03T12:00:00Z', now)).toBe(
        'in 2 years'
      );
    });

    it('uses the configured locale', () => {
      const localized = new OutputService({ locale: 'de-DE', terminal });
      expect(localized.formatRelativeDate('2026-10-03T09:00:00Z', now)).toBe(
        'vor 3 Stunden'
      );
    });

    it('prints ISO 8601 timestamps when piped', () => {
      terminal.isTTY = false;
      expect(output.formatRelativeDate('2026-10-03T09:00:00Z', now)).toBe(
        '2026-10-03T09:00:00.000Z'
      );
    });

    it('prints a dash for missing or invalid dates', () => {
      expect(output.formatRelativeDate('', now)).toBe('-');
    });

    it('does not round eleven and a half months up to a year', () => {
      expect(output.formatRelativeDate('2025-10-05T12:00:00Z', now)).toBe(
        '11 months ago'
      );
    });
  });

  describe('withPager', () => {
    const originalPager = process.env.BB_PAGER;
    let dir: string;
    let pagedFile: string;

    // Stand-in pager that saves what it receives instead of showing it.
    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), 'bb-pager-'));
      pagedFile = join(dir, 'paged.txt');
      const pager = join(dir, 'pager.sh');
      await Bun.write(pager, '#!/bin/sh\ncat > "$1"\n');
      await chmod(pager, 0o755);
      process.env.BB_PAGER = `${pager} ${pagedFile}`;
    });

    afterEach(async () => {
      if (originalPager === undefined) {
        delete process.env.BB_PAGER;
      } else {
        process.env.BB_PAGER = originalPager;
      }
      await rm(dir, { recursive: true, force: true });
    });

    it.skipIf(process.platform === 'win32')(
      'sends everything written during the run through the pager',
      async () => {
        const plain = new OutputService({ noColor: true, terminal });
        const result = await plain.withPager(async () => {
          plain.text('line one');
          plain.table(['A'], [['cell']]);
          return 42;
        });

        expect(result).toBe(42);
        expect(stdoutLines).toHaveLength(0);
        expect(await Bun.file(pagedFile).text()).toBe(
          'line one\nA\n----\ncell\n'
        );
      }
    );

    it('writes directly when stdout is not a terminal', async () => {
      terminal.isTTY = false;

      await output.withPager(async () => output.text('piped'));

      expect(stdoutLines).toEqual(['piped']);
      expect(await Bun.file(pagedFile).exists()).toBe(false);
    });

    it('writes directly in JSON mode', async () => {
      output.setJsonFormatOptions({ json: true });

      await output.withPager(async () => output.json({ ok: true }));

      expect(stdoutLines).toEqual([JSON.stringify({ ok: true }, null, 2)]);
      expect(await Bun.file(pagedFile).exists()).toBe(false);
    });

    it('writes directly when paging is disabled', async () => {
      process.env.BB_PAGER = '';

      await output.withPager(async () => output.text('plain'));

      expect(stdoutLines).toEqual(['plain']);
    });

    it('prints the output itself when the pager cannot start', async () => {
      process.env.BB_PAGER = 'bb-no-such-pager-binary';
      const writes: unknown[] = [];
      const writeSpy = spyOn(process.stdout, 'write').mockImplementation(
        (chunk: unknown) => {
          writes.push(chunk);
          return true;
        }
      );
      try {
        await output.withPager(async () => output.text('fallback'));
      } finally {
        writeSpy.mockRestore();
      }

      expect(writes).toEqual(['fallback\n']);
    });

    it('prints partial output directly when the command fails', async () => {
      const writes: unknown[] = [];
      const writeSpy = spyOn(process.stdout, 'write').mockImplementation(
        (chunk: unknown) => {
          writes.push(chunk);
          return true;
        }
      );
      try {
        await expect(
          output.withPager(async () => {
            output.text('partial');
            throw new Error('boom');
          })
        ).rejects.toThrow('boom');
      } finally {
        writeSpy.mockRestore();
      }

      expect(writes).toEqual(['partial\n']);
      expect(await Bun.file(pagedFile).exists()).toBe(false);
    });
  });

  describe('formatDate edge cases', () => {
    it('should produce a stable formatted string for a fixed date', () => {
      const result = output.formatDate('2024-06-15T10:30:00Z');

      // Exact format is locale-dependent but must include the pieces we ask for.
      expect(result).toMatch(/2024/);
      expect(result).toMatch(/Jun/);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/:\d{2}/); // HH:MM marker
    });
  });

  describe('formatDate locale support', () => {
    it('defaults to en-US formatting (US-style "Jun 15") when no locale is configured', () => {
      const defaultOutput = new OutputService();
      const result = defaultOutput.formatDate('2024-06-15T10:30:00Z');

      // en-US renders the month abbreviation before the day.
      expect(result).toMatch(/Jun/);
      expect(result.indexOf('Jun')).toBeLessThan(result.indexOf('15'));
    });

    it('honours an explicit locale (de-DE renders day before month)', () => {
      const localized = new OutputService({ locale: 'de-DE' });
      const result = localized.formatDate('2024-06-15T10:30:00Z');

      expect(result).toContain('15');
      expect(result).toContain('2024');
      // de-DE uses "15. Juni 2024 ..." or similar; in either case the day
      // appears before the year in the rendered string.
      expect(result.indexOf('15')).toBeLessThan(result.indexOf('2024'));
    });

    it('honours an explicit locale (ja-JP includes the year-suffix character)', () => {
      const localized = new OutputService({ locale: 'ja-JP' });
      const result = localized.formatDate('2024-06-15T10:30:00Z');

      // ja-JP's short-month formatter renders the year with the 年 suffix.
      expect(result).toContain('2024');
      expect(result).toContain('年');
    });

    it('falls back to en-US when given an invalid locale tag', () => {
      const broken = new OutputService({ locale: 'not a valid tag!!' });
      const result = broken.formatDate('2024-06-15T10:30:00Z');

      // Identical shape to the default — we should not throw, and we should
      // produce something a human can read.
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('formats a Date instance through the configured locale', () => {
      const localized = new OutputService({ locale: 'de-DE' });
      const result = localized.formatDate(new Date('2024-12-25T08:00:00Z'));

      expect(result).toContain('25');
      expect(result).toContain('2024');
    });
  });
});
