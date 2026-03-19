/**
 * Snippet command tests
 */

import { describe, it, expect } from 'bun:test';
import { ListSnippetsCommand } from '../../src/commands/snippet/list.command.js';
import { ViewSnippetCommand } from '../../src/commands/snippet/view.command.js';
import { CreateSnippetCommand } from '../../src/commands/snippet/create.command.js';
import { EditSnippetCommand } from '../../src/commands/snippet/edit.command.js';
import { DeleteSnippetCommand } from '../../src/commands/snippet/delete.command.js';
import { WatchSnippetCommand } from '../../src/commands/snippet/watch.command.js';
import { UnwatchSnippetCommand } from '../../src/commands/snippet/unwatch.command.js';
import { ListSnippetCommentsCommand } from '../../src/commands/snippet/comments.list.command.js';
import { AddSnippetCommentCommand } from '../../src/commands/snippet/comments.add.command.js';
import { EditSnippetCommentCommand } from '../../src/commands/snippet/comments.edit.command.js';
import { DeleteSnippetCommentCommand } from '../../src/commands/snippet/comments.delete.command.js';
import {
  createMockConfigService,
  createMockOutputService,
  mockUser,
} from '../setup.js';
import type { SnippetsApi, Snippet } from '../../src/generated/api.js';
import type { CommandContext } from '../../src/core/interfaces/commands.js';

// Mock snippet data
const mockSnippet: Snippet & Record<string, unknown> = {
  type: 'snippet',
  id: 'kypj' as unknown as number,
  title: 'Test snippet',
  is_private: false,
  scm: 'git' as const,
  created_on: '2026-01-15T10:00:00.000000+00:00',
  updated_on: '2026-01-16T14:30:00.000000+00:00',
  creator: mockUser,
  owner: mockUser,
  files: {
    'foo.txt': {
      links: {
        self: {
          href: 'https://api.bitbucket.org/2.0/snippets/workspace/kypj/files/foo.txt',
        },
      },
    },
  },
  links: {
    html: { href: 'https://bitbucket.org/snippets/workspace/kypj' },
    self: {
      href: 'https://api.bitbucket.org/2.0/snippets/workspace/kypj',
    },
  },
};

const mockComment = {
  type: 'snippet_comment',
  id: 1,
  content: {
    raw: 'Test comment',
    markup: 'markdown',
    html: '<p>Test comment</p>',
  },
  user: mockUser,
  created_on: '2026-01-15T12:00:00.000000+00:00',
  updated_on: '2026-01-15T12:00:00.000000+00:00',
};

function extractPaginationParams(axiosOptions: unknown): {
  page: number;
  pagelen: number;
} {
  if (!axiosOptions || typeof axiosOptions !== 'object') {
    return { page: 1, pagelen: 25 };
  }

  const params = (axiosOptions as { params?: unknown }).params;
  if (!params || typeof params !== 'object') {
    return { page: 1, pagelen: 25 };
  }

  const pageValue = (params as { page?: unknown }).page;
  const pagelenValue = (params as { pagelen?: unknown }).pagelen;

  const page =
    typeof pageValue === 'number' && Number.isFinite(pageValue) && pageValue > 0
      ? pageValue
      : 1;
  const pagelen =
    typeof pagelenValue === 'number' &&
    Number.isFinite(pagelenValue) &&
    pagelenValue > 0
      ? pagelenValue
      : 25;

  return { page, pagelen };
}

function getTableRows(logs: string[]): string[][] {
  const rowsLog = logs.find((log) => log.startsWith('table-rows:'));
  if (!rowsLog) {
    return [];
  }

  return JSON.parse(rowsLog.substring('table-rows:'.length)) as string[][];
}

