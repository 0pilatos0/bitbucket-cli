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

  it('traverses into arrays via numeric segments', () => {
    const result = projectFields({ tags: ['x', 'y'] }, [
      'tags.0',
      'tags.length',
    ]);
    expect(result).toEqual({ 'tags.0': 'x', 'tags.length': 2 });
  });

  it('returns null when a numeric segment misses', () => {
    const result = projectFields({ tags: ['x'] }, ['tags.1']);
    expect(result).toEqual({ 'tags.1': null });
  });

  it('returns null for empty or duplicated dotted segments', () => {
    const result = projectFields({ a: { b: 1 } }, ['a..b', '.a', 'a.', '']);
    expect(result).toEqual({ 'a..b': null, '.a': null, 'a.': null, '': null });
  });

  it('maps an undefined leaf to null', () => {
    const result = projectFields({ a: { b: undefined } }, ['a.b']);
    expect(result).toEqual({ 'a.b': null });
  });

  it('keeps the last occurrence of a duplicated field', () => {
    const result = projectFields({ a: 1 }, ['a', 'a']) as Record<
      string,
      unknown
    >;
    expect(result).toEqual({ a: 1 });
  });

  it('treats a top-level array as a record of indexed segments', () => {
    const result = projectFields(['x', 'y'], ['0', '1', '2']);
    expect(result).toEqual({ 0: 'x', 1: 'y', 2: null });
  });

  it('returns booleans and undefined unchanged as non-object inputs', () => {
    expect(projectFields(true, ['x'])).toBe(true);
    expect(projectFields(undefined, ['x'])).toBeUndefined();
  });
});
