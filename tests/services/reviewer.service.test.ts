/**
 * Tests for reviewer service shared logic
 */

import { describe, it, expect } from 'bun:test';
import type {
  Account,
  Pullrequest,
  PullrequestsApi,
} from '../../src/generated/api.js';
import type { AxiosResponse } from 'axios';
import {
  extractReviewerUuids,
  buildReviewersUpdateBody,
  updatePullRequestReviewers,
} from '../../src/services/reviewer.service.js';

function createAxiosResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };
}

const basePr: Pullrequest = {
  type: 'pullrequest',
  id: 1,
  title: 'Test PR',
  reviewers: [],
};

// ============================================================
// extractReviewerUuids
// ============================================================

describe('extractReviewerUuids', () => {
  it('should return empty array when reviewers is undefined', () => {
    expect(extractReviewerUuids(undefined)).toEqual([]);
  });

  it('should return empty array when reviewers is empty array', () => {
    expect(extractReviewerUuids([])).toEqual([]);
  });

  it('should return empty array when reviewers is empty Set', () => {
    const reviewers = new Set<Account>() as Pullrequest['reviewers'];
    expect(extractReviewerUuids(reviewers)).toEqual([]);
  });

  it('should extract uuids from an array of accounts', () => {
    const reviewers: Account[] = [
      { type: 'user', uuid: '{uuid-1}' },
      { type: 'user', uuid: '{uuid-2}' },
    ];
    expect(extractReviewerUuids(reviewers)).toEqual(['{uuid-1}', '{uuid-2}']);
  });

  it('should extract uuids from a Set of accounts', () => {
    const reviewers = new Set([
      { type: 'user', uuid: '{uuid-1}' },
      { type: 'user', uuid: '{uuid-2}' },
    ]) as Pullrequest['reviewers'];
    expect(extractReviewerUuids(reviewers)).toEqual(['{uuid-1}', '{uuid-2}']);
  });

  it('should skip reviewers without uuid', () => {
    const reviewers: Account[] = [
      { type: 'user', uuid: '{uuid-1}' },
      { type: 'user' },
      { type: 'user', uuid: '{uuid-3}' },
    ];
    expect(extractReviewerUuids(reviewers)).toEqual(['{uuid-1}', '{uuid-3}']);
  });

  it('should return empty array when all reviewers lack uuid', () => {
    const reviewers: Account[] = [
      { type: 'user' },
      { type: 'user', display_name: 'No UUID' },
    ];
    expect(extractReviewerUuids(reviewers)).toEqual([]);
  });
});

// ============================================================
// buildReviewersUpdateBody
// ============================================================

describe('buildReviewersUpdateBody', () => {
  it('should create a Pullrequest body with type and reviewers', () => {
    const body = buildReviewersUpdateBody(['{uuid-1}', '{uuid-2}']);
    expect(body.type).toBe('pullrequest');
    expect(body.reviewers).toHaveLength(2);
    expect(body.reviewers![0].uuid).toBe('{uuid-1}');
    expect(body.reviewers![1].uuid).toBe('{uuid-2}');
  });

  it('should create body with empty reviewers for empty uuid list', () => {
    const body = buildReviewersUpdateBody([]);
    expect(body.type).toBe('pullrequest');
    expect(body.reviewers).toEqual([]);
  });

  it('should set type to user on each reviewer account', () => {
    const body = buildReviewersUpdateBody(['{uuid-1}']);
    expect(body.reviewers![0].type).toBe('user');
  });
});

// ============================================================
// updatePullRequestReviewers
// ============================================================

