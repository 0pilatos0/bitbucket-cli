/**
 * Interactive terminal prompts on `node:readline`.
 *
 * Each question opens and closes its own readline interface so stdin is
 * released (and raw mode restored) between prompts and after the last one;
 * a long-lived interface would keep the process alive. Ctrl+C and Ctrl+D
 * close the interface mid-question, which rejects with `PROMPT_CANCELLED`.
 */

import { createInterface } from 'node:readline';
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

export class PromptService implements IPromptService {
  private readonly input: PromptInput;
  private readonly output: PromptOutput;
  private readonly env: NodeJS.ProcessEnv;

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
    // Readline echoes keystrokes through its output stream, so a masked
    // question swaps in a sink that drops everything after the query.
    let muted = false;
    const output = mask
      ? new Writable({
          write: (chunk, _encoding, callback) => {
            if (!muted) this.output.write(chunk);
            callback();
          },
        })
      : this.output;

    const rl = createInterface({ input: this.input, output, terminal: true });

    return new Promise((resolve, reject) => {
      let answered = false;

      rl.once('close', () => {
        if (answered) return;
        this.output.write('\n');
        reject(
          new BBError({
            code: ErrorCode.PROMPT_CANCELLED,
            message: 'Prompt cancelled.',
          })
        );
      });

      rl.question(query, (answer) => {
        answered = true;
        if (mask) this.output.write('\n');
        rl.close();
        resolve(answer);
      });
      muted = mask;
    });
  }
}
