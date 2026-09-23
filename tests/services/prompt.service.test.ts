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
    // Lets the pending question open before the keystrokes arrive.
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

describe('PromptService buffered input', () => {
  it('keeps every line of a single chunk for the following questions', async () => {
    const { terminal, service } = createInteractive();
    const first = service.text('Title');
    await terminal.type('a\rb\r');
    expect(await first).toBe('a');
    expect(await service.text('Description')).toBe('b');
    expect(terminal.written()).toContain('Description: b\n');
  });

  it('never echoes a typed-ahead secret and still shows its question', async () => {
    const { terminal, service } = createInteractive();
    const user = service.text('User');
    await terminal.type('alice\rhunter2\r');
    expect(await user).toBe('alice');
    expect(await service.secret('Token')).toBe('hunter2');
    expect(terminal.written()).toContain('Token: \n');
    expect(terminal.written()).not.toContain('hunter2');
  });

  it('hides a partly typed-ahead secret when its question opens', async () => {
    const { terminal, service } = createInteractive();
    const user = service.text('User');
    await terminal.type('alice\rhun');
    expect(await user).toBe('alice');
    const token = service.secret('Token');
    await terminal.type('ter2\r');
    expect(await token).toBe('hunter2');
    expect(terminal.written()).toContain('Token: ');
    expect(terminal.written()).not.toContain('hun');
  });

  it('releases stdin once no question follows', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.text('Title');
    await terminal.type('a\r');
    expect(await answer).toBe('a');
    await new Promise((resolve) => setImmediate(resolve));
    expect(terminal.input.listenerCount('keypress')).toBe(0);
  });

  it('opens a fresh interface for a later question', async () => {
    const { terminal, service } = createInteractive();
    const first = service.text('Title');
    await terminal.type('a\r');
    expect(await first).toBe('a');
    await new Promise((resolve) => setImmediate(resolve));

    const second = service.text('Description');
    await terminal.type('b\r');
    expect(await second).toBe('b');
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

  it('rejects with an interrupted PROMPT_CANCELLED on Ctrl+C', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.text('Title', { required: true });
    await terminal.type('\x03');
    await expectCancelled(answer);
    expect(
      ((await answer.catch((e: unknown) => e)) as BBError).context
    ).toEqual({ interrupted: true });
  });

  it('rejects with PROMPT_CANCELLED on Ctrl+D', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.confirm('Continue?');
    await terminal.type('\x04');
    await expectCancelled(answer);
    expect(
      ((await answer.catch((e: unknown) => e)) as BBError).context
    ).toBeUndefined();
  });

  it('rejects with PROMPT_CANCELLED when stdin ends', async () => {
    const { terminal, service } = createInteractive();
    const answer = service.secret('API token');
    await new Promise((resolve) => setImmediate(resolve));
    terminal.input.end();
    await expectCancelled(answer);
  });
});
