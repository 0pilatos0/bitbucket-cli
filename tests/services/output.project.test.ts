import { describe, it, expect } from 'bun:test';
import { projectFields } from '../../src/services/output.project.js';

describe('projectFields', () => {
  it('returns top-level fields verbatim as keys', () => {
    const result = projectFields({ id: 1, title: 'hello', state: 'OPEN' }, [
      'id',
      'title',
    ]);
    expect(result).toEqual({ id: 1, title: 'hello' });
  });

  it('uses dotted paths to traverse nested objects', () => {
    const result = projectFields({ id: 1, author: { display_name: 'alice' } }, [
      'id',
      'author.display_name',
    ]);
    expect(result).toEqual({ id: 1, 'author.display_name': 'alice' });
  });

  it('returns null for missing fields', () => {
    const result = projectFields({ id: 1 }, ['id', 'missing', 'a.b.c']);
    expect(result).toEqual({ id: 1, missing: null, 'a.b.c': null });
  });

  it('returns null when traversing through a non-object', () => {
    const result = projectFields({ a: 'string' }, ['a.b']);
    expect(result).toEqual({ 'a.b': null });
  });

  it('returns the value unchanged for non-object inputs', () => {
    expect(projectFields('hello', ['x'])).toBe('hello');
    expect(projectFields(42, ['x'])).toBe(42);
    expect(projectFields(null, ['x'])).toBe(null);
  });

  it('preserves the order of fields as listed', () => {
    const result = projectFields({ c: 3, a: 1, b: 2 }, [
      'a',
      'b',
      'c',
    ]) as Record<string, unknown>;
    expect(Object.keys(result)).toEqual(['a', 'b', 'c']);
  });

  it('preserves arrays and objects at the leaf', () => {
    const result = projectFields(
      { id: 1, tags: ['x', 'y'], meta: { ok: true } },
      ['tags', 'meta']
    );
    expect(result).toEqual({ tags: ['x', 'y'], meta: { ok: true } });
  });
});
