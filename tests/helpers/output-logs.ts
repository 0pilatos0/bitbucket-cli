/**
 * Readers for the log lines `createMockOutputService()` records.
 */

/** Rows passed to the first `output.table()` call, or `[]`. */
export function getTableRows(logs: string[]): string[][] {
  const rowsLog = logs.find((log) => log.startsWith('table-rows:'));
  return rowsLog
    ? (JSON.parse(rowsLog.substring('table-rows:'.length)) as string[][])
    : [];
}

/** Payload passed to `output.json()`; throws when nothing was emitted. */
export function getJsonPayload(logs: string[]): Record<string, unknown> {
  const jsonLog = logs.find((log) => log.startsWith('json:'));
  if (jsonLog === undefined) {
    throw new Error('Expected output.json() to have been called');
  }
  return JSON.parse(jsonLog.substring('json:'.length)) as Record<
    string,
    unknown
  >;
}
