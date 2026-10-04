import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import pkg from '../../package.json' with { type: 'json' };
import { AgentInstructionsCommand } from '../../src/commands/agent-instructions.command.js';
import { createMockOutputService } from '../setup.js';

const repoRoot = resolve(import.meta.dir, '../..');
const instructions = readFileSync(
  resolve(repoRoot, 'src/agent-instructions.md'),
  'utf8'
);

describe('AgentInstructionsCommand', () => {
  it('prints the bundled instructions as text', async () => {
    const output = createMockOutputService();

    await new AgentInstructionsCommand(output).run(undefined, {
      globalOptions: {},
    });

    expect(output.logs).toEqual([`text:${instructions.trimEnd()}`]);
  });

  it('pairs the instructions with the installed version in JSON', async () => {
    const output = createMockOutputService();

    await new AgentInstructionsCommand(output).run(undefined, {
      globalOptions: { json: true },
    });

    expect(output.logs).toEqual([
      `json:${JSON.stringify({ version: pkg.version, instructions })}`,
    ]);
  });

  it('is the same file the AI agents guide renders', () => {
    const guidePath = resolve(
      repoRoot,
      'docs/src/content/docs/guides/ai-agents.mdx'
    );
    const guide = readFileSync(guidePath, 'utf8');
    const source = /^import instructions from '([^']+)\?raw';$/m.exec(guide);

    expect(source).not.toBeNull();
    expect(resolve(dirname(guidePath), source![1]!)).toBe(
      resolve(repoRoot, 'src/agent-instructions.md')
    );
    expect(guide).toContain('<Code code={instructions} lang="markdown" />');
  });
});
