import { describe, it, expect } from 'bun:test';
import { ListReviewersPRCommand } from '../../../src/commands/pr/reviewers.list.command.js';
import {
  createMockContextService,
  createMockOutputService,
  mockPullRequest,
} from '../../setup.js';
import type { Pullrequest } from '../../../src/generated/api.js';
import { getTableRows } from '../../helpers/output-logs.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('ListReviewersPRCommand', () => {
  it('should display reviewers in a table', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { display_name: 'Alice', account_id: 'acc-1' },
        { display_name: 'Bob', account_id: 'acc-2' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListReviewersPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '42' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table:'))).toBe(true);
    const rows = getTableRows(output.logs);
    expect(rows.length).toBe(2);
  });

  it('should show info message when no reviewers', async () => {
    const prNoReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set() as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prNoReviewers],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListReviewersPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '42' }, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.includes('No reviewers assigned to this pull request')
      )
    ).toBe(true);
  });

  it('should return JSON with reviewers', async () => {
    const prWithReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([
        { display_name: 'Alice', account_id: 'acc-1' },
      ]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithReviewers],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListReviewersPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '42' }, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.count).toBe(1);
    expect(parsed.reviewers).toHaveLength(1);
  });

  it('should return JSON with empty reviewers', async () => {
    const prNoReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set() as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prNoReviewers],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListReviewersPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '42' }, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.pullRequestId).toBe(42);
    expect(parsed.count).toBe(0);
    expect(parsed.reviewers).toHaveLength(0);
  });

  it('should handle reviewers with missing fields', async () => {
    const prWithPartialReviewers: Pullrequest = {
      ...mockPullRequest,
      id: 42,
      reviewers: new Set([{ type: 'user' }]) as Pullrequest['reviewers'],
    };
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [prWithPartialReviewers],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListReviewersPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '42' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows.length).toBe(1);
    expect(rows[0][0]).toBe('Unknown');
    expect(rows[0][1]).toBe('');
  });
});
