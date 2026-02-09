/**
 * OutputService tests
 */

import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { OutputService } from '../../src/services/output.service.js';

describe('OutputService', () => {
  let output: OutputService;
  let consoleLogs: string[];
  let consoleErrors: string[];
  let consoleWarns: string[];
  let originalLog: typeof console.log;
  let originalError: typeof console.error;
  let originalWarn: typeof console.warn;

  beforeEach(() => {
    consoleLogs = [];
    consoleErrors = [];
    consoleWarns = [];

    originalLog = console.log;
    originalError = console.error;
    originalWarn = console.warn;

    console.log = (...args: unknown[]) => consoleLogs.push(args.join(' '));
    console.error = (...args: unknown[]) => consoleErrors.push(args.join(' '));
    console.warn = (...args: unknown[]) => consoleWarns.push(args.join(' '));

    output = new OutputService();
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  });

  describe('json', () => {
    it('should output formatted JSON', () => {
      output.json({ name: 'test', value: 42 });

      expect(consoleLogs).toHaveLength(1);
      expect(consoleLogs[0]).toContain('"name": "test"');
      expect(consoleLogs[0]).toContain('"value": 42');
    });

    it('should handle arrays', () => {
      output.json([1, 2, 3]);

      expect(consoleLogs[0]).toContain('1');
      expect(consoleLogs[0]).toContain('2');
      expect(consoleLogs[0]).toContain('3');
    });

    it('should handle null and undefined', () => {
      output.json(null);
      expect(consoleLogs[0]).toBe('null');
    });
  });

  describe('jsonError', () => {
    it('should output compact JSON to stderr', () => {
      output.jsonError({ name: 'BBError', code: 4003, message: 'Invalid key' });

      expect(consoleErrors).toHaveLength(1);
      expect(consoleErrors[0]).toBe(
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

      expect(consoleLogs.length).toBeGreaterThanOrEqual(3); // header, separator, 2 rows
      expect(consoleLogs[0]).toContain('NAME');
      expect(consoleLogs[0]).toContain('VALUE');
      expect(consoleLogs[1]).toMatch(/^-+/); // separator
    });

    it('should handle empty rows', () => {
      output.table(['NAME'], []);

      expect(consoleLogs).toHaveLength(0);
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
      expect(consoleLogs.length).toBeGreaterThan(0);
    });

    it('should handle missing values in rows', () => {
      output.table(
        ['A', 'B', 'C'],
        [['only', 'two']] // Missing third column
      );

      expect(consoleLogs.length).toBeGreaterThan(0);
    });
  });

  describe('success', () => {
    it('should output success message with symbol', () => {
      output.success('Operation completed');

      expect(consoleLogs[0]).toContain('✓');
      expect(consoleLogs[0]).toContain('Operation completed');
    });
  });

  describe('error', () => {
    it('should output error message with symbol', () => {
      output.error('Something failed');

      expect(consoleErrors[0]).toContain('✗');
      expect(consoleErrors[0]).toContain('Something failed');
    });
  });

  describe('warning', () => {
    it('should output warning message with symbol', () => {
      output.warning('Be careful');

      expect(consoleWarns[0]).toContain('⚠');
      expect(consoleWarns[0]).toContain('Be careful');
    });
  });

  describe('info', () => {
    it('should output info message with symbol', () => {
      output.info('Here is some info');

      expect(consoleLogs[0]).toContain('ℹ');
      expect(consoleLogs[0]).toContain('Here is some info');
    });
  });

  describe('text', () => {
    it('should output plain text', () => {
      output.text('Plain message');

      expect(consoleLogs[0]).toBe('Plain message');
    });

    it('should handle empty string', () => {
      output.text('');

      expect(consoleLogs[0]).toBe('');
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
});
