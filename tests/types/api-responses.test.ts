import { describe, expect, it } from 'bun:test';
import {
  parseDiffResponse,
  parseDiffstats,
  parsePullrequestActivities,
} from '../../src/types/api-responses.js';

describe('api response parsers', () => {
  it('parsePullrequestActivities returns activity entries', () => {
    const data = {
      values: new Set([
        { comment: { id: 1 } },
        { approval: { user: { display_name: 'Reviewer' } } },
      ]),
    };

    const activities = parsePullrequestActivities(data);
    expect(activities).toHaveLength(2);
    expect(activities[0].comment?.id).toBe(1);
  });

  it('parseDiffstats returns diffstat entries', () => {
    const data = {
      values: [
        { new: { path: 'src/app.ts' }, lines_added: 2, lines_removed: 1 },
      ],
    };

    const diffstats = parseDiffstats(data);
    expect(diffstats).toHaveLength(1);
    expect(diffstats[0].new?.path).toBe('src/app.ts');
  });

  it('parseDiffResponse returns a string', () => {
    const diffText = 'diff --git a/file b/file';
    expect(parseDiffResponse(diffText)).toBe(diffText);
  });

  it('parsers handle non-iterable inputs', () => {
    expect(parsePullrequestActivities(undefined)).toEqual([]);
    expect(parsePullrequestActivities({})).toEqual([]);
    expect(parsePullrequestActivities({ values: 123 })).toEqual([]);

    expect(parseDiffstats(null)).toEqual([]);
    expect(parseDiffstats({})).toEqual([]);
    expect(parseDiffstats({ values: { foo: 'bar' } })).toEqual([]);
  });

  it('parseDiffResponse coerces non-string values', () => {
    expect(parseDiffResponse(null)).toBe('');
    expect(parseDiffResponse(123)).toBe('123');
  });
});
