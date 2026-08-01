/**
 * Remediation-hint tests.
 *
 * The important cases here are the NEGATIVE ones: a hint that fires on the
 * wrong error is worse than no hint, because it sends the user chasing a
 * cause that isn't there.
 */

import { describe, it, expect } from 'bun:test';
import {
  remediationHintLines,
  REMEDIATION_HINTS,
  DOCS_BASE_URL,
} from '../../src/core/error-hints.js';
import {
  APIError,
  BBError,
  ErrorCode,
  rethrowWithNotFoundContext,
} from '../../src/types/errors.js';

describe('remediationHintLines', () => {
  describe('by status', () => {
    it('points a 401 at bb auth login', () => {
      const lines = remediationHintLines(new APIError('nope', 401));

      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('bb auth login');
      expect(lines[0]).toContain('credentials were rejected');
    });

    it('explains scopes and links the docs for a 403', () => {
      const lines = remediationHintLines(new APIError('Access denied', 403));

      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('missing a required scope');
      expect(lines[0]).toContain('bb auth login');
      expect(lines[1]).toBe(`Docs: ${DOCS_BASE_URL}/reference/token-scopes/`);
    });

    it('covers both wrong-repo and wrong-id for a 404', () => {
      const lines = remediationHintLines(new APIError('nope', 404));

      expect(lines).toHaveLength(1);
      // Deliberately input-agnostic: most id-based commands surface the raw
      // interceptor 404, where --workspace/--repo were not the problem.
      expect(lines[0]).toContain('id or slug');
      expect(lines[0]).toContain('--workspace/--repo');
    });

    it('says nothing for statuses without advice', () => {
      expect(remediationHintLines(new APIError('boom', 500))).toEqual([]);
      expect(remediationHintLines(new APIError('slow down', 429))).toEqual([]);
      expect(remediationHintLines(new APIError('teapot', 418))).toEqual([]);
    });
  });

  describe('non-APIError inputs', () => {
    it('says nothing for a plain BBError carrying API_NOT_FOUND', () => {
      // The trap this gating exists to avoid: several commands throw
      // API_NOT_FOUND for conditions unrelated to workspace/repo, e.g.
      // `bb pr checkout` when the source branch is gone. Keying on ErrorCode
      // instead of the HTTP status would staple resource advice onto these.
      const error = new BBError({
        code: ErrorCode.API_NOT_FOUND,
        message: 'Pull request source branch not found',
      });

      expect(remediationHintLines(error)).toEqual([]);
    });

    it('says nothing for auth errors thrown before any request', () => {
      const error = new BBError({
        code: ErrorCode.AUTH_REQUIRED,
        message:
          "Authentication required. Run 'bb auth login' or set BB_USERNAME and BB_API_TOKEN.",
      });

      expect(remediationHintLines(error)).toEqual([]);
    });

    it('says nothing for a generic Error, a string, or undefined', () => {
      expect(remediationHintLines(new Error('boom'))).toEqual([]);
      expect(remediationHintLines('boom')).toEqual([]);
      expect(remediationHintLines(undefined)).toEqual([]);
    });
  });

  describe('404 suppression', () => {
    it('suppresses the hint once a rethrow helper named the resource', () => {
      let contextualized: unknown;
      try {
        rethrowWithNotFoundContext(
          new APIError('Request failed with status code 404', 404),
          'Pull request 999 not found in acme/demo.'
        );
      } catch (error) {
        contextualized = error;
      }

      expect((contextualized as APIError).contextualized).toBe(true);
      expect(remediationHintLines(contextualized)).toEqual([]);
    });

    it('keeps the hint for a raw 404 that no helper touched', () => {
      const error = new APIError('Request failed with status code 404', 404);

      expect(error.contextualized).toBe(false);
      expect(remediationHintLines(error)).toHaveLength(1);
    });

    it('suppresses the hint for bb api, where the user typed the URL', () => {
      const error = new APIError('Repository acme/nope not found', 404);

      expect(remediationHintLines(error, { commandPath: 'api' })).toEqual([]);
    });

    it('still hints on a 403 from bb api, where scopes do apply', () => {
      const error = new APIError('Access denied', 403);

      expect(remediationHintLines(error, { commandPath: 'api' })).toHaveLength(
        2
      );
    });

    it('does not suppress for other command paths', () => {
      const error = new APIError('nope', 404);

      expect(
        remediationHintLines(error, { commandPath: 'pr view' })
      ).toHaveLength(1);
    });
  });

  it('returns a fresh array so callers cannot mutate the table', () => {
    const lines = remediationHintLines(new APIError('nope', 403));
    lines.push('injected');

    expect(REMEDIATION_HINTS[403]).toHaveLength(2);
    expect(remediationHintLines(new APIError('nope', 403))).toHaveLength(2);
  });
});
