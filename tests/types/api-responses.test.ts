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
});
