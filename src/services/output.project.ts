/**
 * Field projection for `--json fields` output.
 *
 * Mirrors gh CLI's behavior: a comma-separated list of fields produces an
 * object whose keys are the field names. Dotted paths (e.g. `author.display_name`)
 * traverse nested objects; missing intermediate keys yield null. Top-level
 * field names — not dotted segments — are used verbatim as output keys, so
 * `author.display_name` becomes `{"author.display_name": "..."}` in the
 * projected result. This matches gh's flat-object output shape.
 */
export function projectFields(item: unknown, fields: string[]): unknown {
  if (item === null || typeof item !== 'object') {
    return item;
  }

  const result: Record<string, unknown> = {};
  for (const field of fields) {
    result[field] = deepGet(item as Record<string, unknown>, field);
  }
  return result;
}

function deepGet(source: Record<string, unknown>, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = source;
  for (const segment of segments) {
    if (current === null || current === undefined) {
      return null;
    }
    if (typeof current !== 'object') {
      return null;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current === undefined ? null : current;
}
