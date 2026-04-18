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
  createMockContextService,
  createMockOutputService,
  mockUser,
} from '../setup.js';
import type { SnippetsApi, Snippet } from '../../src/generated/api.js';
import type { CommandContext } from '../../src/core/interfaces/commands.js';
import type { ISnippetFilesService } from '../../src/core/interfaces/services.js';

// --- Mock data ---

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

// --- Helpers ---

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

interface MockSnippetFilesServiceRecord {
  create?: {
    workspace: string;
    title: string;
    isPrivate: boolean;
    files: Array<{ path: string; filename?: string }>;
  };
  editMetadata?: {
    workspace: string;
    encodedId: string;
    title?: string;
    isPrivate?: boolean;
  };
  editWithFiles?: {
    workspace: string;
    encodedId: string;
    title?: string;
    isPrivate?: boolean;
    files: Array<{ path: string; filename?: string }>;
  };
  fileContentCalls: Array<{ filePath: string }>;
}

function createMockSnippetFilesService(fileContent = 'file contents here'): {
  service: ISnippetFilesService;
  record: MockSnippetFilesServiceRecord;
} {
  const record: MockSnippetFilesServiceRecord = { fileContentCalls: [] };
  const service: ISnippetFilesService = {
    async createWithFiles(options) {
      record.create = { ...options };
      return mockSnippet;
    },
    async editMetadata(options) {
      record.editMetadata = { ...options };
      return mockSnippet;
    },
    async editWithFiles(options) {
      record.editWithFiles = { ...options };
      return mockSnippet;
    },
    async getFileContent(_workspace, _encodedId, filePath) {
      record.fileContentCalls.push({ filePath });
      return fileContent;
    },
  };
  return { service, record };
}

function createMockSnippetsApi(
  snippets: (typeof mockSnippet)[] = [mockSnippet],
  comments: (typeof mockComment)[] = [mockComment],
  options: { onDeleteCall?: (request: unknown) => void } = {}
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
    snippetsWorkspaceEncodedIdGet: async () => ({ data: mockSnippet }),
    snippetsWorkspaceEncodedIdDelete: async (request: unknown) => {
      options.onDeleteCall?.(request);
      return { data: undefined };
    },
    snippetsWorkspaceEncodedIdWatchPut: async () => ({ data: undefined }),
    snippetsWorkspaceEncodedIdWatchDelete: async () => ({ data: undefined }),
    snippetsWorkspaceEncodedIdCommentsGet: async (
      _request: unknown,
      axiosOptions?: unknown
    ) => {
      const { page, pagelen } = extractPaginationParams(axiosOptions);
      const start = (page - 1) * pagelen;
      const end = start + pagelen;
      const values = comments.slice(start, end);
      return {
        data: {
          values,
          page,
          pagelen,
          size: comments.length,
          next:
            end < comments.length
              ? `https://api.bitbucket.org/2.0/snippets/workspace/kypj/comments?page=${page + 1}`
              : undefined,
        },
      };
    },
    snippetsWorkspaceEncodedIdCommentsPost: async () => ({ data: mockComment }),
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
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetsCommand(api, contextService, output);

    await cmd.run({ workspace: 'workspace' }, makeContext());

    const rows = getTableRows(output.logs);
    expect(rows.length).toBe(1);
    expect(rows[0][1]).toBe('Test snippet');
  });

  it('should list snippets as JSON', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetsCommand(api, contextService, output);

    await cmd.run({ workspace: 'workspace' }, makeContext(true));

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.workspace).toBe('workspace');
    expect(data.count).toBe(1);
  });

  it('should show empty message when no snippets found', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi([]);
    const cmd = new ListSnippetsCommand(api, contextService, output);

    await cmd.run({ workspace: 'workspace' }, makeContext());

    expect(output.logs.some((log) => log.includes('No snippets found'))).toBe(
      true
    );
  });

  it('should resolve workspace from config when not provided', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'my-ws',
    });
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetsCommand(api, contextService, output);

    await cmd.run({}, { globalOptions: { json: true } });

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.workspace).toBe('my-ws');
  });

  it('should throw when no workspace available', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({});
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetsCommand(api, contextService, output);

    await expect(cmd.run({}, { globalOptions: {} })).rejects.toThrow(
      'No workspace specified'
    );
  });

  it('should reject invalid role', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetsCommand(api, contextService, output);

    await expect(cmd.run({ role: 'invalid' }, makeContext())).rejects.toThrow(
      '--role must be one of'
    );
  });

  it('should accept all three API-valid roles', async () => {
    for (const role of ['owner', 'contributor', 'member']) {
      const output = createMockOutputService();
      const contextService = createMockContextService({
        defaultWorkspace: 'workspace',
      });
      const api = createMockSnippetsApi();
      const cmd = new ListSnippetsCommand(api, contextService, output);
      await cmd.run({ role, workspace: 'workspace' }, makeContext(true));
      const jsonLog = output.logs.find((log) => log.startsWith('json:'));
      expect(jsonLog).toBeDefined();
    }
  });

  it('should respect --limit across pages', async () => {
    const many = Array.from({ length: 80 }, (_, i) => ({
      ...mockSnippet,
      id: `s${i}` as unknown as number,
      title: `Snippet ${i}`,
    }));
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi(many);
    const cmd = new ListSnippetsCommand(api, contextService, output);

    await cmd.run({ limit: '3', workspace: 'workspace' }, makeContext(true));

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.count).toBe(3);
  });
});

