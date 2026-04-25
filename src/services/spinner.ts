/**
 * Lightweight terminal spinner for long-running operations.
 *
 * Auto-disables when output cannot animate cleanly: non-TTY streams (pipes,
 * redirects, CI), `--json` mode (would corrupt machine-readable output), and
 * during tests. All public methods are safe no-ops in those modes so callers
 * can instrument commands without branching on environment.
 */

import type { ISpinner } from '../core/interfaces/services.js';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const FRAME_INTERVAL_MS = 80;

const ESC = '\x1b';
const CLEAR_LINE = `\r${ESC}[2K`;
const HIDE_CURSOR = `${ESC}[?25l`;
const SHOW_CURSOR = `${ESC}[?25h`;
const COLOR_CYAN = `${ESC}[36m`;
const COLOR_GREEN = `${ESC}[32m`;
const COLOR_RED = `${ESC}[31m`;
const COLOR_RESET = `${ESC}[0m`;

export interface SpinnerOptions {
  /** When false, every method is a no-op. */
  enabled: boolean;
  noColor: boolean;
  stream: NodeJS.WriteStream;
  /** Notifies the owner that the spinner has stopped (used to clear refs). */
  onStop?: () => void;
}

export class Spinner implements ISpinner {
  private text: string;
  private readonly enabled: boolean;
  private readonly noColor: boolean;
  private readonly stream: NodeJS.WriteStream;
  private onStop?: () => void;

  private timer: ReturnType<typeof setInterval> | null = null;
  private frameIndex = 0;
  private active = false;
  private exitHandler: (() => void) | null = null;

  constructor(text: string, options: SpinnerOptions) {
    this.text = text;
    this.enabled = options.enabled;
    this.noColor = options.noColor;
    this.stream = options.stream;
    this.onStop = options.onStop;
  }

  public start(): this {
    if (!this.enabled || this.active) {
      return this;
    }
    this.active = true;
    this.stream.write(HIDE_CURSOR);
    this.render();
    this.timer = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % FRAMES.length;
      this.render();
    }, FRAME_INTERVAL_MS);
    // Don't keep the event loop alive for the spinner alone.
    this.timer.unref?.();

    // Best-effort cursor restore if the process is interrupted while spinning.
    this.exitHandler = () => {
      if (this.active) {
        this.active = false;
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
        this.stream.write(`${CLEAR_LINE}${SHOW_CURSOR}`);
      }
    };
    process.once('SIGINT', this.exitHandler);
    process.once('SIGTERM', this.exitHandler);
    process.once('exit', this.exitHandler);
    return this;
  }

  public stop(): this {
    if (!this.active) {
      return this.detach();
    }
    this.active = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.stream.write(`${CLEAR_LINE}${SHOW_CURSOR}`);
    return this.detach();
  }

  public succeed(message?: string): this {
    this.stop();
    if (this.enabled && message) {
      const symbol = this.colorize('✓', COLOR_GREEN);
      this.stream.write(`${symbol} ${message}\n`);
    }
    return this;
  }

  public fail(message?: string): this {
    this.stop();
    if (this.enabled && message) {
      const symbol = this.colorize('✗', COLOR_RED);
      this.stream.write(`${symbol} ${message}\n`);
    }
    return this;
  }

  public setText(text: string): this {
    this.text = text;
    if (this.active) {
      this.render();
    }
    return this;
  }

  private render(): void {
    if (!this.active) return;
    const frame = FRAMES[this.frameIndex] ?? FRAMES[0]!;
    const symbol = this.colorize(frame, COLOR_CYAN);
    this.stream.write(`${CLEAR_LINE}${symbol} ${this.text}`);
  }

  private colorize(text: string, color: string): string {
    return this.noColor ? text : `${color}${text}${COLOR_RESET}`;
  }

  private detach(): this {
    if (this.exitHandler) {
      process.removeListener('SIGINT', this.exitHandler);
      process.removeListener('SIGTERM', this.exitHandler);
      process.removeListener('exit', this.exitHandler);
      this.exitHandler = null;
    }
    if (this.onStop) {
      const cb = this.onStop;
      // Clear before invoking to keep onStop idempotent across repeated stop() calls.
      this.onStop = undefined;
      cb();
    }
    return this;
  }
}

/**
 * Create a no-op spinner. Useful as a default and for environments where
 * animation is undesirable. All methods short-circuit and never write to the
 * stream.
 */
export function createNoopSpinner(): ISpinner {
  const noop: ISpinner = {
    start: () => noop,
    stop: () => noop,
    succeed: () => noop,
    fail: () => noop,
    setText: () => noop,
  };
  return noop;
}
