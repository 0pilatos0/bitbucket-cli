/**
 * BBQL helpers for filtering pull requests server-side via the `q` parameter.
 */

export const CURRENT_USER = '@me';

export function bbqlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// Bitbucket ignores the `state` parameter once `q` is set, so a query has to
// carry the state itself.
export function withState(query: string, state: string): string {
  return `state=${bbqlString(state)} AND (${query})`;
}
