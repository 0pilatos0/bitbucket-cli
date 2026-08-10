/**
 * Issue command tests
 */

import { describe, it, expect } from 'bun:test';
import { ListIssuesCommand } from '../../src/commands/issue/list.command.js';
import { ViewIssueCommand } from '../../src/commands/issue/view.command.js';
import { CreateIssueCommand } from '../../src/commands/issue/create.command.js';
import { EditIssueCommand } from '../../src/commands/issue/edit.command.js';
import { CloseIssueCommand } from '../../src/commands/issue/close.command.js';
import { CommentIssueCommand } from '../../src/commands/issue/comment.command.js';
import { createMockContextService, createMockOutputService } from '../setup.js';
import { APIError, BBError } from '../../src/types/errors.js';
import type { Issue, IssueTrackerApi } from '../../src/generated/api.js';

const mockIssue: Issue = {
  type: 'issue',
  id: 42,
  title: 'Crash on login',
  state: 'new',
  kind: 'bug',
  priority: 'major',
  votes: 3,
  reporter: { type: 'user', display_name: 'Reporter Person' },
  assignee: { type: 'user', display_name: 'Assignee Person' },
  created_on: '2024-01-01T00:00:00.000Z',
  updated_on: '2024-01-02T00:00:00.000Z',
  content: { raw: 'Steps to reproduce: open the app.' },
  links: {
    html: { href: 'https://bitbucket.org/workspace/repo/issues/42' },
  },
};

function getTableRows(logs: string[]): string[][] {
  const rowsLog = logs.find((log) => log.startsWith('table-rows:'));
  if (!rowsLog) {
    return [];
  }
  return JSON.parse(rowsLog.substring('table-rows:'.length)) as string[][];
}

function getJsonPayload(logs: string[]): Record<string, unknown> {
  const jsonLog = logs.find((log) => log.startsWith('json:'));
  expect(jsonLog).toBeDefined();
  return JSON.parse(jsonLog!.substring('json:'.length)) as Record<
    string,
    unknown
  >;
}

