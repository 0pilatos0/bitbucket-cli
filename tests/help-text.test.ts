/**
 * Tests for the help text builder utility.
 */

import { describe, it, expect } from 'bun:test';
import { createHelpTextBuilder } from '../src/help-text.js';

const buildHelpText = createHelpTextBuilder(true);

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

describe('buildHelpText with color', () => {
  const buildColoredHelpText = createHelpTextBuilder(false);

  // ANSI escape code prefix
  const ESC = '\x1b[';

  it('should apply bold to section headers', () => {
    const result = buildColoredHelpText({ examples: ['bb test'] });
    // Bold ANSI: \x1b[1m
    expect(result).toContain(`${ESC}1mExamples:`);
  });

  it('should apply dim to example $ prefix', () => {
    const result = buildColoredHelpText({ examples: ['bb test'] });
    // Dim ANSI: \x1b[2m
    expect(result).toContain(`${ESC}2m$`);
  });

  it('should apply cyan to valid values', () => {
    const result = buildColoredHelpText({
      validValues: { States: ['OPEN', 'MERGED'] },
    });
    // Cyan ANSI: \x1b[36m
    expect(result).toContain(`${ESC}36mOPEN, MERGED`);
  });

  it('should apply bold to default flag names', () => {
    const result = buildColoredHelpText({
      defaults: { state: 'OPEN' },
    });
    expect(result).toContain(`${ESC}1m--state`);
  });

  it('should apply cyan to default values', () => {
    const result = buildColoredHelpText({
      defaults: { state: 'OPEN' },
    });
    expect(result).toContain(`${ESC}36mOPEN`);
  });

  it('should apply bold to env var names', () => {
    const result = buildColoredHelpText({
      envVars: { BB_TOKEN: 'API token' },
    });
    expect(result).toContain(`${ESC}1mBB_TOKEN`);
  });

  it('should apply dim to env var descriptions', () => {
    const result = buildColoredHelpText({
      envVars: { BB_TOKEN: 'API token' },
    });
    expect(result).toContain(`${ESC}2mAPI token`);
  });

  it('should produce no ANSI codes when noColor is true', () => {
    const result = buildHelpText({
      examples: ['bb test'],
      validValues: { States: ['OPEN'] },
      defaults: { limit: '25' },
      envVars: { BB_TOKEN: 'token' },
    });
    expect(result).not.toContain(ESC);
  });
});
