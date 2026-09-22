import { describe, it, expect } from 'bun:test';
import { PassThrough, Writable } from 'node:stream';
import { PromptService } from '../../src/services/prompt.service.js';
import { BBError, ErrorCode } from '../../src/types/errors.js';

function createTerminal(options: { inputTTY?: boolean; outputTTY?: boolean }) {
  const input = new PassThrough() as PassThrough & { isTTY?: boolean };
  input.isTTY = options.inputTTY;

  let written = '';
  const output = new Writable({
    write(chunk, _encoding, callback) {
      written += chunk.toString();
      callback();
    },
  }) as Writable & { isTTY?: boolean };
  output.isTTY = options.outputTTY;

  return {
    input,
    output,
    written: () => written,
    // Each question opens its own readline interface, so keystrokes must
    // arrive after the previous answer resolved and the next question opened.
    async type(keys: string) {
      await new Promise((resolve) => setImmediate(resolve));
      input.write(keys);
    },
  };
}

function createInteractive(env: NodeJS.ProcessEnv = {}) {
  const terminal = createTerminal({ inputTTY: true, outputTTY: true });
  const service = new PromptService({
    input: terminal.input,
    output: terminal.output,
    env,
  });
  return { terminal, service };
}

describe('PromptService.isAvailable', () => {
  it('is true when stdin and stdout are both TTYs', () => {
    expect(createInteractive().service.isAvailable()).toBe(true);
  });

  it.each([
    ['stdin is piped', { inputTTY: false, outputTTY: true }],
    ['stdout is piped', { inputTTY: true, outputTTY: false }],
    ['neither is a TTY', { inputTTY: undefined, outputTTY: undefined }],
  ])('is false when %s', (_label, ttys) => {
    const terminal = createTerminal(ttys);
    const service = new PromptService({
      input: terminal.input,
      output: terminal.output,
      env: {},
    });
    expect(service.isAvailable()).toBe(false);
  });

  it('is false when BB_PROMPT_DISABLED is set to any non-empty value', () => {
    for (const value of ['1', 'true', '0']) {
      const { service } = createInteractive({ BB_PROMPT_DISABLED: value });
      expect(service.isAvailable()).toBe(false);
    }
  });

  it('ignores an empty BB_PROMPT_DISABLED', () => {
    const { service } = createInteractive({ BB_PROMPT_DISABLED: '' });
    expect(service.isAvailable()).toBe(true);
  });
});

describe('PromptService.confirm', () => {
  it.each([
    ['y', true],
    ['Y', true],
    ['yes', true],
    ['YES', true],
    ['n', false],
    ['', false],
    ['yep', false],
  ])('answers %p as %p', async (keys, expected) => {
    const { terminal, service } = createInteractive();
    const answer = service.confirm('Continue?');
    await terminal.type(`${keys}\r`);
    expect(await answer).toBe(expected);
    expect(terminal.written()).toContain('Continue? (y/N) ');
  });
});

describe('PromptService.text', () => {
  it('returns the trimmed answer', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.text('Title');
    await terminal.type('  Fix the bug  \r');
    expect(await answer).toBe('Fix the bug');
    expect(terminal.written()).toContain('Title: ');
  });

  it('accepts an empty answer when not required', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.text('Description (optional)');
    await terminal.type('\r');
    expect(await answer).toBe('');
  });

  it('re-asks until a required answer is non-empty', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.text('Title', { required: true });
    await terminal.type('\r');
    await terminal.type('   \r');
    await terminal.type('Real title\r');
    expect(await answer).toBe('Real title');
    expect(terminal.written().match(/Title: /g)?.length).toBe(3);
  });
});

describe('PromptService.secret', () => {
  it('returns the typed value without echoing it', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.secret('API token');
    await terminal.type('s3cr3t-token\r');
    expect(await answer).toBe('s3cr3t-token');
    expect(terminal.written()).toContain('API token: ');
    expect(terminal.written()).not.toContain('s3cr3t');
  });
});

describe('PromptService.select', () => {
  const choices = [
    { value: 'oauth', label: 'Browser' },
    { value: 'api_token', label: 'API token' },
  ] as const;

  it('lists the choices and returns the picked value', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.select('How?', choices);
    await terminal.type('2\r');
    expect(await answer).toBe('api_token');
    expect(terminal.written()).toContain(
      'How?\n  1) Browser\n  2) API token\n'
    );
    expect(terminal.written()).toContain('Choose 1-2 [1]: ');
  });

  it('picks the first choice on an empty answer', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.select('How?', choices);
    await terminal.type('\r');
    expect(await answer).toBe('oauth');
  });

  it('re-asks on an out-of-range or non-numeric answer', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.select('How?', choices);
    await terminal.type('3\r');
    await terminal.type('1x\r');
    await terminal.type('0\r');
    await terminal.type('1\r');
    expect(await answer).toBe('oauth');
    expect(terminal.written().match(/Choose 1-2/g)?.length).toBe(4);
  });

  it('throws on an empty choice list', async () => {
    const { service } = createInteractive();
    await expect(service.select('How?', [])).rejects.toThrow(
      'requires at least one choice'
    );
  });
});

describe('PromptService cancellation', () => {
  async function expectCancelled(promise: Promise<unknown>): Promise<void> {
    const error = await promise.then(
      () => undefined,
      (e: unknown) => e
    );
    expect(error).toBeInstanceOf(BBError);
    expect((error as BBError).code).toBe(ErrorCode.PROMPT_CANCELLED);
  }

  it('rejects with PROMPT_CANCELLED on Ctrl+C', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.text('Title', { required: true });
    await terminal.type('\x03');
    await expectCancelled(answer);
  });

  it('rejects with PROMPT_CANCELLED on Ctrl+D', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.confirm('Continue?');
    await terminal.type('\x04');
    await expectCancelled(answer);
  });

  it('rejects with PROMPT_CANCELLED when stdin ends', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.secret('API token');
    await new Promise((resolve) => setImmediate(resolve));
    terminal.input.end();
    await expectCancelled(answer);
  });
});