// --- ViewSnippetCommand ---

describe('ViewSnippetCommand', () => {
  it('should display snippet details as text with URL', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const { service } = createMockSnippetFilesService();
    const cmd = new ViewSnippetCommand(api, service, contextService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext());

    expect(output.logs.some((log) => log.includes('Test snippet'))).toBe(true);
    expect(output.logs.some((log) => log.includes('foo.txt'))).toBe(true);
    expect(
      output.logs.some((log) =>
        log.includes('https://bitbucket.org/snippets/workspace/kypj')
      )
    ).toBe(true);
  });

  it('should display snippet as JSON', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const { service } = createMockSnippetFilesService();
    const cmd = new ViewSnippetCommand(api, service, contextService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext(true));

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.title).toBe('Test snippet');
  });

  it('should fall back to self link when html link is missing', async () => {
    const snippetNoHtml = {
      ...mockSnippet,
      links: { self: { href: 'https://api.example/selfonly' } },
    };
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = {
      ...createMockSnippetsApi(),
      snippetsWorkspaceEncodedIdGet: async () => ({ data: snippetNoHtml }),
    } as unknown as SnippetsApi;
    const { service } = createMockSnippetFilesService();
    const cmd = new ViewSnippetCommand(api, service, contextService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext());

    expect(
      output.logs.some((log) => log.includes('https://api.example/selfonly'))
    ).toBe(true);
  });

  it('should print a single file with --file', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const { service, record } = createMockSnippetFilesService('hello content');
    const cmd = new ViewSnippetCommand(api, service, contextService, output);

    await cmd.run(
      { id: 'kypj', workspace: 'workspace', file: 'foo.txt' },
      makeContext()
    );

    expect(record.fileContentCalls).toEqual([{ filePath: 'foo.txt' }]);
    expect(output.logs.some((log) => log === 'text:hello content')).toBe(true);
  });

  it('should reject --file when file is not in snippet', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const { service } = createMockSnippetFilesService();
    const cmd = new ViewSnippetCommand(api, service, contextService, output);

    await expect(
      cmd.run(
        { id: 'kypj', workspace: 'workspace', file: 'missing.txt' },
        makeContext()
      )
    ).rejects.toThrow('File not found in snippet');
  });

  it('should print all files with --files', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const { service, record } = createMockSnippetFilesService('aaa');
    const cmd = new ViewSnippetCommand(api, service, contextService, output);

    await cmd.run(
      { id: 'kypj', workspace: 'workspace', files: true },
      makeContext()
    );

    expect(record.fileContentCalls.length).toBe(1);
    expect(output.logs.some((log) => log.includes('── foo.txt ──'))).toBe(true);
  });

  it('should throw when no workspace available', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({});
    const api = createMockSnippetsApi();
    const { service } = createMockSnippetFilesService();
    const cmd = new ViewSnippetCommand(api, service, contextService, output);

    await expect(
      cmd.run({ id: 'kypj' }, { globalOptions: {} })
    ).rejects.toThrow('No workspace specified');
  });
});

// --- CreateSnippetCommand ---

