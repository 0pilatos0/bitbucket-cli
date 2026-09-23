/**
 * Repository downloads command tests
 */

import { describe, it, expect } from 'bun:test';
import { ListDownloadsCommand } from '../../src/commands/repo/downloads.list.command.js';
import { UploadDownloadCommand } from '../../src/commands/repo/downloads.upload.command.js';
import { DeleteDownloadCommand } from '../../src/commands/repo/downloads.delete.command.js';
import type { DownloadsApi } from '../../src/generated/api.js';
import { APIError, BBError, ErrorCode } from '../../src/types/errors.js';
import {
  createMockContextService,
  createMockOutputService,
  createMockPromptService,
} from '../setup.js';

const mockDownloads = [
  {
    type: 'download',
    name: 'app-1.0.0.tar.gz',
    size: 2048,
    downloads: 7,
    created_on: '2024-01-01T00:00:00.000Z',
    user: { display_name: 'Test User' },
  },
  {
    type: 'download',
    name: 'notes.txt',
    size: 12,
    downloads: 0,
    created_on: '2024-01-02T00:00:00.000Z',
  },
];

interface Recorded {
  listParams: Array<Record<string, unknown> | undefined>;
  upload?: { request: unknown; data: unknown; headers: unknown };
  deleted?: { filename: string; workspace: string; repoSlug: string };
}

function createMockDownloadsApi(options: { deleteNotFound?: boolean } = {}): {
  api: DownloadsApi;
  recorded: Recorded;
} {
  const recorded: Recorded = { listParams: [] };
  const api = {
    repositoriesWorkspaceRepoSlugDownloadsGet: async (
      _request: unknown,
      axiosOptions?: { params?: { page: number; pagelen: number } }
    ) => {
      recorded.listParams.push(axiosOptions?.params);
      const page = axiosOptions?.params?.page ?? 1;
      const pagelen = axiosOptions?.params?.pagelen ?? 10;
      const start = (page - 1) * pagelen;
      return {
        data: {
          page,
          pagelen,
          size: mockDownloads.length,
          values: mockDownloads.slice(start, start + pagelen),
          next:
            start + pagelen < mockDownloads.length
              ? `https://api.bitbucket.org/2.0/repositories/workspace/repo/downloads?page=${page + 1}`
              : undefined,
        },
      };
    },
    repositoriesWorkspaceRepoSlugDownloadsPost: async (
      request: unknown,
      axiosOptions?: { data?: unknown; headers?: unknown }
    ) => {
      recorded.upload = {
        request,
        data: axiosOptions?.data,
        headers: axiosOptions?.headers,
      };
      return { data: undefined };
    },
    repositoriesWorkspaceRepoSlugDownloadsFilenameDelete: async (request: {
      filename: string;
      workspace: string;
      repoSlug: string;
    }) => {
      if (options.deleteNotFound) {
        throw new APIError('Resource not found', 404);
      }
      recorded.deleted = request;
      return { data: undefined };
    },
  } as unknown as DownloadsApi;
  return { api, recorded };
}

function repoContextService() {
  return createMockContextService({ workspace: 'workspace', repoSlug: 'repo' });
}

function getJsonPayload(logs: string[]): Record<string, unknown> {
  const jsonLog = logs.find((log) => log.startsWith('json:'));
  expect(jsonLog).toBeDefined();
  return JSON.parse(jsonLog!.substring('json:'.length)) as Record<
    string,
    unknown
  >;
}

describe('ListDownloadsCommand', () => {
  it('renders the downloads table', async () => {
    const output = createMockOutputService();
    const { api, recorded } = createMockDownloadsApi();
    const cmd = new ListDownloadsCommand(api, repoContextService(), output);

    await cmd.run({}, { globalOptions: {} });

    expect(recorded.listParams[0]).toEqual({ page: 1, pagelen: 25 });
    expect(output.logs).toContain(
      'table:NAME,SIZE,DOWNLOADS,UPLOADED BY,CREATED'
    );
    const rowsLog = output.logs.find((log) => log.startsWith('table-rows:'));
    expect(JSON.parse(rowsLog!.substring('table-rows:'.length))).toEqual([
      [
        'app-1.0.0.tar.gz',
        '2048',
        '7',
        'Test User',
        '2024-01-01T00:00:00.000Z',
      ],
      ['notes.txt', '12', '0', '-', '2024-01-02T00:00:00.000Z'],
    ]);
  });

  it('emits the downloads envelope in JSON mode', async () => {
    const output = createMockOutputService();
    const { api } = createMockDownloadsApi();
    const cmd = new ListDownloadsCommand(api, repoContextService(), output);

    await cmd.run({}, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'count',
      'downloads',
    ]);
    expect(payload.count).toBe(2);
  });

  it('caps at --limit and hints that more exist', async () => {
    const output = createMockOutputService();
    const { api } = createMockDownloadsApi();
    const cmd = new ListDownloadsCommand(api, repoContextService(), output);

    await cmd.run({ limit: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('Showing 1 downloads'))).toBe(
      true
    );
  });
});

