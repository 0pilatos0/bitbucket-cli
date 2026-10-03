import { describe, it, expect } from 'bun:test';
import { ListCommentsPRCommand } from '../../../src/commands/pr/comments.list.command.js';
import {
  createMockContextService,
  createMockOutputService,
  mockUser,
} from '../../setup.js';
import type { PullrequestComment } from '../../../src/generated/api.js';
import { getTableRows } from '../../helpers/output-logs.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('ListCommentsPRCommand', () => {
  it('should list comments with limit', async () => {
    const comments: PullrequestComment[] = [
      {
        id: 1,
        type: 'pullrequest_comment',
        content: { raw: 'Comment 1' },
        user: mockUser,
        created_on: '2024-01-01T00:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
      {
        id: 2,
        type: 'pullrequest_comment',
        content: { raw: 'Comment 2' },
        user: mockUser,
        created_on: '2024-01-01T01:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
      {
        id: 3,
        type: 'pullrequest_comment',
        content: { raw: 'Comment 3' },
        user: mockUser,
        created_on: '2024-01-01T02:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ comments });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1', limit: '2' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(2);
  });

  it('should pass long comment content whole so the table can fit it', async () => {
    const longContent = 'B'.repeat(120);
    const comments: PullrequestComment[] = [
      {
        id: 1,
        type: 'pullrequest_comment',
        content: { raw: longContent },
        user: mockUser,
        created_on: '2024-01-01T00:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ comments });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[2]).toBe(longContent);
  });

  it('should include limited count in json output', async () => {
    const comments: PullrequestComment[] = [
      {
        id: 1,
        type: 'pullrequest_comment',
        content: { raw: 'Comment 1' },
        user: mockUser,
        created_on: '2024-01-01T00:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
      {
        id: 2,
        type: 'pullrequest_comment',
        content: { raw: 'Comment 2' },
        user: mockUser,
        created_on: '2024-01-01T01:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
      {
        id: 3,
        type: 'pullrequest_comment',
        content: { raw: 'Comment 3' },
        user: mockUser,
        created_on: '2024-01-01T02:00:00.000Z',
        deleted: false,
      } as PullrequestComment,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ comments });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '1', limit: '2' },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.count).toBe(2);
    expect(parsed.comments).toHaveLength(2);
  });

  const mixedResolutionComments = (): PullrequestComment[] => [
    {
      id: 1,
      type: 'pullrequest_comment',
      content: { raw: 'Resolved thread' },
      user: mockUser,
      created_on: '2024-01-01T00:00:00.000Z',
      deleted: false,
      resolution: { type: 'comment_resolution' },
    } as PullrequestComment,
    {
      id: 2,
      type: 'pullrequest_comment',
      content: { raw: 'Open thread' },
      user: mockUser,
      created_on: '2024-01-01T01:00:00.000Z',
      deleted: false,
    } as PullrequestComment,
    {
      id: 3,
      type: 'pullrequest_comment',
      content: { raw: 'Pending comment' },
      user: mockUser,
      created_on: '2024-01-01T02:00:00.000Z',
      deleted: false,
      pending: true,
    } as PullrequestComment,
  ];

  it('should render the resolution status column', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comments: mixedResolutionComments(),
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows.map((row) => row[3])).toEqual(['resolved', 'open', 'pending']);
  });

  it('should only list resolved comments with --resolved', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comments: mixedResolutionComments(),
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1', resolved: true }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.[0]).toBe('1');
  });

  it('should only list unresolved comments with --unresolved', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comments: mixedResolutionComments(),
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1', unresolved: true }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows.map((row) => row[0])).toEqual(['2', '3']);
  });

  it('should reject --resolved combined with --unresolved', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ comments: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );

    expect(
      command.execute(
        { id: '1', resolved: true, unresolved: true },
        { globalOptions: {} }
      )
    ).rejects.toThrow('--resolved and --unresolved cannot be combined');
  });

  it('should show the filtered empty message when a filter matches nothing', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comments: [
        {
          id: 1,
          type: 'pullrequest_comment',
          content: { raw: 'Open thread' },
          user: mockUser,
          created_on: '2024-01-01T00:00:00.000Z',
          deleted: false,
        } as PullrequestComment,
      ],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1', resolved: true }, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.includes('No comments matched the requested filter')
      )
    ).toBe(true);
  });

  it('should show the default empty message without a filter', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ comments: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.includes('No comments found on this pull request')
      )
    ).toBe(true);
  });

  it('should include the resolution filter in json output', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      comments: mixedResolutionComments(),
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      output
    );
    await command.execute(
      { id: '1', unresolved: true },
      { globalOptions: { json: true } }
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    const parsed = JSON.parse(jsonLog!.substring(5));
    expect(parsed.filters).toEqual({ resolution: 'unresolved' });
    expect(parsed.comments.map((c: PullrequestComment) => c.id)).toEqual([
      2, 3,
    ]);
  });
});
