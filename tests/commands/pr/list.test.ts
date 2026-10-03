import { describe, it, expect } from 'bun:test';
import { ListPRsCommand } from '../../../src/commands/pr/list.command.js';
import {
  createMockContextService,
  createMockOutputService,
  mockPullRequest,
} from '../../setup.js';
import { getTableRows } from '../../helpers/output-logs.js';
import { createMockPullrequestsApi, createMockUsersApi } from './fakes.js';

describe('ListPRsCommand', () => {
  it('should list open pull requests by default', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table:'))).toBe(true);
  });

  it('should filter by state', async () => {
    const prs = [
      { ...mockPullRequest, id: 1, state: 'OPEN' as const },
      { ...mockPullRequest, id: 2, state: 'MERGED' as const },
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({ state: 'MERGED' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table:'))).toBe(true);
  });

  it('should fail when no repo context', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );

    await expect(command.run({}, { globalOptions: {} })).rejects.toThrow();
  });

  it('should show message when no PRs found', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain('info:No open pull requests found');
  });

  it('should label draft pull requests', async () => {
    const prs = [{ ...mockPullRequest, id: 1, draft: true }];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table-rows:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('[DRAFT]'))).toBe(true);
  });

  it('should respect limit option', async () => {
    const prs = [
      { ...mockPullRequest, id: 1, title: 'PR 1' },
      { ...mockPullRequest, id: 2, title: 'PR 2' },
      { ...mockPullRequest, id: 3, title: 'PR 3' },
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({ limit: '2' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(2);
  });

  it('should output json when requested', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });
    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: { json: true } });

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });

  it('should show when each pull request was last updated', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [{ ...mockPullRequest, id: 1 }],
    });
    const output = createMockOutputService();
    const command = new ListPRsCommand(
      pullrequestsApi,
      createMockUsersApi({ uuid: '{user-uuid}' }),
      createMockContextService({ workspace: 'workspace', repoSlug: 'repo' }),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain('table:ID,TITLE,AUTHOR,BRANCHES,UPDATED');
    expect(getTableRows(output.logs)[0]?.[4]).toBe(mockPullRequest.updated_on);
  });

  it('should pass long titles whole so the table can fit them', async () => {
    const longTitle = 'A'.repeat(80);
    const prs = [{ ...mockPullRequest, id: 1, title: longTitle }];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });

    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[1]).toBe(longTitle);
  });

  it('should include reviewer filter when --mine is set', async () => {
    let capturedAxiosOptions: unknown;
    const pullrequestsApi = createMockPullrequestsApi({
      onListCall: (_request, axiosOptions) => {
        capturedAxiosOptions = axiosOptions;
      },
    });
    const usersApi = createMockUsersApi({ uuid: '{my-uuid}' });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({ mine: true }, { globalOptions: {} });

    const opts = capturedAxiosOptions as { params: Record<string, unknown> };
    expect(opts.params.q).toBe('reviewers.uuid="{my-uuid}"');
  });

  it('should warn and show all PRs when --mine is set but uuid is missing', async () => {
    let capturedAxiosOptions: unknown;
    const pullrequestsApi = createMockPullrequestsApi({
      onListCall: (_request, axiosOptions) => {
        capturedAxiosOptions = axiosOptions;
      },
    });
    const usersApi = createMockUsersApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({ mine: true }, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.includes(
          'Could not determine your user UUID. Showing all pull requests.'
        )
      )
    ).toBe(true);
    const opts = capturedAxiosOptions as { params: Record<string, unknown> };
    expect(opts.params.q).toBeUndefined();
  });

  it('should use ASCII arrow in branch column when noUnicode mode is on', async () => {
    const prs = [
      {
        ...mockPullRequest,
        id: 1,
        source: {
          branch: { name: 'feature' },
        },
        destination: {
          branch: { name: 'main' },
        },
      },
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService({ noUnicode: true });
    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });

    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[3]).toBe('feature -> main');
  });

  it('should use Unicode arrow in branch column by default', async () => {
    const prs = [
      {
        ...mockPullRequest,
        id: 1,
        source: {
          branch: { name: 'feature' },
        },
        destination: {
          branch: { name: 'main' },
        },
      },
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();
    const usersApi = createMockUsersApi({ uuid: '{user-uuid}' });

    const command = new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[3]).toBe('feature → main');
  });
});