describe('CreateSnippetCommand', () => {
  it('should create snippet via multipart with files and metadata', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service, record } = createMockSnippetFilesService();
    const cmd = new CreateSnippetCommand(service, contextService, output);

    await cmd.run(
      {
        title: 'My snippet',
        file: ['package.json'],
        workspace: 'workspace',
      },
      makeContext()
    );

    expect(record.create).toBeDefined();
    expect(record.create!.workspace).toBe('workspace');
    expect(record.create!.title).toBe('My snippet');
    expect(record.create!.isPrivate).toBe(true); // default
    expect(record.create!.files).toEqual([{ path: 'package.json' }]);
    expect(output.logs.some((log) => log.includes('Created snippet'))).toBe(
      true
    );
  });

  it('should send is_private=false when --public is set', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service, record } = createMockSnippetFilesService();
    const cmd = new CreateSnippetCommand(service, contextService, output);

    await cmd.run(
      {
        title: 'Public',
        file: ['package.json'],
        public: true,
        workspace: 'workspace',
      },
      makeContext()
    );

    expect(record.create!.isPrivate).toBe(false);
  });

  it('should output JSON when --json set', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service } = createMockSnippetFilesService();
    const cmd = new CreateSnippetCommand(service, contextService, output);

    await cmd.run(
      { title: 'X', file: ['package.json'], workspace: 'workspace' },
      makeContext(true)
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    expect(jsonLog).toBeDefined();
  });

  it('should throw when title is missing', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service } = createMockSnippetFilesService();
    const cmd = new CreateSnippetCommand(service, contextService, output);

    await expect(
      cmd.run({ file: ['file.txt'] }, makeContext())
    ).rejects.toThrow('title is required');
  });

  it('should throw when no files provided', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service } = createMockSnippetFilesService();
    const cmd = new CreateSnippetCommand(service, contextService, output);

    await expect(cmd.run({ title: 'Test' }, makeContext())).rejects.toThrow(
      'At least one file is required'
    );
  });

  it('should throw when file does not exist', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service } = createMockSnippetFilesService();
    const cmd = new CreateSnippetCommand(service, contextService, output);

    await expect(
      cmd.run(
        { title: 'Test', file: ['nonexistent-file-xyz.txt'] },
        makeContext()
      )
    ).rejects.toThrow('File not found');
  });

  it('should reject --public and --private together', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service } = createMockSnippetFilesService();
    const cmd = new CreateSnippetCommand(service, contextService, output);

    await expect(
      cmd.run(
        {
          title: 'X',
          file: ['package.json'],
          public: true,
          private: true,
          workspace: 'workspace',
        },
        makeContext()
      )
    ).rejects.toThrow('cannot both be set');
  });
});

// --- EditSnippetCommand ---

describe('EditSnippetCommand', () => {
  it('should edit metadata (title) via JSON path', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service, record } = createMockSnippetFilesService();
    const cmd = new EditSnippetCommand(service, contextService, output);

    await cmd.run(
      { id: 'kypj', title: 'New title', workspace: 'workspace' },
      makeContext()
    );

    expect(record.editMetadata).toEqual({
      workspace: 'workspace',
      encodedId: 'kypj',
      title: 'New title',
      isPrivate: undefined,
    });
    expect(record.editWithFiles).toBeUndefined();
    expect(
      output.logs.some((log) => log.includes('Updated snippet kypj'))
    ).toBe(true);
  });

  it('should send is_private=true when --private', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service, record } = createMockSnippetFilesService();
    const cmd = new EditSnippetCommand(service, contextService, output);

    await cmd.run(
      { id: 'kypj', private: true, workspace: 'workspace' },
      makeContext()
    );

    expect(record.editMetadata!.isPrivate).toBe(true);
  });

  it('should route to multipart when --file is provided', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service, record } = createMockSnippetFilesService();
    const cmd = new EditSnippetCommand(service, contextService, output);

    await cmd.run(
      {
        id: 'kypj',
        file: ['package.json'],
        title: 'T',
        workspace: 'workspace',
      },
      makeContext()
    );

    expect(record.editWithFiles).toBeDefined();
    expect(record.editWithFiles!.files).toEqual([{ path: 'package.json' }]);
    expect(record.editMetadata).toBeUndefined();
  });

  it('should throw when no edit options provided', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service } = createMockSnippetFilesService();
    const cmd = new EditSnippetCommand(service, contextService, output);

    await expect(
      cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext())
    ).rejects.toThrow('At least one of');
  });

  it('should reject --public and --private together', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service } = createMockSnippetFilesService();
    const cmd = new EditSnippetCommand(service, contextService, output);

    await expect(
      cmd.run(
        { id: 'kypj', public: true, private: true, workspace: 'workspace' },
        makeContext()
      )
    ).rejects.toThrow('cannot both be set');
  });

  it('should reject --file pointing to missing file', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const { service } = createMockSnippetFilesService();
    const cmd = new EditSnippetCommand(service, contextService, output);

    await expect(
      cmd.run(
        {
          id: 'kypj',
          file: ['nonexistent-xyz.txt'],
          workspace: 'workspace',
        },
        makeContext()
      )
    ).rejects.toThrow('File not found');
  });
});

