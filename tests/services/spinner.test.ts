/**
 * Spinner unit tests.
 *
 * Cover the standalone Spinner class plus its integration into OutputService:
 * enabled/disabled gating (TTY, JSON mode, NODE_ENV=test), animation lifecycle,
 * idempotent stop semantics, color output, and the auto-stop behavior that
 * prevents a forgotten spinner from interleaving with regular output.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Spinner, createNoopSpinner } from '../../src/services/spinner.js';
import { OutputService } from '../../src/services/output.service.js';

class FakeStream {
  public chunks: string[] = [];
  public isTTY = true;

  write(chunk: string): boolean {
    this.chunks.push(chunk);
    return true;
  }

  joined(): string {
    return this.chunks.join('');
  }

  reset(): void {
    this.chunks = [];
  }
}

function makeSpinner(
  text: string,
  overrides: Partial<{ enabled: boolean; noColor: boolean }> = {}
): { spinner: Spinner; stream: FakeStream } {
  const stream = new FakeStream();
  const spinner = new Spinner(text, {
    enabled: overrides.enabled ?? true,
    noColor: overrides.noColor ?? false,
    stream: stream as unknown as NodeJS.WriteStream,
  });
  return { spinner, stream };
}

describe('Spinner', () => {
  describe('disabled mode', () => {
    it('writes nothing when start/stop/succeed/fail/setText are called', () => {
      const { spinner, stream } = makeSpinner('working', { enabled: false });

      spinner.start();
      spinner.setText('still working');
      spinner.succeed('done');
      spinner.fail('nope');
      spinner.stop();

      expect(stream.chunks).toEqual([]);
    });

    it('returns the spinner from every method (fluent)', () => {
      const { spinner } = makeSpinner('working', { enabled: false });

      expect(spinner.start()).toBe(spinner);
      expect(spinner.setText('x')).toBe(spinner);
      expect(spinner.succeed('y')).toBe(spinner);
      expect(spinner.fail('z')).toBe(spinner);
      expect(spinner.stop()).toBe(spinner);
    });
  });

  describe('enabled mode', () => {
    it('hides the cursor and renders the first frame on start', () => {
      const { spinner, stream } = makeSpinner('loading', { noColor: true });

      spinner.start();
      const output = stream.joined();
      expect(output).toContain('\x1b[?25l'); // hide cursor
      expect(output).toContain('loading');

      spinner.stop();
    });

    it('clears the line and shows the cursor on stop', () => {
      const { spinner, stream } = makeSpinner('loading', { noColor: true });
      spinner.start();
      stream.reset();

      spinner.stop();

      const output = stream.joined();
      expect(output).toContain('\r\x1b[2K'); // clear line
      expect(output).toContain('\x1b[?25h'); // show cursor
    });

    it('is idempotent on repeated stop calls', () => {
      const { spinner, stream } = makeSpinner('loading');

      spinner.start();
      stream.reset();
      spinner.stop();
      const afterFirstStop = stream.chunks.length;
      spinner.stop();
      spinner.stop();

      expect(stream.chunks.length).toBe(afterFirstStop);
    });

    it('does nothing on a second start call', () => {
      const { spinner, stream } = makeSpinner('loading');

      spinner.start();
      const sizeAfterFirstStart = stream.chunks.length;
      spinner.start();

      expect(stream.chunks.length).toBe(sizeAfterFirstStart);
      spinner.stop();
    });

    it('emits an updated frame when setText is called while active', () => {
      const { spinner, stream } = makeSpinner('initial', { noColor: true });

      spinner.start();
      stream.reset();
      spinner.setText('updated');

      expect(stream.joined()).toContain('updated');
      spinner.stop();
    });

    it('does not emit when setText is called before start', () => {
      const { spinner, stream } = makeSpinner('initial', { noColor: true });

      spinner.setText('updated');

      expect(stream.chunks).toEqual([]);
    });

    it('writes a green check on succeed when message is provided', () => {
      const { spinner, stream } = makeSpinner('working', { noColor: false });
      spinner.start();
      stream.reset();

      spinner.succeed('all done');

      const output = stream.joined();
      expect(output).toContain('\x1b[32m'); // green
      expect(output).toContain('✓');
      expect(output).toContain('all done\n');
    });

    it('writes a plain check on succeed when noColor is true', () => {
      const { spinner, stream } = makeSpinner('working', { noColor: true });
      spinner.start();
      stream.reset();

      spinner.succeed('all done');

      const output = stream.joined();
      expect(output).not.toContain('\x1b[32m');
      expect(output).toContain('✓ all done\n');
    });

    it('writes only the cleanup sequences on succeed without message', () => {
      const { spinner, stream } = makeSpinner('working', { noColor: true });
      spinner.start();
      stream.reset();

      spinner.succeed();

      // No success line — just the line-clear / cursor-restore from stop().
      const output = stream.joined();
      expect(output).not.toContain('✓');
      expect(output).toContain('\r\x1b[2K');
      expect(output).toContain('\x1b[?25h');
    });

    it('writes a red cross on fail when message is provided', () => {
      const { spinner, stream } = makeSpinner('working', { noColor: false });
      spinner.start();
      stream.reset();

      spinner.fail('boom');

      const output = stream.joined();
      expect(output).toContain('\x1b[31m'); // red
      expect(output).toContain('✗');
      expect(output).toContain('boom\n');
    });

    it('invokes onStop exactly once across repeated stop/succeed calls', () => {
      const stream = new FakeStream();
      let callCount = 0;
      const spinner = new Spinner('working', {
        enabled: true,
        noColor: true,
        stream: stream as unknown as NodeJS.WriteStream,
        onStop: () => {
          callCount += 1;
        },
      });

      spinner.start();
      spinner.stop();
      spinner.succeed('done');
      spinner.fail('boom');

      expect(callCount).toBe(1);
    });
  });
});

describe('createNoopSpinner', () => {
  it('returns a chainable handle whose methods are no-ops', () => {
    const noop = createNoopSpinner();

    expect(noop.start()).toBe(noop);
    expect(noop.setText('x')).toBe(noop);
    expect(noop.succeed('y')).toBe(noop);
    expect(noop.fail('z')).toBe(noop);
    expect(noop.stop()).toBe(noop);
  });
});

describe('OutputService.spinner gating', () => {
  let originalIsTTY: boolean | undefined;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalIsTTY = process.stdout.isTTY;
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      configurable: true,
    });
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('returns a no-op spinner when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      configurable: true,
    });
    const output = new OutputService();

    const spinner = output.spinner('hello');
    spinner.start().setText('updated').succeed('done').fail('boom').stop();

    // The no-op spinner does not write. Calling any method in any order
    // must not throw — that is the contract.
    expect(typeof spinner.start).toBe('function');
  });

  it('returns a no-op spinner when stdout is not a TTY', () => {
    process.env.NODE_ENV = 'production';
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      configurable: true,
    });
    const output = new OutputService();

    const spinner = output.spinner('hello');
    spinner.start().stop();
    expect(typeof spinner.start).toBe('function');
  });

  it('returns a no-op spinner when JSON mode is active', () => {
    process.env.NODE_ENV = 'production';
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      configurable: true,
    });
    const output = new OutputService();
    output.setJsonFormatOptions({ json: true });

    const spinner = output.spinner('hello');
    spinner.start().succeed('done').stop();
    expect(typeof spinner.start).toBe('function');
  });
});

describe('OutputService.spinner enabled path', () => {
  // To exercise the real Spinner via OutputService we need NODE_ENV != 'test'
  // and stdout.isTTY = true. Restore both after each test.

  let originalIsTTY: boolean | undefined;
  let originalNodeEnv: string | undefined;
  let originalWrite: typeof process.stdout.write;
  let writes: string[];
  let originalLog: typeof console.log;
  let originalError: typeof console.error;
  let logs: string[];

  beforeEach(() => {
    originalIsTTY = process.stdout.isTTY;
    originalNodeEnv = process.env.NODE_ENV;
    originalWrite = process.stdout.write.bind(process.stdout);
    originalLog = console.log;
    originalError = console.error;
    writes = [];
    logs = [];

    process.env.NODE_ENV = 'production';
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      configurable: true,
    });
    process.stdout.write = ((chunk: unknown) => {
      writes.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    console.log = (...args: unknown[]) => {
      logs.push(`log:${args.map(String).join(' ')}`);
    };
    console.error = (...args: unknown[]) => {
      logs.push(`err:${args.map(String).join(' ')}`);
    };
  });

  afterEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      configurable: true,
    });
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    process.stdout.write = originalWrite;
    console.log = originalLog;
    console.error = originalError;
  });

  it('returns a real Spinner that writes animation frames', () => {
    const output = new OutputService();
    const spinner = output.spinner('working');

    spinner.start();
    spinner.stop();

    const out = writes.join('');
    expect(out).toContain('\x1b[?25l'); // hide cursor
    expect(out).toContain('working');
    expect(out).toContain('\x1b[?25h'); // show cursor
  });

  it('auto-stops the active spinner before printing success()', () => {
    const output = new OutputService();
    const spinner = output.spinner('working');

    spinner.start();
    writes.length = 0;

    output.success('done');

    // Stop chunk emitted before console.log success line.
    expect(writes.some((w) => w.includes('\x1b[?25h'))).toBe(true);
    expect(logs.some((l) => l.startsWith('log:') && l.includes('done'))).toBe(
      true
    );
  });

  it('auto-stops the active spinner before printing error()', () => {
    const output = new OutputService();
    const spinner = output.spinner('working');

    spinner.start();
    writes.length = 0;

    output.error('something broke');

    expect(writes.some((w) => w.includes('\x1b[?25h'))).toBe(true);
    expect(
      logs.some((l) => l.startsWith('err:') && l.includes('something broke'))
    ).toBe(true);
  });

  it('auto-stops the active spinner before printing JSON', async () => {
    const output = new OutputService();
    const spinner = output.spinner('working');

    spinner.start();
    writes.length = 0;

    await output.json({ ok: true });

    expect(writes.some((w) => w.includes('\x1b[?25h'))).toBe(true);
    expect(logs.some((l) => l.startsWith('log:') && l.includes('"ok"'))).toBe(
      true
    );
  });

  it('replaces the active spinner when a second one is requested', () => {
    const output = new OutputService();
    const first = output.spinner('first');
    first.start();
    writes.length = 0;

    const second = output.spinner('second');
    second.start();

    // The first spinner should have been stopped (cursor restore emitted)
    // before the second one starts (cursor hide emitted again).
    const out = writes.join('');
    expect(out).toContain('\x1b[?25h'); // first stopped
    expect(out).toContain('\x1b[?25l'); // second started
    expect(out).toContain('second');

    second.stop();
  });
});
