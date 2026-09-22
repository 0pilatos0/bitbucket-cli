/**
 * Interactive terminal prompts on `node:readline`.
 *
 * Consecutive questions share one readline interface, and every line it reads
 * is queued, so a pasted or typed-ahead answer for the next question is kept
 * rather than dropped with a closed interface. The interface closes as soon as
 * the command stops asking (on the next event-loop turn), which restores the
 * terminal's raw mode so Ctrl+C interrupts network calls as usual and the
 * process can exit.
 */

import { createInterface, type Interface } from 'node:readline';
import { Writable } from 'node:stream';
import type {
  IPromptService,
  PromptChoice,
} from '../core/interfaces/services.js';
import { BBError, ErrorCode } from '../types/errors.js';

type PromptInput = NodeJS.ReadableStream & { isTTY?: boolean };
type PromptOutput = NodeJS.WritableStream & { isTTY?: boolean };

export interface PromptServiceOptions {
  input?: PromptInput;
  output?: PromptOutput;
  env?: NodeJS.ProcessEnv;
}

interface PendingAnswer {
  resolve: (line: string) => void;
  reject: (error: BBError) => void;
}

export class PromptService implements IPromptService {
  private readonly input: PromptInput;
  private readonly output: PromptOutput;
  private readonly env: NodeJS.ProcessEnv;

  private rl?: Interface;
  private idleClose?: NodeJS.Immediate;
  private pending?: PendingAnswer;
  private readonly queuedLines: string[] = [];
  private muted = false;

  constructor(options: PromptServiceOptions = {}) {
    this.input = options.input ?? process.stdin;
    this.output = options.output ?? process.stdout;
    this.env = options.env ?? process.env;
  }

  public isAvailable(): boolean {
    const disabled = this.env.BB_PROMPT_DISABLED;
    return (
      this.input.isTTY === true &&
      this.output.isTTY === true &&
      (disabled === undefined || disabled === '')
    );
  }

  public async confirm(message: string): Promise<boolean> {
    const answer = await this.ask(`${message} (y/N) `);
    return /^y(es)?$/i.test(answer.trim());
  }

  public async text(
    message: string,
    options: { required?: boolean } = {}
  ): Promise<string> {
    for (;;) {
      const answer = (await this.ask(`${message}: `)).trim();
      if (answer !== '' || !options.required) {
        return answer;
      }
    }
  }

  public async secret(message: string): Promise<string> {
    return (await this.ask(`${message}: `, true)).trim();
  }

  public async select<T extends string>(
    message: string,
    choices: readonly PromptChoice<T>[]
  ): Promise<T> {
    const [first] = choices;
    if (!first) {
      throw new Error('PromptService.select() requires at least one choice');
    }

    const list = choices.map((choice, i) => `  ${i + 1}) ${choice.label}`);
    this.output.write(`${message}\n${list.join('\n')}\n`);

    for (;;) {
      const answer = (
        await this.ask(`Choose 1-${choices.length} [1]: `)
      ).trim();
      if (answer === '') {
        return first.value;
      }
      const index = Number.parseInt(answer, 10);
      const choice = String(index) === answer ? choices[index - 1] : undefined;
      if (choice) {
        return choice.value;
      }
    }
  }

  private ask(query: string, mask = false): Promise<string> {
    const queued = this.queuedLines.shift();
    if (queued !== undefined) {
      return Promise.resolve(queued);
    }

    const rl = this.openInterface();
    return new Promise((resolve, reject) => {
      this.pending = {
        resolve: (line) => {
          // Readline's end-of-line echo was swallowed while muted.
          if (mask) this.output.write('\n');
          resolve(line);
        },
        reject,
      };
      rl.setPrompt(query);
      rl.prompt();
      this.muted = mask;
    });
  }

  private openInterface(): Interface {
    if (this.idleClose) {
      clearImmediate(this.idleClose);
      this.idleClose = undefined;
    }
    if (this.rl) return this.rl;

    // Readline echoes keystrokes through its output stream; a masked
    // question mutes this sink after the query is written.
    const output = new Writable({
      write: (chunk, _encoding, callback) => {
        if (!this.muted) this.output.write(chunk);
        callback();
      },
    });
    const rl = createInterface({
      input: this.input,
      output,
      terminal: true,
      historySize: 0,
    });

    rl.on('line', (line) => {
      const pending = this.pending;
      if (!pending) {
        this.queuedLines.push(line);
        return;
      }
      this.pending = undefined;
      this.muted = false;
      this.idleClose = setImmediate(() => this.closeInterface());
      pending.resolve(line);
    });
    rl.on('SIGINT', () => this.cancel(true));
    rl.on('close', () => {
      this.rl = undefined;
      this.cancel(false);
    });

    this.rl = rl;
    return rl;
  }

  private closeInterface(): void {
    this.idleClose = undefined;
    this.rl?.close();
  }

  private cancel(interrupted: boolean): void {
    const pending = this.pending;
    this.pending = undefined;
    this.muted = false;
    if (pending) {
      this.output.write('\n');
      pending.reject(
        new BBError({
          code: ErrorCode.PROMPT_CANCELLED,
          message: 'Prompt cancelled.',
          ...(interrupted ? { context: { interrupted: true } } : {}),
        })
      );
    }
    this.rl?.close();
  }
}