function createMockSnippetsApi(
  snippets: (typeof mockSnippet)[] = [mockSnippet],
  options: {
    onCreateCall?: (request: unknown) => void;
    onDeleteCall?: (request: unknown) => void;
  } = {}
): SnippetsApi {
  return {
    snippetsWorkspaceGet: async (_request: unknown, axiosOptions?: unknown) => {
      const { page, pagelen } = extractPaginationParams(axiosOptions);
      const start = (page - 1) * pagelen;
      const end = start + pagelen;
      const values = snippets.slice(start, end);

      return {
        data: {
          values,
          page,
          pagelen,
          size: snippets.length,
          next:
            end < snippets.length
              ? `https://api.bitbucket.org/2.0/snippets/workspace?page=${page + 1}`
              : undefined,
        },
      };
    },
    snippetsWorkspaceEncodedIdGet: async () => ({
      data: mockSnippet,
    }),
    snippetsWorkspacePost: async (request: unknown) => {
      options.onCreateCall?.(request);
      return { data: mockSnippet };
    },
    snippetsWorkspaceEncodedIdPut: async () => ({
      data: mockSnippet,
    }),
    snippetsWorkspaceEncodedIdDelete: async (request: unknown) => {
      options.onDeleteCall?.(request);
      return { data: undefined };
    },
    snippetsWorkspaceEncodedIdWatchPut: async () => ({
      data: undefined,
    }),
    snippetsWorkspaceEncodedIdWatchDelete: async () => ({
      data: undefined,
    }),
    snippetsWorkspaceEncodedIdCommentsGet: async (
      _request: unknown,
      axiosOptions?: unknown
    ) => {
      const { page, pagelen } = extractPaginationParams(axiosOptions);
      const comments = [mockComment];
      const start = (page - 1) * pagelen;
      const end = start + pagelen;
      const values = comments.slice(start, end);

      return {
        data: {
          values,
          page,
          pagelen,
          size: comments.length,
          next: undefined,
        },
      };
    },
    snippetsWorkspaceEncodedIdCommentsPost: async () => ({
      data: mockComment,
    }),
    snippetsWorkspaceEncodedIdCommentsCommentIdPut: async () => ({
      data: mockComment,
    }),
    snippetsWorkspaceEncodedIdCommentsCommentIdDelete: async () => ({
      data: undefined,
    }),
  } as unknown as SnippetsApi;
}

function makeContext(json = false): CommandContext {
  return {
    globalOptions: {
      json,
      workspace: 'workspace',
    },
  };
}

// --- ListSnippetsCommand ---

describe('ListSnippetsCommand', () => {
  it('should list snippets as table', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetsCommand(api, configService, output);

    await cmd.run({ workspace: 'workspace' }, makeContext());

    expect(output.logs.some((log) => log.startsWith('table:'))).toBe(true);
    const rows = getTableRows(output.logs);
    expect(rows.length).toBe(1);
    expect(rows[0][1]).toBe('Test snippet');
  });

  it('should list snippets as JSON', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetsCommand(api, configService, output);

    await cmd.run({ workspace: 'workspace' }, makeContext(true));

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.workspace).toBe('workspace');
    expect(data.count).toBe(1);
    expect(data.snippets).toHaveLength(1);
  });

  it('should show empty message when no snippets found', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi([]);
    const cmd = new ListSnippetsCommand(api, configService, output);

    await cmd.run({ workspace: 'workspace' }, makeContext());

    expect(output.logs.some((log) => log.includes('No snippets found'))).toBe(
      true
    );
  });

  it('should resolve workspace from config when not provided', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'my-ws',
    });
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetsCommand(api, configService, output);

    await cmd.run({}, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.workspace).toBe('my-ws');
  });

  it('should throw when no workspace available', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({});
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetsCommand(api, configService, output);

    await expect(cmd.run({}, { globalOptions: {} })).rejects.toThrow(
      'No workspace specified'
    );
  });

  it('should validate role option', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetsCommand(api, configService, output);

    await expect(cmd.run({ role: 'invalid' }, makeContext())).rejects.toThrow(
      '--role must be one of'
    );
  });

  it('should pass role filter to API', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetsCommand(api, configService, output);

    await cmd.run({ role: 'owner', workspace: 'workspace' }, makeContext(true));

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
  });

  it('should respect limit option', async () => {
    const manySnippets = Array.from({ length: 10 }, (_, i) => ({
      ...mockSnippet,
      id: `snip${i}` as unknown as number,
      title: `Snippet ${i}`,
    }));
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi(manySnippets);
    const cmd = new ListSnippetsCommand(api, configService, output);

    await cmd.run({ limit: '3', workspace: 'workspace' }, makeContext(true));

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.count).toBe(3);
  });
});

// --- ViewSnippetCommand ---

describe('ViewSnippetCommand', () => {
  it('should display snippet details as text', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ViewSnippetCommand(api, configService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext());

    expect(output.logs.some((log) => log.includes('Test snippet'))).toBe(true);
    expect(output.logs.some((log) => log.includes('foo.txt'))).toBe(true);
  });

  it('should display snippet as JSON', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ViewSnippetCommand(api, configService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext(true));

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.title).toBe('Test snippet');
  });

  it('should show web URL in text output', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ViewSnippetCommand(api, configService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext());

    expect(
      output.logs.some((log) =>
        log.includes('https://bitbucket.org/snippets/workspace/kypj')
      )
    ).toBe(true);
  });

  it('should throw when no workspace available', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({});
    const api = createMockSnippetsApi();
    const cmd = new ViewSnippetCommand(api, configService, output);

    await expect(
      cmd.run({ id: 'kypj' }, { globalOptions: {} })
    ).rejects.toThrow('No workspace specified');
  });
});

