/**
 * Base command tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BaseCommand } from '../../src/core/base-command.js';
import { createMockOutputService } from '../setup.js';
import type { CommandContext } from '../../src/core/interfaces/commands.js';
import { BBError, ErrorCode } from '../../src/types/errors.js';

class TestCommand extends BaseCommand<{ option?: string }, { data: string }> {
  public readonly name = 'test';
  public readonly description = 'Test command';

  async execute(
    _options: { option?: string },
    _context: CommandContext
  ): Promise<{ data: string }> {
    return { data: 'test' };
  }

  public callRequireOption<T>(
    value: T | undefined,
    name: string,
    message?: string
  ): T {
    return this.requireOption(value, name, message);
  }
}

class TestCommandWithError extends BaseCommand<{ option?: string }, void> {
  public readonly name = 'test-error';
  public readonly description = 'Test command with error';

  async execute(
    _options: { option?: string },
    _context: CommandContext
  ): Promise<void> {
    throw new Error('Test error');
  }
}

class TestCommandWithBBError extends BaseCommand<{ option?: string }, void> {
  public readonly name = 'test-error-bb';
  public readonly description = 'Test command with BBError';

  async execute(
    _options: { option?: string },
    _context: CommandContext
  ): Promise<void> {
    throw new BBError({
      code: ErrorCode.CONFIG_INVALID_KEY,
      message: 'Unknown config key',
      context: { key: 'invalidKey' },
    });
  }
}

class TestCommandWithUnknownError extends BaseCommand<
  { option?: string },
  void
> {
  public readonly name = 'test-error-unknown';
  public readonly description = 'Test command with unknown error';

  async execute(
    _options: { option?: string },
    _context: CommandContext
  ): Promise<void> {
    throw 'string error';
  }
}

class TestCommandWithParseHelpers extends BaseCommand<
  { option?: string },
  void
> {
  public readonly name = 'test-parse';
  public readonly description = 'Test command with parse helpers';

  async execute(
    _options: { option?: string },
    _context: CommandContext
  ): Promise<void> {}

  public callParseIntOption(value: string, name: string): number {
    return this.parseIntOption(value, name);
  }

  public callParsePositiveInt(value: string, name: string): number {
    return this.parsePositiveInt(value, name);
  }

  public callParseEnumOption<T extends string>(
    value: string,
    name: string,
    allowed: readonly T[]
  ): T {
    return this.parseEnumOption(value, name, allowed);
  }

  public callRequireConfirmation(
    confirmed: boolean | undefined,
    warning: string
  ): void {
    return this.requireConfirmation(confirmed, warning);
  }
}

describe('BaseCommand', () => {
  let output: ReturnType<typeof createMockOutputService>;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    output = createMockOutputService();
    originalNodeEnv = process.env.NODE_ENV;
    process.exitCode = 0;
  });

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('requireOption', () => {
    it('should return ok value when option is provided', () => {
      const command = new TestCommand(output);

      const result = command.callRequireOption('test-value', 'test');

      expect(result).toBe('test-value');
    });

    it('should return error for empty string that is truthy', () => {
      const command = new TestCommand(output);

      expect(() => command.callRequireOption('', 'test')).toThrow();
    });

    it('should return error for undefined value', () => {
      const command = new TestCommand(output);

      expect(() => command.callRequireOption(undefined, 'test')).toThrow(
        'Option --test is required'
      );
    });

    it('should return error for null value', () => {
      const command = new TestCommand(output);

      expect(() =>
        command.callRequireOption(null as unknown as string, 'test')
      ).toThrow();
    });

    it('should return error for empty string', () => {
      const command = new TestCommand(output);

      expect(() => command.callRequireOption('', 'test')).toThrow();
    });

    it('should use custom error message when provided', () => {
      const command = new TestCommand(output);

      expect(() =>
        command.callRequireOption(undefined, 'test', 'Custom message')
      ).toThrow('Custom message');
    });

    it('should use correct error code', () => {
      const command = new TestCommand(output);

      try {
        command.callRequireOption(undefined, 'test');
      } catch (error) {
        expect((error as BBError).code).toBe(5001);
      }
    });

    it('should handle numeric values', () => {
      const command = new TestCommand(output);

      const result = command.callRequireOption(123, 'test');

      expect(result).toBe(123);
    });

    it('should handle zero as valid value', () => {
      const command = new TestCommand(output);

      const result = command.callRequireOption(0, 'test');

      expect(result).toBe(0);
    });

    it('should handle false as valid value', () => {
      const command = new TestCommand(output);

      const result = command.callRequireOption(false, 'test');

      expect(result).toBe(false);
    });
  });

  describe('abstract methods', () => {
    it('should have name property', () => {
      const command = new TestCommand(output);

      expect(command.name).toBe('test');
      expect(typeof command.name).toBe('string');
    });

    it('should have description property', () => {
      const command = new TestCommand(output);

      expect(command.description).toBe('Test command');
      expect(typeof command.description).toBe('string');
    });

    it('should require execute method implementation', () => {
      const command = new TestCommand(output);

      expect(typeof command.execute).toBe('function');
    });

    it('should provide output service to constructor', () => {
      const command = new TestCommand(output);

      expect(command).toBeDefined();
      expect(output).toBeDefined();
    });
  });

  describe('run', () => {
    it('should return the execute result', async () => {
      const command = new TestCommand(output);

      const result = await command.run({}, { globalOptions: {} });

      expect(result).toEqual({ data: 'test' });
    });

    it('should output error and rethrow on failure', async () => {
      const command = new TestCommandWithError(output);

      await expect(command.run({}, { globalOptions: {} })).rejects.toThrow(
        'Test error'
      );

      expect(output.logs).toContain('error:Test error');
    });

    it('should output structured JSON error on failure in json mode', async () => {
      const command = new TestCommandWithError(output);

      await expect(
        command.run({}, { globalOptions: { json: true } })
      ).rejects.toThrow('Test error');

      expect(output.logs).toContain(
        'jsonError:{"name":"Error","code":9999,"message":"Test error"}'
      );
    });

    it('should preserve BBError code and context in json mode', async () => {
      const command = new TestCommandWithBBError(output);

      await expect(
        command.run({}, { globalOptions: { json: true } })
      ).rejects.toThrow('Unknown config key');

      expect(output.logs).toContain(
        'jsonError:{"name":"BBError","code":4003,"message":"Unknown config key","context":{"key":"invalidKey"}}'
      );
    });

    it('should set process.exitCode to 1 when NODE_ENV is not test', async () => {
      process.env.NODE_ENV = 'production';
      process.exitCode = 0;
      const command = new TestCommandWithError(output);

      await expect(command.run({}, { globalOptions: {} })).rejects.toThrow(
        'Test error'
      );

      expect(process.exitCode).toBe(1);
    });

    it('should not set process.exitCode when NODE_ENV is test', async () => {
      process.env.NODE_ENV = 'test';
      process.exitCode = 0;
      const command = new TestCommandWithError(output);

      await expect(command.run({}, { globalOptions: {} })).rejects.toThrow(
        'Test error'
      );

      expect(process.exitCode).toBe(0);
    });

    it('should handle non-Error thrown values by converting to string', async () => {
      const command = new TestCommandWithUnknownError(output);

      await expect(command.run({}, { globalOptions: {} })).rejects.toBe(
        'string error'
      );

      expect(output.logs).toContain('error:string error');
    });

    it('should output json error for non-Error thrown values in json mode', async () => {
      const command = new TestCommandWithUnknownError(output);

      await expect(
        command.run({}, { globalOptions: { json: true } })
      ).rejects.toBe('string error');

      expect(output.logs).toContain(
        'jsonError:{"name":"Error","code":9999,"message":"string error"}'
      );
    });

    it('should output BBError message in non-json mode', async () => {
      const command = new TestCommandWithBBError(output);

      await expect(command.run({}, { globalOptions: {} })).rejects.toThrow(
        'Unknown config key'
      );

      expect(output.logs).toContain('error:Unknown config key');
    });

    it('should re-throw the original error after handling', async () => {
      const command = new TestCommandWithBBError(output);

      try {
        await command.run({}, { globalOptions: {} });
        expect(true).toBe(false); // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(BBError);
        expect((error as BBError).code).toBe(ErrorCode.CONFIG_INVALID_KEY);
      }
    });

    it('should raise context.validationError before invoking execute', async () => {
      let executed = false;
      class ExecuteSpy extends BaseCommand<{ option?: string }, void> {
        public readonly name = 'spy';
        public readonly description = 'spy';
        async execute(): Promise<void> {
          executed = true;
        }
      }
      const command = new ExecuteSpy(output);
      const validationError = new BBError({
        code: ErrorCode.JSON_FORMAT_INVALID,
        message: '--jq requires --json',
      });

      await expect(
        command.run({}, { globalOptions: {}, validationError })
      ).rejects.toBe(validationError);

      expect(executed).toBe(false);
      expect(output.logs).toContain('error:--jq requires --json');
    });

    it('should render context.validationError as JSON when --json is set', async () => {
      class ExecuteSpy extends BaseCommand<{ option?: string }, void> {
        public readonly name = 'spy';
        public readonly description = 'spy';
        async execute(): Promise<void> {}
      }
      const command = new ExecuteSpy(output);
      const validationError = new BBError({
        code: ErrorCode.JSON_FORMAT_INVALID,
        message: '--json field list cannot be empty',
      });

      await expect(
        command.run({}, { globalOptions: { json: true }, validationError })
      ).rejects.toBe(validationError);

      expect(output.logs).toContain(
        'jsonError:{"name":"BBError","code":8002,"message":"--json field list cannot be empty"}'
      );
    });

    it('should push and clear json format options around execute()', async () => {
      const calls: Array<{ fields?: string[]; jq?: string }> = [];
      const spyOutput = {
        ...output,
        setJsonFormatOptions(opts: { fields?: string[]; jq?: string }) {
          calls.push({ ...opts });
        },
      };
      const command = new TestCommand(spyOutput);

      await command.run(
        {},
        {
          globalOptions: {
            json: true,
            jsonFields: ['id', 'title'],
            jq: '.[] | .id',
          },
        }
      );

      // First call sets the options, finally{} resets to {}.
      expect(calls).toEqual([{ fields: ['id', 'title'], jq: '.[] | .id' }, {}]);
    });

    it('should reset json format options even when execute throws', async () => {
      const calls: Array<{ fields?: string[]; jq?: string }> = [];
      const spyOutput = {
        ...output,
        setJsonFormatOptions(opts: { fields?: string[]; jq?: string }) {
          calls.push({ ...opts });
        },
      };
      const command = new TestCommandWithError(spyOutput);

      await expect(
        command.run({}, { globalOptions: { json: true, jsonFields: ['id'] } })
      ).rejects.toThrow('Test error');

      expect(calls).toEqual([{ fields: ['id'], jq: undefined }, {}]);
    });
  });

  describe('parseIntOption', () => {
    it('should parse valid integer string', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(command.callParseIntOption('42', 'limit')).toBe(42);
    });

    it('should throw BBError for non-numeric string', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(() => command.callParseIntOption('abc', 'limit')).toThrow(
        '--limit must be a valid integer'
      );
    });

    it('should throw BBError for empty string', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(() => command.callParseIntOption('', 'limit')).toThrow(
        '--limit must be a valid integer'
      );
    });
  });

  describe('parsePositiveInt', () => {
    it('returns the integer for a positive value', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(command.callParsePositiveInt('42', 'id')).toBe(42);
    });

    it('rejects zero', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(() => command.callParsePositiveInt('0', 'id')).toThrow(
        '--id must be a positive integer'
      );
    });

    it('rejects negative numbers', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(() => command.callParsePositiveInt('-1', 'id')).toThrow(
        '--id must be a positive integer'
      );
    });

    it('rejects non-canonical input like "1abc"', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(() => command.callParsePositiveInt('1abc', 'id')).toThrow(
        '--id must be a positive integer'
      );
    });

    it('rejects decimals like "1.5"', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(() => command.callParsePositiveInt('1.5', 'id')).toThrow(
        '--id must be a positive integer'
      );
    });

    it('rejects empty string', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(() => command.callParsePositiveInt('', 'id')).toThrow(
        '--id must be a positive integer'
      );
    });

    it('accepts a value with surrounding whitespace', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(command.callParsePositiveInt('  7  ', 'id')).toBe(7);
    });
  });

  describe('requireConfirmation', () => {
    it('returns without throwing when confirmed is true', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(() =>
        command.callRequireConfirmation(true, 'This will delete things.')
      ).not.toThrow();
    });

    it('throws BBError when confirmed is false', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(() =>
        command.callRequireConfirmation(false, 'This will delete things.')
      ).toThrow(BBError);
    });

    it('throws BBError when confirmed is undefined', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(() =>
        command.callRequireConfirmation(undefined, 'This will delete things.')
      ).toThrow(BBError);
    });

    it('uses VALIDATION_REQUIRED error code', () => {
      const command = new TestCommandWithParseHelpers(output);

      try {
        command.callRequireConfirmation(undefined, 'This will delete things.');
        expect(true).toBe(false); // should not reach here
      } catch (error) {
        expect((error as BBError).code).toBe(ErrorCode.VALIDATION_REQUIRED);
      }
    });

    it('embeds the warning and standardized confirmation suffix', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(() =>
        command.callRequireConfirmation(
          undefined,
          'This will permanently delete repo/x.'
        )
      ).toThrow('This will permanently delete repo/x.\nUse --yes to confirm.');
    });
  });

  describe('parseEnumOption', () => {
    it('should return value when it matches allowed values', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(
        command.callParseEnumOption('open', 'state', [
          'open',
          'closed',
        ] as const)
      ).toBe('open');
    });

    it('should throw BBError for invalid enum value', () => {
      const command = new TestCommandWithParseHelpers(output);

      expect(() =>
        command.callParseEnumOption('invalid', 'state', [
          'open',
          'closed',
        ] as const)
      ).toThrow('--state must be one of: open, closed');
    });
  });
});