describe('UploadDownloadCommand', () => {
  it('sends every file as a multipart `files` field', async () => {
    const output = createMockOutputService();
    const { api, recorded } = createMockDownloadsApi();
    const cmd = new UploadDownloadCommand(api, repoContextService(), output);

    await cmd.run(
      { files: ['package.json', 'tsconfig.json'] },
      { globalOptions: {} }
    );

    expect(recorded.upload!.request).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    expect(recorded.upload!.headers).toEqual({
      'Content-Type': 'multipart/form-data',
    });
    const form = recorded.upload!.data as FormData;
    const parts = form.getAll('files') as File[];
    expect(parts.map((part) => part.name)).toEqual([
      'package.json',
      'tsconfig.json',
    ]);
    expect(await parts[0]!.text()).toBe(await Bun.file('package.json').text());
    expect(output.logs).toContain(
      'success:Uploaded package.json, tsconfig.json to workspace/repo downloads'
    );
  });

  it('uploads under the basename of a nested path', async () => {
    const output = createMockOutputService();
    const { api, recorded } = createMockDownloadsApi();
    const cmd = new UploadDownloadCommand(api, repoContextService(), output);

    await cmd.run(
      { files: ['tests/setup.ts'] },
      { globalOptions: { json: true } }
    );

    const form = recorded.upload!.data as FormData;
    expect((form.getAll('files') as File[]).map((part) => part.name)).toEqual([
      'setup.ts',
    ]);
    expect(getJsonPayload(output.logs)).toEqual({
      success: true,
      workspace: 'workspace',
      repoSlug: 'repo',
      uploaded: ['setup.ts'],
    });
  });

  it('fails before any request when a file is missing', async () => {
    const output = createMockOutputService();
    const { api, recorded } = createMockDownloadsApi();
    const cmd = new UploadDownloadCommand(api, repoContextService(), output);

    const error = await cmd
      .run({ files: ['package.json', 'nope.bin'] }, { globalOptions: {} })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BBError);
    expect((error as BBError).code).toBe(ErrorCode.FILE_NOT_FOUND);
    expect((error as Error).message).toBe('File not found: nope.bin');
    expect(recorded.upload).toBeUndefined();
  });

  it('rejects two files that share a basename', async () => {
    const output = createMockOutputService();
    const { api, recorded } = createMockDownloadsApi();
    const cmd = new UploadDownloadCommand(api, repoContextService(), output);

    const error = await cmd
      .run(
        { files: ['package.json', 'docs/package.json'] },
        { globalOptions: {} }
      )
      .catch((e: unknown) => e);

    expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    expect((error as Error).message).toContain("'package.json'");
    expect(recorded.upload).toBeUndefined();
  });

  it('rejects a directory', async () => {
    const output = createMockOutputService();
    const { api, recorded } = createMockDownloadsApi();
    const cmd = new UploadDownloadCommand(api, repoContextService(), output);

    const error = await cmd
      .run({ files: ['tests'] }, { globalOptions: {} })
      .catch((e: unknown) => e);

    expect((error as BBError).code).toBe(ErrorCode.VALIDATION_INVALID);
    expect((error as Error).message).toBe("'tests' is a directory, not a file");
    expect(recorded.upload).toBeUndefined();
  });
});

describe('DeleteDownloadCommand', () => {
  it('requires --yes', async () => {
    const output = createMockOutputService();
    const { api, recorded } = createMockDownloadsApi();
    const cmd = new DeleteDownloadCommand(api, repoContextService(), output);

    await expect(
      cmd.run({ filename: 'notes.txt' }, { globalOptions: {} })
    ).rejects.toThrow('Use --yes to confirm.');
    expect(recorded.deleted).toBeUndefined();
  });

  it('asks for confirmation in an interactive terminal', async () => {
    const output = createMockOutputService();
    const prompt = createMockPromptService([true]);
    const { api, recorded } = createMockDownloadsApi();
    const cmd = new DeleteDownloadCommand(api, repoContextService(), output);

    await cmd.run({ filename: 'notes.txt' }, { globalOptions: {}, prompt });

    expect(prompt.calls).toEqual([
      "confirm:This will permanently delete download 'notes.txt' from workspace/repo. Continue?",
    ]);
    expect(recorded.deleted).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      filename: 'notes.txt',
    });
  });

  it('deletes the named artifact', async () => {
    const output = createMockOutputService();
    const { api, recorded } = createMockDownloadsApi();
    const cmd = new DeleteDownloadCommand(api, repoContextService(), output);

    await cmd.run({ filename: 'notes.txt', yes: true }, { globalOptions: {} });

    expect(recorded.deleted).toEqual({
      workspace: 'workspace',
      repoSlug: 'repo',
      filename: 'notes.txt',
    });
    expect(output.logs).toContain(
      "success:Deleted download 'notes.txt' from workspace/repo"
    );
  });

  it('emits a JSON result', async () => {
    const output = createMockOutputService();
    const { api } = createMockDownloadsApi();
    const cmd = new DeleteDownloadCommand(api, repoContextService(), output);

    await cmd.run(
      { filename: 'notes.txt', yes: true },
      { globalOptions: { json: true } }
    );

    expect(getJsonPayload(output.logs)).toEqual({
      success: true,
      workspace: 'workspace',
      repoSlug: 'repo',
      filename: 'notes.txt',
    });
  });

  it('names the artifact when it does not exist', async () => {
    const output = createMockOutputService();
    const { api } = createMockDownloadsApi({ deleteNotFound: true });
    const cmd = new DeleteDownloadCommand(api, repoContextService(), output);

    await expect(
      cmd.run({ filename: 'gone.txt', yes: true }, { globalOptions: {} })
    ).rejects.toThrow("Download 'gone.txt' not found in workspace/repo.");
  });
});
