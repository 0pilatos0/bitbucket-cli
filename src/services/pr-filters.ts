/**
 * BBQL helpers for filtering pull requests server-side via the `q` parameter.
 */

export const CURRENT_USER = '@me';

export function bbqlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
