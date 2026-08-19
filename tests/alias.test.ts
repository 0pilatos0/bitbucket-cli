/**
 * Alias expansion tests (issue #275): word splitting, placeholder
 * substitution, argv rewriting, shell-alias detection, and the drift guard
 * keeping RESERVED_COMMAND_NAMES in sync with the live Commander tree.
 */

import { describe, it, expect } from 'bun:test';
import {
  RESERVED_COMMAND_NAMES,
  expandAliasArgv,
  isReservedCommandName,
  isShellAlias,
  isValidAliasName,
  splitShellWords,
  substitutePlaceholders,
} from '../src/alias.js';
import { cli } from '../src/cli.js';
import { BBError, ErrorCode } from '../src/types/errors.js';

const BIN = ['/usr/local/bin/bun', '/app/src/index.ts'];

describe('splitShellWords', () => {
  it('splits on whitespace', () => {
    expect(splitShellWords('pr view --web')).toEqual(['pr', 'view', '--web']);
  });

  it('keeps single-quoted segments intact', () => {
    expect(splitShellWords("pr create -t 'My title'")).toEqual([
      'pr',
      'create',
      '-t',
      'My title',
    ]);
  });

  it('keeps double-quoted segments intact and honors escapes', () => {
    expect(splitShellWords('api "/user" -f name="a \\"b\\""')).toEqual([
      'api',
      '/user',
      '-f',
      'name=a "b"',
    ]);
  });

  it('treats a quoted empty string as a word', () => {
    expect(splitShellWords("pr view ''")).toEqual(['pr', 'view', '']);
  });

  it('supports unquoted backslash escapes', () => {
    expect(splitShellWords('echo a\\ b')).toEqual(['echo', 'a b']);
  });

  it('throws on an unclosed quote', () => {
    expect(() => splitShellWords("pr view 'oops")).toThrow(BBError);
  });
});

describe('substitutePlaceholders', () => {
  it('fills $1-$9 from args', () => {
    expect(
      substitutePlaceholders(['pr', 'checkout', '$1'], ['42'], 'co')
    ).toEqual(['pr', 'checkout', '42']);
  });

  it('appends args beyond the highest placeholder', () => {
    expect(
      substitutePlaceholders(['pr', 'view', '$1'], ['42', '--json'], 'v')
    ).toEqual(['pr', 'view', '42', '--json']);
  });

  it('appends all args when no placeholder is used', () => {
    expect(
      substitutePlaceholders(['pr', 'list'], ['--all', '--json'], 'prs')
    ).toEqual(['pr', 'list', '--all', '--json']);
  });

  it('substitutes a placeholder embedded in a word', () => {
    expect(substitutePlaceholders(['browse', '--pr=$1'], ['7'], 'bpr')).toEqual(
      ['browse', '--pr=7']
    );
  });

  it('throws VALIDATION_REQUIRED when a placeholder argument is missing', () => {
    expect(() => substitutePlaceholders(['pr', 'view', '$1'], [], 'v')).toThrow(
      expect.objectContaining({ code: ErrorCode.VALIDATION_REQUIRED })
    );
  });
});

describe('expandAliasArgv', () => {
  const aliases = {
    co: 'pr checkout $1',
    prs: 'pr list --all',
    sh: '!echo "$1"',
    loop: 'loop again',
    again: 'pr list',
  };

  it('expands a simple alias and appends extra args', () => {
    expect(expandAliasArgv([...BIN, 'prs', '--json'], aliases)).toEqual({
      kind: 'argv',
      argv: [...BIN, 'pr', 'list', '--all', '--json'],
    });
  });

  it('expands placeholders', () => {
    expect(expandAliasArgv([...BIN, 'co', '42'], aliases)).toEqual({
      kind: 'argv',
      argv: [...BIN, 'pr', 'checkout', '42'],
    });
  });

  it('returns shell expansion for !-prefixed aliases without substituting', () => {
    expect(expandAliasArgv([...BIN, 'sh', 'hello'], aliases)).toEqual({
      kind: 'shell',
      command: 'echo "$1"',
      args: ['hello'],
    });
  });

  it('leaves unknown commands, flags, and empty argv untouched', () => {
    expect(expandAliasArgv([...BIN, 'nosuch'], aliases)).toEqual({
      kind: 'none',
    });
    expect(expandAliasArgv([...BIN, '--help'], aliases)).toEqual({
      kind: 'none',
    });
    expect(expandAliasArgv([...BIN], aliases)).toEqual({ kind: 'none' });
  });

  it('never expands a built-in command name, even if aliased in config', () => {
    expect(
      expandAliasArgv([...BIN, 'pr', 'list'], { pr: 'repo list' })
    ).toEqual({ kind: 'none' });
  });

  it('expands one level only (no recursion into other aliases)', () => {
    expect(expandAliasArgv([...BIN, 'loop'], aliases)).toEqual({
      kind: 'argv',
      argv: [...BIN, 'loop', 'again'],
    });
  });
});

describe('alias name validation', () => {
  it('accepts letters, digits, dash, underscore', () => {
    expect(isValidAliasName('co')).toBe(true);
    expect(isValidAliasName('my-alias_2')).toBe(true);
  });

  it('rejects names that cannot be a command word', () => {
    expect(isValidAliasName('')).toBe(false);
    expect(isValidAliasName('2fast')).toBe(false);
    expect(isValidAliasName('has space')).toBe(false);
    expect(isValidAliasName('--flag')).toBe(false);
    expect(isValidAliasName('!bang')).toBe(false);
  });

  it('flags reserved built-in names', () => {
    expect(isReservedCommandName('pr')).toBe(true);
    expect(isReservedCommandName('co')).toBe(false);
  });

  it('detects shell aliases by the ! prefix', () => {
    expect(isShellAlias('!echo hi')).toBe(true);
    expect(isShellAlias('pr list')).toBe(false);
  });
});

describe('RESERVED_COMMAND_NAMES drift guard', () => {
  it('matches the live top-level Commander tree (plus implicit help)', () => {
    const liveNames = cli.commands.map((cmd) => cmd.name());
    expect([...RESERVED_COMMAND_NAMES].sort()).toEqual(
      [...new Set([...liveNames, 'help'])].sort()
    );
  });
});