// --- CreateSnippetCommand ---

describe('CreateSnippetCommand', () => {
  it('should create snippet and show success', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new CreateSnippetCommand(api, configService, output);

    await cmd.run(
      { title: 'My snippet', file: ['package.json'] },
      makeContext()
    );

    expect(output.logs.some((log) => log.includes('Created snippet'))).toBe(
      true
    );
  });

  it('should create snippet with JSON output', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new CreateSnippetCommand(api, configService, output);

    await cmd.run(
      { title: 'My snippet', file: ['package.json'], workspace: 'workspace' },
      makeContext(true)
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
  });

  it('should throw when title is missing', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new CreateSnippetCommand(api, configService, output);

    await expect(
      cmd.run({ file: ['file.txt'] }, makeContext())
    ).rejects.toThrow('title is required');
  });

  it('should throw when no files provided', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new CreateSnippetCommand(api, configService, output);

    await expect(cmd.run({ title: 'Test' }, makeContext())).rejects.toThrow(
      'At least one file is required'
    );
  });

  it('should throw when file does not exist', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new CreateSnippetCommand(api, configService, output);

    await expect(
      cmd.run(
        { title: 'Test', file: ['nonexistent-file-xyz.txt'] },
        makeContext()
      )
    ).rejects.toThrow('File not found');
  });
});

// --- EditSnippetCommand ---

describe('EditSnippetCommand', () => {
  it('should edit snippet title', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new EditSnippetCommand(api, configService, output);

    await cmd.run(
      { id: 'kypj', title: 'New title', workspace: 'workspace' },
      makeContext()
    );

    expect(
      output.logs.some((log) => log.includes('Updated snippet kypj'))
    ).toBe(true);
  });

  it('should edit snippet with JSON output', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new EditSnippetCommand(api, configService, output);

    await cmd.run(
      { id: 'kypj', title: 'New title', workspace: 'workspace' },
      makeContext(true)
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
  });

  it('should throw when no edit options provided', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new EditSnippetCommand(api, configService, output);

    await expect(
      cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext())
    ).rejects.toThrow('At least one of');
  });
});

// --- DeleteSnippetCommand ---

describe('DeleteSnippetCommand', () => {
  it('should delete snippet with --yes flag', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    let deletedId: string | undefined;
    const api = createMockSnippetsApi([], {
      onDeleteCall: (req) => {
        deletedId = (req as { encodedId: string }).encodedId;
      },
    });
    const cmd = new DeleteSnippetCommand(api, configService, output);

    await cmd.run(
      { id: 'kypj', yes: true, workspace: 'workspace' },
      makeContext()
    );

    expect(
      output.logs.some((log) => log.includes('Deleted snippet kypj'))
    ).toBe(true);
    expect(deletedId).toBe('kypj');
  });

  it('should delete snippet with JSON output', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new DeleteSnippetCommand(api, configService, output);

    await cmd.run(
      { id: 'kypj', yes: true, workspace: 'workspace' },
      makeContext(true)
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.success).toBe(true);
    expect(data.snippetId).toBe('kypj');
  });

  it('should throw without --yes flag', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new DeleteSnippetCommand(api, configService, output);

    await expect(
      cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext())
    ).rejects.toThrow('Use --yes to confirm deletion');
  });
});

// --- WatchSnippetCommand ---

describe('WatchSnippetCommand', () => {
  it('should watch a snippet', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new WatchSnippetCommand(api, configService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext());

    expect(
      output.logs.some((log) => log.includes('Now watching snippet kypj'))
    ).toBe(true);
  });

  it('should watch with JSON output', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new WatchSnippetCommand(api, configService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext(true));

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.success).toBe(true);
    expect(data.watching).toBe(true);
  });
});

// --- UnwatchSnippetCommand ---

describe('UnwatchSnippetCommand', () => {
  it('should unwatch a snippet', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new UnwatchSnippetCommand(api, configService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext());

    expect(
      output.logs.some((log) => log.includes('Stopped watching snippet kypj'))
    ).toBe(true);
  });

  it('should unwatch with JSON output', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new UnwatchSnippetCommand(api, configService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext(true));

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.success).toBe(true);
    expect(data.watching).toBe(false);
  });
});