describe('updatePullRequestReviewers', () => {
  function createMockPullrequestsApi(pr: Pullrequest): {
    api: PullrequestsApi;
    lastPutBody: () => Pullrequest | undefined;
  } {
    let capturedBody: Pullrequest | undefined;

    const api = {
      async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet() {
        return createAxiosResponse(pr);
      },
      async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut(params: {
        pullrequest?: Pullrequest;
      }) {
        capturedBody = params.pullrequest;
        return createAxiosResponse({
          ...pr,
          reviewers: params.pullrequest?.reviewers ?? pr.reviewers,
        });
      },
    } as unknown as PullrequestsApi;

    return { api, lastPutBody: () => capturedBody };
  }

  const repoContext = { workspace: 'ws', repoSlug: 'repo' };

  it('should add a new uuid via transform', async () => {
    const pr: Pullrequest = {
      ...basePr,
      reviewers: [{ type: 'user', uuid: '{existing}' }],
    };
    const { api, lastPutBody } = createMockPullrequestsApi(pr);

    await updatePullRequestReviewers(api, repoContext, 1, (uuids) => [
      ...uuids,
      '{new-uuid}',
    ]);

    const body = lastPutBody()!;
    expect(body.type).toBe('pullrequest');
    expect(body.reviewers).toHaveLength(2);
    expect(body.reviewers![0].uuid).toBe('{existing}');
    expect(body.reviewers![1].uuid).toBe('{new-uuid}');
  });

  it('should remove a uuid via transform', async () => {
    const pr: Pullrequest = {
      ...basePr,
      reviewers: [
        { type: 'user', uuid: '{keep}' },
        { type: 'user', uuid: '{remove}' },
      ],
    };
    const { api, lastPutBody } = createMockPullrequestsApi(pr);

    await updatePullRequestReviewers(api, repoContext, 1, (uuids) =>
      uuids.filter((u) => u !== '{remove}')
    );

    const body = lastPutBody()!;
    expect(body.reviewers).toHaveLength(1);
    expect(body.reviewers![0].uuid).toBe('{keep}');
  });

  it('should handle empty reviewer list', async () => {
    const pr: Pullrequest = { ...basePr, reviewers: [] };
    const { api, lastPutBody } = createMockPullrequestsApi(pr);

    await updatePullRequestReviewers(api, repoContext, 1, (uuids) => [
      ...uuids,
      '{first}',
    ]);

    const body = lastPutBody()!;
    expect(body.reviewers).toHaveLength(1);
    expect(body.reviewers![0].uuid).toBe('{first}');
  });

  it('should handle undefined reviewers on PR', async () => {
    const pr: Pullrequest = { ...basePr, reviewers: undefined };
    const { api, lastPutBody } = createMockPullrequestsApi(pr);

    await updatePullRequestReviewers(api, repoContext, 1, (uuids) => [
      ...uuids,
      '{added}',
    ]);

    const body = lastPutBody()!;
    expect(body.reviewers).toHaveLength(1);
    expect(body.reviewers![0].uuid).toBe('{added}');
  });

  it('should handle Set-based reviewers', async () => {
    const pr: Pullrequest = {
      ...basePr,
      reviewers: new Set([
        { type: 'user', uuid: '{set-uuid}' },
      ]) as Pullrequest['reviewers'],
    };
    const { api, lastPutBody } = createMockPullrequestsApi(pr);

    await updatePullRequestReviewers(api, repoContext, 1, (uuids) => uuids);

    const body = lastPutBody()!;
    expect(body.reviewers).toHaveLength(1);
    expect(body.reviewers![0].uuid).toBe('{set-uuid}');
  });

  it('should return the updated PR data', async () => {
    const pr: Pullrequest = { ...basePr, reviewers: [] };
    const { api } = createMockPullrequestsApi(pr);

    const result = await updatePullRequestReviewers(
      api,
      repoContext,
      1,
      (uuids) => [...uuids, '{new}']
    );

    expect(result.type).toBe('pullrequest');
    expect(result.reviewers).toHaveLength(1);
  });

  it('should propagate API errors from GET', async () => {
    const api = {
      async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet() {
        throw new Error('GET failed');
      },
    } as unknown as PullrequestsApi;

    await expect(
      updatePullRequestReviewers(api, repoContext, 1, (u) => u)
    ).rejects.toThrow('GET failed');
  });

  it('should propagate API errors from PUT', async () => {
    const api = {
      async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet() {
        return createAxiosResponse(basePr);
      },
      async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut() {
        throw new Error('PUT failed');
      },
    } as unknown as PullrequestsApi;

    await expect(
      updatePullRequestReviewers(api, repoContext, 1, (u) => u)
    ).rejects.toThrow('PUT failed');
  });

  it('should pass correct workspace and repoSlug to API calls', async () => {
    let getParams: Record<string, unknown> = {};
    let putParams: Record<string, unknown> = {};

    const api = {
      async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet(
        params: Record<string, unknown>
      ) {
        getParams = params;
        return createAxiosResponse(basePr);
      },
      async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut(
        params: Record<string, unknown>
      ) {
        putParams = params;
        return createAxiosResponse(basePr);
      },
    } as unknown as PullrequestsApi;

    await updatePullRequestReviewers(
      api,
      { workspace: 'my-ws', repoSlug: 'my-repo' },
      99,
      (u) => u
    );

    expect(getParams).toMatchObject({
      workspace: 'my-ws',
      repoSlug: 'my-repo',
      pullRequestId: 99,
    });
    expect(putParams).toMatchObject({
      workspace: 'my-ws',
      repoSlug: 'my-repo',
      pullRequestId: 99,
    });
  });

  it('should not duplicate uuid when transform returns identity', async () => {
    const pr: Pullrequest = {
      ...basePr,
      reviewers: [
        { type: 'user', uuid: '{a}' },
        { type: 'user', uuid: '{b}' },
      ],
    };
    const { api, lastPutBody } = createMockPullrequestsApi(pr);

    await updatePullRequestReviewers(api, repoContext, 1, (uuids) => uuids);

    const body = lastPutBody()!;
    expect(body.reviewers).toHaveLength(2);
  });
});
