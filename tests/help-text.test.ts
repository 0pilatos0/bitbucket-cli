/**
 * Tests for the help text builder utility.
 */

import { describe, it, expect } from 'bun:test';
import { buildHelpText } from '../src/help-text.js';

describe('buildHelpText', () => {
  it('should render examples section', () => {
    const result = buildHelpText({
      examples: ['bb pr merge 42', 'bb pr merge 42 --strategy squash'],
    });

    expect(result).toContain('Examples:');
    expect(result).toContain('  $ bb pr merge 42');
    expect(result).toContain('  $ bb pr merge 42 --strategy squash');
  });

  it('should render valid values section', () => {
    const result = buildHelpText({
      validValues: {
        'Merge strategies': ['merge_commit', 'squash', 'fast_forward'],
      },
    });

    expect(result).toContain('Merge strategies:');
    expect(result).toContain('  merge_commit, squash, fast_forward');
  });

  it('should render multiple valid value groups', () => {
    const result = buildHelpText({
      validValues: {
        States: ['OPEN', 'MERGED'],
        Strategies: ['squash', 'merge_commit'],
      },
    });

    expect(result).toContain('States:');
    expect(result).toContain('  OPEN, MERGED');
    expect(result).toContain('Strategies:');
    expect(result).toContain('  squash, merge_commit');
  });

  it('should render defaults section', () => {
    const result = buildHelpText({
      defaults: {
        state: 'OPEN',
        limit: '25',
      },
    });

    expect(result).toContain('Defaults:');
    expect(result).toContain('  --state  OPEN');
    expect(result).toContain('  --limit  25');
  });

  it('should render env vars section with aligned names', () => {
    const result = buildHelpText({
      envVars: {
        BB_USERNAME: 'Bitbucket username',
        BB_API_TOKEN: 'Bitbucket API token',
      },
    });

    expect(result).toContain('Environment variables:');
    expect(result).toContain('  BB_USERNAME   Bitbucket username');
    expect(result).toContain('  BB_API_TOKEN  Bitbucket API token');
  });

  it('should render all sections together in order', () => {
    const result = buildHelpText({
      examples: ['bb auth login -u user -p token'],
      defaults: { limit: '25' },
      envVars: { BB_USERNAME: 'Username fallback' },
    });

    const examplesIndex = result.indexOf('Examples:');
    const defaultsIndex = result.indexOf('Defaults:');
    const envVarsIndex = result.indexOf('Environment variables:');

    expect(examplesIndex).toBeGreaterThan(-1);
    expect(defaultsIndex).toBeGreaterThan(examplesIndex);
    expect(envVarsIndex).toBeGreaterThan(defaultsIndex);
  });

  it('should always start with newline', () => {
    const result = buildHelpText({ examples: ['bb test'] });
    expect(result.startsWith('\n')).toBe(true);
  });

  it('should always end with newline', () => {
    const result = buildHelpText({ examples: ['bb test'] });
    expect(result.endsWith('\n')).toBe(true);
  });

  it('should handle empty config', () => {
    const result = buildHelpText({});
    expect(result).toBe('\n\n');
  });

  it('should separate sections with blank lines', () => {
    const result = buildHelpText({
      examples: ['bb test'],
      validValues: { Types: ['a', 'b'] },
    });

    const lines = result.split('\n');
    const examplesLine = lines.findIndex((l) => l === 'Examples:');
    const typesLine = lines.findIndex((l) => l === 'Types:');

    // There should be a blank line between the last example and the valid values header
    expect(lines[typesLine - 1]).toBe('');
  });
});