// --- ListSnippetCommentsCommand ---

describe('ListSnippetCommentsCommand', () => {
  it('should list comments as table', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetCommentsCommand(api, configService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext());

    expect(output.logs.some((log) => log.startsWith('table:'))).toBe(true);
    const rows = getTableRows(output.logs);
    expect(rows.length).toBe(1);
  });

  it('should list comments as JSON', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetCommentsCommand(api, configService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext(true));

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.snippetId).toBe('kypj');
    expect(data.count).toBe(1);
    expect(data.comments).toHaveLength(1);
  });

  it('should show empty message when no comments', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const emptyApi = {
      ...createMockSnippetsApi(),
      snippetsWorkspaceEncodedIdCommentsGet: async () => ({
        data: { values: [], size: 0, next: undefined },
      }),
    } as unknown as SnippetsApi;
    const cmd = new ListSnippetCommentsCommand(emptyApi, configService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext());

    expect(output.logs.some((log) => log.includes('No comments found'))).toBe(
      true
    );
  });
});

// --- AddSnippetCommentCommand ---

describe('AddSnippetCommentCommand', () => {
  it('should add a comment', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new AddSnippetCommentCommand(api, configService, output);

    await cmd.run(
      { id: 'kypj', message: 'Great snippet!', workspace: 'workspace' },
      makeContext()
    );

    expect(output.logs.some((log) => log.includes('Added comment'))).toBe(true);
  });

  it('should add comment with JSON output', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new AddSnippetCommentCommand(api, configService, output);

    await cmd.run(
      { id: 'kypj', message: 'Great!', workspace: 'workspace' },
      makeContext(true)
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.success).toBe(true);
    expect(data.snippetId).toBe('kypj');
  });

  it('should throw when message is missing', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new AddSnippetCommentCommand(api, configService, output);

    await expect(
      cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext())
    ).rejects.toThrow('message is required');
  });
});

// --- EditSnippetCommentCommand ---

describe('EditSnippetCommentCommand', () => {
  it('should edit a comment', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new EditSnippetCommentCommand(api, configService, output);

    await cmd.run(
      {
        snippetId: 'kypj',
        commentId: '1',
        message: 'Updated',
        workspace: 'workspace',
      },
      makeContext()
    );

    expect(output.logs.some((log) => log.includes('Updated comment #1'))).toBe(
      true
    );
  });

  it('should edit comment with JSON output', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new EditSnippetCommentCommand(api, configService, output);

    await cmd.run(
      {
        snippetId: 'kypj',
        commentId: '1',
        message: 'Updated',
        workspace: 'workspace',
      },
      makeContext(true)
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.success).toBe(true);
  });

  it('should throw for invalid comment ID', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new EditSnippetCommentCommand(api, configService, output);

    await expect(
      cmd.run(
        {
          snippetId: 'kypj',
          commentId: 'abc',
          message: 'Updated',
          workspace: 'workspace',
        },
        makeContext()
      )
    ).rejects.toThrow('must be a valid integer');
  });
});

// --- DeleteSnippetCommentCommand ---

describe('DeleteSnippetCommentCommand', () => {
  it('should delete a comment with --yes flag', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new DeleteSnippetCommentCommand(api, configService, output);

    await cmd.run(
      {
        snippetId: 'kypj',
        commentId: '1',
        yes: true,
        workspace: 'workspace',
      },
      makeContext()
    );

    expect(output.logs.some((log) => log.includes('Deleted comment #1'))).toBe(
      true
    );
  });

  it('should delete comment with JSON output', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new DeleteSnippetCommentCommand(api, configService, output);

    await cmd.run(
      {
        snippetId: 'kypj',
        commentId: '1',
        yes: true,
        workspace: 'workspace',
      },
      makeContext(true)
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.success).toBe(true);
    expect(data.commentId).toBe(1);
  });

  it('should throw without --yes flag', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new DeleteSnippetCommentCommand(api, configService, output);

    await expect(
      cmd.run(
        { snippetId: 'kypj', commentId: '1', workspace: 'workspace' },
        makeContext()
      )
    ).rejects.toThrow('Use --yes to confirm deletion');
  });

  it('should throw for invalid comment ID', async () => {
    const output = createMockOutputService();
    const configService = createMockConfigService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new DeleteSnippetCommentCommand(api, configService, output);

    await expect(
      cmd.run(
        {
          snippetId: 'kypj',
          commentId: 'invalid',
          yes: true,
          workspace: 'workspace',
        },
        makeContext()
      )
    ).rejects.toThrow('must be a valid integer');
  });
});