// --- DeleteSnippetCommand ---

describe('DeleteSnippetCommand', () => {
  it('should delete snippet with --yes flag', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    let deletedId: string | undefined;
    const api = createMockSnippetsApi([], [], {
      onDeleteCall: (req) => {
        deletedId = (req as { encodedId: string }).encodedId;
      },
    });
    const cmd = new DeleteSnippetCommand(api, contextService, output);

    await cmd.run(
      { id: 'kypj', yes: true, workspace: 'workspace' },
      makeContext()
    );

    expect(
      output.logs.some((log) => log.includes('Deleted snippet kypj'))
    ).toBe(true);
    expect(deletedId).toBe('kypj');
  });

  it('should throw without --yes flag', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new DeleteSnippetCommand(api, contextService, output);

    await expect(
      cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext())
    ).rejects.toThrow('Use --yes to confirm deletion');
  });
});

// --- Watch / Unwatch ---

describe('WatchSnippetCommand', () => {
  it('should watch a snippet', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new WatchSnippetCommand(api, contextService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext());

    expect(
      output.logs.some((log) => log.includes('Now watching snippet kypj'))
    ).toBe(true);
  });
});

describe('UnwatchSnippetCommand', () => {
  it('should unwatch a snippet', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new UnwatchSnippetCommand(api, contextService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext());

    expect(
      output.logs.some((log) => log.includes('Stopped watching snippet kypj'))
    ).toBe(true);
  });
});

// --- Comments ---

describe('ListSnippetCommentsCommand', () => {
  it('should list comments as table', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new ListSnippetCommentsCommand(api, contextService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext());

    const rows = getTableRows(output.logs);
    expect(rows.length).toBe(1);
  });

  it('should respect --limit across pages', async () => {
    const many = Array.from({ length: 80 }, (_, i) => ({
      ...mockComment,
      id: i + 1,
    }));
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi([mockSnippet], many);
    const cmd = new ListSnippetCommentsCommand(api, contextService, output);

    await cmd.run(
      { id: 'kypj', limit: '5', workspace: 'workspace' },
      makeContext(true)
    );

    const jsonLog = output.logs.find((log) => log.startsWith('json:'));
    const data = JSON.parse(jsonLog!.substring(5));
    expect(data.count).toBe(5);
  });

  it('should show empty message when no comments', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi([mockSnippet], []);
    const cmd = new ListSnippetCommentsCommand(api, contextService, output);

    await cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext());

    expect(output.logs.some((log) => log.includes('No comments found'))).toBe(
      true
    );
  });
});

describe('AddSnippetCommentCommand', () => {
  it('should add a comment', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new AddSnippetCommentCommand(api, contextService, output);

    await cmd.run(
      { id: 'kypj', message: 'Great!', workspace: 'workspace' },
      makeContext()
    );

    expect(output.logs.some((log) => log.includes('Added comment'))).toBe(true);
  });

  it('should throw when message is missing', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new AddSnippetCommentCommand(api, contextService, output);

    await expect(
      cmd.run({ id: 'kypj', workspace: 'workspace' }, makeContext())
    ).rejects.toThrow('message is required');
  });
});

describe('EditSnippetCommentCommand', () => {
  it('should edit a comment', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new EditSnippetCommentCommand(api, contextService, output);

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

  it('should throw for invalid comment ID', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new EditSnippetCommentCommand(api, contextService, output);

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

describe('DeleteSnippetCommentCommand', () => {
  it('should delete a comment with --yes flag', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new DeleteSnippetCommentCommand(api, contextService, output);

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

  it('should throw without --yes flag', async () => {
    const output = createMockOutputService();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const api = createMockSnippetsApi();
    const cmd = new DeleteSnippetCommentCommand(api, contextService, output);

    await expect(
      cmd.run(
        { snippetId: 'kypj', commentId: '1', workspace: 'workspace' },
        makeContext()
      )
    ).rejects.toThrow('Use --yes to confirm deletion');
  });
});
