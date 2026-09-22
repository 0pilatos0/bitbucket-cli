import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  installCompletion,
  renderCompletionScript,
} from '../src/completion-install.js';

const TARGET = { name: 'bb', completer: 'bb' };

describe('renderCompletionScript', () => {
  it.each([
    ['bash', 'complete -o default -F _bb_completion bb'],
    ['zsh', 'compdef _bb_completion bb'],
    ['fish', "complete -f -d 'bb' -c bb"],
  ])('renders the %s template for bb', (shell, registration) => {
    const script = renderCompletionScript(shell, TARGET);

    expect(script).toContain('###-begin-bb-completion-###');
    expect(script).toContain('bb completion --');
    expect(script).toContain(registration);
    expect(script).not.toMatch(/\{pkgname\}|\{completer\}/);
  });

  it('falls back to the bash template for an unknown shell', () => {
    expect(renderCompletionScript('tcsh', TARGET)).toBe(
      renderCompletionScript('bash', TARGET)
    );
  });
});

describe('installCompletion', () => {
  const originalShell = process.env.SHELL;
  let homeDir = '';
  let writeToShellConfig: ReturnType<typeof mock>;
  let writeToTabtabScript: ReturnType<typeof mock>;

  beforeEach(async () => {
    homeDir = await mkdtemp(join(tmpdir(), 'bb-completion-'));
    writeToShellConfig = mock(() => Promise.resolve());
    writeToTabtabScript = mock(() => Promise.resolve());
    mock.module('tabtab/lib/prompt', () => ({
      default: () => Promise.resolve({ location: '~/.zshrc', shell: 'zsh' }),
    }));
    mock.module('tabtab/lib/installer', () => ({
      writeToShellConfig,
      writeToTabtabScript,
    }));
  });

  afterEach(async () => {
    if (originalShell === undefined) {
      delete process.env.SHELL;
    } else {
      process.env.SHELL = originalShell;
    }
    await rm(homeDir, { recursive: true, force: true });
  });

  it('writes the embedded template named after $SHELL', async () => {
    process.env.SHELL = '/bin/zsh';

    await installCompletion(TARGET, homeDir);

    const script = await readFile(
      join(homeDir, '.config', 'tabtab', 'bb.zsh'),
      'utf8'
    );
    expect(script).toBe(renderCompletionScript('zsh', TARGET));
    expect(writeToShellConfig).toHaveBeenCalledWith({
      location: '~/.zshrc',
      name: 'bb',
    });
    expect(writeToTabtabScript).toHaveBeenCalledWith({ name: 'bb' });
  });
});
