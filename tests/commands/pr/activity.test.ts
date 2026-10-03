import { describe, it, expect } from 'bun:test';
import { ActivityPRCommand } from '../../../src/commands/pr/activity.command.js';
import {
  createMockContextService,
  createMockGitService,
  createMockOutputService,
  mockUser,
} from '../../setup.js';
import { BBError } from '../../../src/types/errors.js';
import { extractPaginationParams } from '../../helpers/fake-api.js';
import { getTableRows } from '../../helpers/output-logs.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('ActivityPRCommand', () => {
  it('should list activity entries', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table:'))).toBe(true);
  });

  it('should filter activity by type', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1', type: 'approval' }, { globalOptions: {} });

    expect(
      output.logs.some((log) => log.includes('No activity entries matched'))
    ).toBe(true);
  });

  it('should respect limit option', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      activityPages: [
        [
          {
            comment: {
              id: 1,
              content: { raw: 'Comment 1' },
              user: mockUser,
              created_on: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            comment: {
              id: 2,
              content: { raw: 'Comment 2' },
              user: mockUser,
              created_on: '2024-01-01T01:00:00.000Z',
            },
          },
          {
            comment: {
              id: 3,
              content: { raw: 'Comment 3' },
              user: mockUser,
              created_on: '2024-01-01T02:00:00.000Z',
            },
          },
        ],
      ],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1', limit: '2' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(2);
  });

  it('should continue paginating when type filter is used', async () => {
    const requestedPages: number[] = [];
    const pullrequestsApi = createMockPullrequestsApi({
      activityPages: [
        [
          {
            approval: {
              user: mockUser,
              date: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
        [
          {
            comment: {
              id: 10,
              content: { raw: 'Filtered comment' },
              user: mockUser,
              created_on: '2024-01-01T01:00:00.000Z',
            },
          },
        ],
      ],
      onActivityCall: (_request, axiosOptions) => {
        requestedPages.push(extractPaginationParams(axiosOptions).page);
      },
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute(
      { id: '1', type: 'comment', limit: '1' },
      { globalOptions: {} }
    );

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);
    expect(requestedPages).toEqual([1, 2]);
  });

  it('should reject a non-integer --id', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );

    await expect(
      command.execute({ id: 'abc' }, { globalOptions: {} })
    ).rejects.toThrow(/--id must be a positive integer/);
  });

  it('should pass long comment activity whole so the table can fit it', async () => {
    const longContent = 'D'.repeat(120);
    const pullrequestsApi = createMockPullrequestsApi({
      activityPages: [
        [
          {
            comment: {
              id: 99,
              content: { raw: longContent },
              user: mockUser,
              created_on: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      ],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[3]).toBe('#99 ' + longContent);
  });

  it('should reject an invalid --type value', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );

    await expect(
      command.execute({ id: '1', type: 'commetn' }, { globalOptions: {} })
    ).rejects.toThrow(/--type must be one of/);
  });

  it('should suggest a near-miss activity type per bad token', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();
    const command = new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );

    await expect(
      command.execute({ id: '1', type: 'coment' }, { globalOptions: {} })
    ).rejects.toThrow('(Did you mean comment?)');

    // A comma list gets one suggestion line per invalid token.
    let message = '';
    try {
      await command.execute(
        { id: '1', type: 'coment,merg' },
        { globalOptions: {} }
      );
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('(Did you mean comment?)');
    expect(message).toContain('(Did you mean merge?)');
  });

  it('should report a repeated bad token only once', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();
    const command = new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );

    let error: unknown;
    try {
      await command.execute(
        { id: '1', type: 'coment,coment' },
        { globalOptions: {} }
      );
    } catch (caught) {
      error = caught;
    }

    const message = (error as Error).message;
    expect(message.match(/\(Did you mean comment\?\)/g)).toHaveLength(1);
    expect((error as BBError).context).toEqual({ invalid: ['coment'] });
  });

  it('should use changes_requested actor when both changes_requested and update are set', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      activityPages: [
        [
          {
            changes_requested: {
              user: { ...mockUser, display_name: 'CR User' },
              reason: 'Needs work',
              date: '2024-03-01T00:00:00.000Z',
            },
            update: {
              author: { ...mockUser, display_name: 'Update Author' },
              date: '2024-03-02T00:00:00.000Z',
              title: 'Updated title',
            },
          },
        ],
      ],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);
    expect(rows[0]![1]).toBe('CR User');
    expect(rows[0]![2]).toContain('2024-03-01');
  });
});
