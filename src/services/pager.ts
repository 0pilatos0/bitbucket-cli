/**
 * Pager support for long human-readable output (`pr diff`, `pr view`,
 * `pipeline logs`). `OutputService.withPager()` decides when paging applies;
 * this module only resolves the command and runs it.
 */

const DEFAULT_PAGER = 'less -FRX';

/**
 * Turn the configured pager (`BB_PAGER`, falling back to `PAGER`) into an
 * argv. Unset means the default `less -FRX`; an empty value or `cat` turns
 * paging off. Arguments are split on whitespace, so a pager path containing
 * spaces is not supported.
 */
export function resolvePagerCommand(
  configured: string | undefined
): string[] | undefined {
  const command = (configured ?? DEFAULT_PAGER).trim();
  if (command === '' || command === 'cat') {
    return undefined;
  }
  return command.split(/\s+/);
}

/**
 * Pipe `text` through the pager and wait for the user to close it. Returns
 * false when the pager could not be started (e.g. no `less` on Windows) so the
 * caller can print the text directly instead.
 */
export async function runPager(
  command: string[],
  text: string
): Promise<boolean> {
  let pager: Bun.Subprocess<'pipe', 'inherit', 'inherit'>;
  try {
    pager = Bun.spawn(command, {
      stdin: 'pipe',
      stdout: 'inherit',
      stderr: 'inherit',
      // `PAGER=less` without flags would print color codes literally; give
      // less the same defaults as git does unless the user configured them.
      env: { ...process.env, LESS: process.env.LESS ?? 'FRX' },
    });
  } catch {
    return false;
  }

  // Ctrl+C belongs to the pager while it is open; exiting here would leave
  // it running with a half-restored terminal.
  const ignoreInterrupt = (): void => {};
  process.on('SIGINT', ignoreInterrupt);
  try {
    try {
      pager.stdin.write(text);
      await pager.stdin.end();
    } catch {
      // The user quit the pager before reading everything.
    }
    await pager.exited;
  } finally {
    process.off('SIGINT', ignoreInterrupt);
  }
  return true;
}