function createMockIssueTrackerApi(
  options: {
    issues?: Issue[];
    trackerDisabled?: boolean;
    issueNotFound?: boolean;
    onListCall?: (request: unknown, axiosOptions?: unknown) => void;
    onCreateCall?: (request: unknown) => void;
    onUpdateCall?: (request: unknown, axiosOptions?: unknown) => void;
    onCommentCall?: (request: unknown) => void;
    callOrder?: string[];
  } = {}
): IssueTrackerApi {
  const issues = options.issues ?? [mockIssue];

  const paginate = (page: number, pagelen: number) => {
    const start = (page - 1) * pagelen;
    const end = start + pagelen;
    return {
      values: issues.slice(start, end),
      page,
      pagelen,
      size: issues.length,
      next:
        end < issues.length
          ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/issues?page=${page + 1}`
          : undefined,
    };
  };

  return {
    repositoriesWorkspaceRepoSlugIssuesGet: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      if (options.trackerDisabled) {
        throw new APIError('Resource not found', 404);
      }
      options.onListCall?.(request, axiosOptions);
      const params = (
        axiosOptions as { params?: { page?: number; pagelen?: number } }
      )?.params;
      return { data: paginate(params?.page ?? 1, params?.pagelen ?? 25) };
    },
    repositoriesWorkspaceRepoSlugIssuesIssueIdGet: async () => {
      if (options.issueNotFound) {
        throw new APIError('Resource not found', 404);
      }
      return { data: mockIssue };
    },
    repositoriesWorkspaceRepoSlugIssuesPost: async (request: unknown) => {
      if (options.trackerDisabled) {
        throw new APIError('Resource not found', 404);
      }
      options.onCreateCall?.(request);
      const issue = (request as { body: Issue }).body;
      return { data: { ...mockIssue, ...issue, id: 43 } };
    },
    repositoriesWorkspaceRepoSlugIssuesIssueIdPut: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      if (options.issueNotFound) {
        throw new APIError('Resource not found', 404);
      }
      options.callOrder?.push('update');
      options.onUpdateCall?.(request, axiosOptions);
      const changes = (axiosOptions as { data?: Partial<Issue> })?.data ?? {};
      return { data: { ...mockIssue, ...changes } };
    },
    repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsPost: async (
      request: unknown
    ) => {
      if (options.issueNotFound) {
        throw new APIError('Resource not found', 404);
      }
      options.callOrder?.push('comment');
      options.onCommentCall?.(request);
      return {
        data: {
          type: 'issue_comment',
          id: 9001,
          content: (request as { body: { content: { raw: string } } }).body
            .content,
        },
      };
    },
  } as unknown as IssueTrackerApi;
}

function repoContextService() {
  return createMockContextService({ workspace: 'workspace', repoSlug: 'repo' });
}

describe('ListIssuesCommand', () => {
  it('should render the issues table with id, title, kind, priority, state, assignee, and date', async () => {
    const output = createMockOutputService();
    const command = new ListIssuesCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.startsWith('table:#,TITLE,KIND,PRIORITY,STATE,ASSIGNEE,UPDATED')
      )
    ).toBe(true);
    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual([
      '#42',
      'Crash on login',
      'bug',
      'major',
      'new',
      'Assignee Person',
      '2024-01-02T00:00:00.000Z',
    ]);
  });

  it('should default to the open-ish state filter and the -updated_on sort', async () => {
    let captured: { params?: Record<string, unknown> } | undefined;
    const output = createMockOutputService();
    const command = new ListIssuesCommand(
      createMockIssueTrackerApi({
        onListCall: (_request, axiosOptions) => {
          captured = axiosOptions as { params?: Record<string, unknown> };
        },
      }),
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(captured?.params?.q).toBe('(state="new" OR state="open")');
    expect(captured?.params?.sort).toBe('-updated_on');
  });

  it('should map --state on-hold to the API spelling "on hold"', async () => {
    let captured: { params?: Record<string, unknown> } | undefined;
    const output = createMockOutputService();
    const command = new ListIssuesCommand(
      createMockIssueTrackerApi({
        onListCall: (_request, axiosOptions) => {
          captured = axiosOptions as { params?: Record<string, unknown> };
        },
      }),
      repoContextService(),
      output
    );

    await command.execute({ state: 'on-hold' }, { globalOptions: {} });

    expect(captured?.params?.q).toBe('state="on hold"');
  });

  it('should AND --kind, --assignee, and --reporter clauses onto the state filter', async () => {
    let captured: { params?: Record<string, unknown> } | undefined;
    const output = createMockOutputService();
    const command = new ListIssuesCommand(
      createMockIssueTrackerApi({
        onListCall: (_request, axiosOptions) => {
          captured = axiosOptions as { params?: Record<string, unknown> };
        },
      }),
      repoContextService(),
      output
    );

    await command.execute(
      { kind: 'bug', assignee: 'alice', reporter: 'bob' },
      { globalOptions: {} }
    );

    expect(captured?.params?.q).toBe(
      '(state="new" OR state="open") AND kind="bug" AND assignee.username="alice" AND reporter.username="bob"'
    );
  });

  it('should use --query verbatim and suppress the default state filter', async () => {
    let captured: { params?: Record<string, unknown> } | undefined;
    const output = createMockOutputService();
    const command = new ListIssuesCommand(
      createMockIssueTrackerApi({
        onListCall: (_request, axiosOptions) => {
          captured = axiosOptions as { params?: Record<string, unknown> };
        },
      }),
      repoContextService(),
      output
    );

    await command.execute(
      { query: 'priority="blocker"', kind: 'bug' },
      { globalOptions: {} }
    );

    expect(captured?.params?.q).toBe('(priority="blocker") AND kind="bug"');
  });

  it('should reject an invalid --state value', async () => {
    const output = createMockOutputService();
    const command = new ListIssuesCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ state: 'nonsense' }, { globalOptions: {} })
    ).rejects.toThrow('--state must be one of:');
  });

  it('should emit the JSON envelope with metadata-first key order', async () => {
    const output = createMockOutputService();
    const command = new ListIssuesCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    await command.execute({ state: 'new' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'filters',
      'count',
      'issues',
    ]);
    expect(payload.workspace).toBe('workspace');
    expect(payload.repoSlug).toBe('repo');
    expect(payload.filters).toEqual({ state: 'new', q: 'state="new"' });
    expect(payload.count).toBe(1);
    expect(payload.issues).toHaveLength(1);
  });

  it('should show the empty-state message when no issues match', async () => {
    const output = createMockOutputService();
    const command = new ListIssuesCommand(
      createMockIssueTrackerApi({ issues: [] }),
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain(
      'info:No open issues found (try --state <state> or --query)'
    );
  });

  it('should respect --limit and print the more-results hint', async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...mockIssue,
      id: i + 1,
    }));
    const output = createMockOutputService();
    const command = new ListIssuesCommand(
      createMockIssueTrackerApi({ issues: many }),
      repoContextService(),
      output
    );

    await command.execute({ limit: '2' }, { globalOptions: {} });

    expect(getTableRows(output.logs)).toHaveLength(2);
    expect(
      output.logs.some((log) =>
        log.includes('Showing 2 issues. Use --limit <n> or --all to see more.')
      )
    ).toBe(true);
  });

  it('should explain that the tracker may be disabled when the list endpoint 404s', async () => {
    const output = createMockOutputService();
    const command = new ListIssuesCommand(
      createMockIssueTrackerApi({ trackerDisabled: true }),
      repoContextService(),
      output
    );

    await expect(command.execute({}, { globalOptions: {} })).rejects.toThrow(
      "This repository's issue tracker is disabled (or the repo was not found)."
    );
  });
});

describe('ViewIssueCommand', () => {
  it('should render issue details including reporter, votes, body, and url', async () => {
    const output = createMockOutputService();
    const command = new ViewIssueCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: {} });

    const text = output.logs.join('\n');
    expect(text).toContain('#42');
    expect(text).toContain('Crash on login');
    expect(text).toContain('Kind:       bug');
    expect(text).toContain('Priority:   major');
    expect(text).toContain('Reporter:   Reporter Person');
    expect(text).toContain('Assignee:   Assignee Person');
    expect(text).toContain('Votes:      3');
    expect(text).toContain('Steps to reproduce: open the app.');
    expect(text).toContain('https://bitbucket.org/workspace/repo/issues/42');
  });

  it('should emit the { workspace, repoSlug, issue } JSON envelope', async () => {
    const output = createMockOutputService();
    const command = new ViewIssueCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['workspace', 'repoSlug', 'issue']);
    expect((payload.issue as Issue).id).toBe(42);
  });

  it('should report a contextual not-found message that mentions the tracker', async () => {
    const output = createMockOutputService();
    const command = new ViewIssueCommand(
      createMockIssueTrackerApi({ issueNotFound: true }),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ id: '7' }, { globalOptions: {} })
    ).rejects.toThrow('Issue #7 not found in workspace/repo.');
    await expect(
      command.execute({ id: '7' }, { globalOptions: {} })
    ).rejects.toThrow('issue tracker may be disabled');
  });
});

describe('CreateIssueCommand', () => {
  it('should require --title', async () => {
    const output = createMockOutputService();
    const command = new CreateIssueCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    await expect(command.execute({}, { globalOptions: {} })).rejects.toThrow(
      'Option --title is required'
    );
  });

  it('should POST the issue body with discriminator, content, kind, priority, and assignee', async () => {
    let captured: unknown;
    const output = createMockOutputService();
    const command = new CreateIssueCommand(
      createMockIssueTrackerApi({
        onCreateCall: (request) => {
          captured = request;
        },
      }),
      repoContextService(),
      output
    );

    await command.execute(
      {
        title: 'New bug',
        body: 'It broke.',
        kind: 'bug',
        priority: 'critical',
        assignee: 'alice',
      },
      { globalOptions: {} }
    );

    expect(captured).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      body: {
        type: 'issue',
        title: 'New bug',
        content: { raw: 'It broke.' },
        kind: 'bug',
        priority: 'critical',
        assignee: { type: 'user', username: 'alice' },
      },
    });
    expect(output.logs).toContain('success:Issue #43 created');
    expect(
      output.logs.some((log) =>
        log.includes('https://bitbucket.org/workspace/repo/issues/42')
      )
    ).toBe(true);
  });

  it('should reject --body together with --body-file', async () => {
    const output = createMockOutputService();
    const command = new CreateIssueCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    await expect(
      command.execute(
        { title: 'x', body: 'a', bodyFile: 'b.md' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('--body and --body-file cannot both be set.');
  });

  it('should fail with FILE_NOT_FOUND when --body-file does not exist', async () => {
    const output = createMockOutputService();
    const command = new CreateIssueCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    await expect(
      command.execute(
        { title: 'x', bodyFile: '/nonexistent/issue-body.md' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('Could not read --body-file');
  });

  it('should emit the created issue in the JSON envelope', async () => {
    const output = createMockOutputService();
    const command = new CreateIssueCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    await command.execute(
      { title: 'New bug' },
      { globalOptions: { json: true } }
    );

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['workspace', 'repoSlug', 'issue']);
    expect((payload.issue as Issue).id).toBe(43);
  });

  it('should explain that the tracker may be disabled when the create endpoint 404s', async () => {
    const output = createMockOutputService();
    const command = new CreateIssueCommand(
      createMockIssueTrackerApi({ trackerDisabled: true }),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ title: 'New bug' }, { globalOptions: {} })
    ).rejects.toThrow("This repository's issue tracker is disabled");
  });
});

describe('EditIssueCommand', () => {
  it('should require at least one change flag', async () => {
    const output = createMockOutputService();
    const command = new EditIssueCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    const promise = command.execute({ id: '42' }, { globalOptions: {} });
    await expect(promise).rejects.toBeInstanceOf(BBError);
    await expect(
      command.execute({ id: '42' }, { globalOptions: {} })
    ).rejects.toThrow(
      'At least one of --title, --body, --kind, --priority, --assignee, or --state is required.'
    );
  });

  it('should send the partial update through the raw axios data option', async () => {
    let capturedRequest: unknown;
    let capturedAxiosOptions: unknown;
    const output = createMockOutputService();
    const command = new EditIssueCommand(
      createMockIssueTrackerApi({
        onUpdateCall: (request, axiosOptions) => {
          capturedRequest = request;
          capturedAxiosOptions = axiosOptions;
        },
      }),
      repoContextService(),
      output
    );

    await command.execute(
      { id: '42', title: 'Renamed', state: 'on-hold', assignee: 'alice' },
      { globalOptions: {} }
    );

    expect(capturedRequest).toEqual({
      issueId: '42',
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    expect((capturedAxiosOptions as { data?: unknown }).data).toEqual({
      type: 'issue',
      title: 'Renamed',
      assignee: { type: 'user', username: 'alice' },
      state: 'on hold',
    });
    expect(output.logs).toContain('success:Issue #42 updated');
  });

  it('should report a contextual not-found message on a 404', async () => {
    const output = createMockOutputService();
    const command = new EditIssueCommand(
      createMockIssueTrackerApi({ issueNotFound: true }),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ id: '9', title: 'x' }, { globalOptions: {} })
    ).rejects.toThrow('Issue #9 not found in workspace/repo.');
  });
});

describe('CloseIssueCommand', () => {
  it('should PUT state closed through the raw axios data option', async () => {
    let capturedAxiosOptions: unknown;
    const output = createMockOutputService();
    const command = new CloseIssueCommand(
      createMockIssueTrackerApi({
        onUpdateCall: (_request, axiosOptions) => {
          capturedAxiosOptions = axiosOptions;
        },
      }),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: {} });

    expect((capturedAxiosOptions as { data?: unknown }).data).toEqual({
      type: 'issue',
      state: 'closed',
    });
    expect(output.logs).toContain('success:Issue #42 closed');
  });

  it('should post the --comment before closing', async () => {
    const callOrder: string[] = [];
    let capturedComment: unknown;
    const output = createMockOutputService();
    const command = new CloseIssueCommand(
      createMockIssueTrackerApi({
        callOrder,
        onCommentCall: (request) => {
          capturedComment = request;
        },
      }),
      repoContextService(),
      output
    );

    await command.execute(
      { id: '42', comment: 'Fixed in 1.4.2' },
      { globalOptions: {} }
    );

    expect(callOrder).toEqual(['comment', 'update']);
    expect(capturedComment).toEqual({
      issueId: '42',
      workspace: 'workspace',
      repoSlug: 'repo',
      body: {
        type: 'issue_comment',
        content: { raw: 'Fixed in 1.4.2' },
      },
    });
  });

  it('should emit the closed issue in the JSON envelope', async () => {
    const output = createMockOutputService();
    const command = new CloseIssueCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    await command.execute({ id: '42' }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['workspace', 'repoSlug', 'issue']);
    expect((payload.issue as Issue).state).toBe('closed');
  });

  it('should report a contextual not-found message on a 404', async () => {
    const output = createMockOutputService();
    const command = new CloseIssueCommand(
      createMockIssueTrackerApi({ issueNotFound: true }),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ id: '9' }, { globalOptions: {} })
    ).rejects.toThrow('Issue #9 not found in workspace/repo.');
  });
});

describe('CommentIssueCommand', () => {
  it('should require --body', async () => {
    const output = createMockOutputService();
    const command = new CommentIssueCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ id: '42' }, { globalOptions: {} })
    ).rejects.toThrow('Option --body is required');
  });

  it('should POST the issue comment body with the discriminator', async () => {
    let captured: unknown;
    const output = createMockOutputService();
    const command = new CommentIssueCommand(
      createMockIssueTrackerApi({
        onCommentCall: (request) => {
          captured = request;
        },
      }),
      repoContextService(),
      output
    );

    await command.execute(
      { id: '42', body: 'Reproduced on main' },
      { globalOptions: {} }
    );

    expect(captured).toEqual({
      issueId: '42',
      workspace: 'workspace',
      repoSlug: 'repo',
      body: {
        type: 'issue_comment',
        content: { raw: 'Reproduced on main' },
      },
    });
    expect(output.logs).toContain('success:Comment added to issue #42');
  });

  it('should emit the created comment in the JSON envelope', async () => {
    const output = createMockOutputService();
    const command = new CommentIssueCommand(
      createMockIssueTrackerApi(),
      repoContextService(),
      output
    );

    await command.execute(
      { id: '42', body: 'Reproduced on main' },
      { globalOptions: { json: true } }
    );

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['workspace', 'repoSlug', 'comment']);
    expect((payload.comment as { content: { raw: string } }).content.raw).toBe(
      'Reproduced on main'
    );
  });

  it('should report a contextual not-found message on a 404', async () => {
    const output = createMockOutputService();
    const command = new CommentIssueCommand(
      createMockIssueTrackerApi({ issueNotFound: true }),
      repoContextService(),
      output
    );

    await expect(
      command.execute({ id: '9', body: 'x' }, { globalOptions: {} })
    ).rejects.toThrow('Issue #9 not found in workspace/repo.');
  });
});
