/**
 * SnippetFilesService tests — verify the actual HTTP contract
 * (multipart form for create/edit-with-files; JSON for metadata edit;
 * raw text for file content) without talking to Bitbucket.
 */

import { describe, it, expect, afterEach } from 'bun:test';
import axios from 'axios';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SnippetFilesService } from '../../src/services/snippet-files.service.js';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

/** A queued adapter response: either a raw payload or a {status, ...} error. */
interface StubResponse {
  status?: number;
  statusText?: string;
  data?: unknown;
}

interface CapturedRequest {
  url?: string;
  method?: string;
  data?: unknown;
  headers?: Record<string, string>;
  responseType?: string;
}

/** Normalize one queued entry into a {data, status, statusText} result. */
function toResponse(entry: unknown): {
  data: unknown;
  status: number;
  statusText: string;
} {
  if (typeof entry === 'object' && entry !== null) {
    const { status, statusText, data } = entry as StubResponse;
    if (status !== undefined) {
      return { data: data ?? {}, status, statusText: statusText ?? '' };
    }
    return { data: data ?? entry, status: 200, statusText: 'OK' };
  }
  return { data: entry ?? { ok: true }, status: 200, statusText: 'OK' };
}

function createStubAxios(
  captured: CapturedRequest[],
  responses: unknown[] = []
) {
  const instance = axios.create();
  // Replace the adapter so requests never leave the process
  instance.defaults.adapter = async (config) => {
    captured.push({
      url: config.url,
      method: config.method,
      data: config.data,
      headers: (config.headers ?? {}) as Record<string, string>,
      responseType: config.responseType,
    });
    const { data, status, statusText } = toResponse(responses.shift());
    if (status >= 400) {
      throw new axios.AxiosError(
        statusText || `Request failed with status code ${status}`,
        undefined,
        config,
        undefined,
        { data, status, statusText, headers: {}, config }
      );
    }
    return { data, status, statusText, headers: {}, config };
  };
  return instance;
}

/** Service wired to a stub adapter, with the captured request log. */
function makeService(responses: unknown[] = []): {
  svc: SnippetFilesService;
  captured: CapturedRequest[];
} {
  const captured: CapturedRequest[] = [];
  return {
    svc: new SnippetFilesService(createStubAxios(captured, responses)),
    captured,
  };
}

/** The first 'file' part of a multipart form, as a real File. */
function filePart(form: FormData, index = 0): File {
  const part = form.getAll('file')[index];
  if (typeof part === 'string') {
    throw new Error('expected a binary file part');
  }
  return part;
}

function writeTempFile(name: string, contents: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-snippet-'));
  tempDirs.push(dir);
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, contents);
  return filePath;
}

async function formDataToString(data: unknown): Promise<string> {
  if (!(data instanceof FormData)) {
    return '';
  }
  const entries: string[] = [];
  for (const [key, value] of data.entries()) {
    if (value instanceof Blob) {
      const text = await value.text();
      entries.push(`${key}:blob(${text})`);
    } else {
      entries.push(`${key}:${String(value)}`);
    }
  }
  return entries.join('|');
}

describe('SnippetFilesService', () => {
  describe('createWithFiles', () => {
    it('POSTs multipart/form-data with title, is_private and file parts', async () => {
      const { svc, captured } = makeService([{ id: 'abc' }]);
      const filePath = writeTempFile('hello.txt', 'hello world');

      const result = await svc.createWithFiles({
        workspace: 'my-ws',
        title: 'My snippet',
        isPrivate: true,
        files: [{ path: filePath }],
      });

      expect(result).toEqual({ id: 'abc' });
      expect(captured.length).toBe(1);
      const req = captured[0];
      expect(req.method?.toLowerCase()).toBe('post');
      expect(req.url).toBe('/snippets/my-ws');
      expect(req.headers?.['Content-Type']).toBe('multipart/form-data');
      expect(req.data).toBeInstanceOf(FormData);

      const flat = await formDataToString(req.data);
      expect(flat).toContain('title:My snippet');
      expect(flat).toContain('is_private:true');
      expect(flat).toContain('file:blob(hello world)');
    });

    it('URL-encodes workspace slug', async () => {
      const { svc, captured } = makeService();
      const filePath = writeTempFile('a.txt', 'a');

      await svc.createWithFiles({
        workspace: 'ws with space',
        title: 't',
        isPrivate: false,
        files: [{ path: filePath }],
      });

      expect(captured[0].url).toBe('/snippets/ws%20with%20space');
    });

    it('sends is_private=false for public snippets', async () => {
      const { svc, captured } = makeService();
      const filePath = writeTempFile('a.txt', 'a');

      await svc.createWithFiles({
        workspace: 'ws',
        title: 't',
        isPrivate: false,
        files: [{ path: filePath }],
      });

      const flat = await formDataToString(captured[0].data);
      expect(flat).toContain('is_private:false');
    });

    it('includes multiple files as separate parts', async () => {
      const { svc, captured } = makeService();
      const f1 = writeTempFile('one.txt', 'AAA');
      const f2 = writeTempFile('two.txt', 'BBB');

      await svc.createWithFiles({
        workspace: 'ws',
        title: 't',
        isPrivate: true,
        files: [{ path: f1 }, { path: f2 }],
      });

      const form = captured[0].data as FormData;
      const files = form.getAll('file');
      expect(files.length).toBe(2);
      const contents = await Promise.all(files.map((v) => (v as Blob).text()));
      expect(contents.sort()).toEqual(['AAA', 'BBB']);
    });

    it('uses the filename override as the multipart part name', async () => {
      const { svc, captured } = makeService();
      const filePath = writeTempFile('a.txt', 'contents');

      await svc.createWithFiles({
        workspace: 'ws',
        title: 't',
        isPrivate: true,
        files: [{ path: filePath, filename: 'renamed.txt' }],
      });

      const form = captured[0].data as FormData;
      expect(filePart(form).name).toBe('renamed.txt');
    });

    it('defaults the part name to the file basename', async () => {
      const { svc, captured } = makeService();
      const filePath = writeTempFile('base-name.txt', 'contents');

      await svc.createWithFiles({
        workspace: 'ws',
        title: 't',
        isPrivate: true,
        files: [{ path: filePath }],
      });

      const form = captured[0].data as FormData;
      expect(filePart(form).name).toBe('base-name.txt');
    });

    it('sends a form without file parts when files is empty', async () => {
      const { svc, captured } = makeService();

      await svc.createWithFiles({
        workspace: 'ws',
        title: 't',
        isPrivate: true,
        files: [],
      });

      const flat = await formDataToString(captured[0].data);
      expect(flat).toContain('title:t');
      expect(flat).not.toContain('file:');
    });

    it('propagates API errors from the multipart POST', async () => {
      const { svc } = makeService([
        { status: 500, statusText: 'Server Error' },
      ]);
      const filePath = writeTempFile('a.txt', 'a');

      const rejection = svc.createWithFiles({
        workspace: 'ws',
        title: 't',
        isPrivate: true,
        files: [{ path: filePath }],
      });
      await expect(rejection).rejects.toBeInstanceOf(axios.AxiosError);
      await expect(rejection).rejects.toMatchObject({
        response: { status: 500 },
      });
    });

    it('propagates a missing-file error from readFileSync', async () => {
      const { svc, captured } = makeService();
      const missingPath = path.join(os.tmpdir(), 'bb-missing', 'nope.txt');

      await expect(
        svc.createWithFiles({
          workspace: 'ws',
          title: 't',
          isPrivate: true,
          files: [{ path: missingPath }],
        })
      ).rejects.toMatchObject({ code: 'ENOENT' });
      expect(captured).toHaveLength(0);
    });
  });

  describe('editMetadata', () => {
    it('PUTs JSON body with only provided fields', async () => {
      const { svc, captured } = makeService([{ id: 'kypj' }]);

      await svc.editMetadata({
        workspace: 'ws',
        encodedId: 'kypj',
        title: 'New',
      });

      const req = captured[0];
      expect(req.method?.toLowerCase()).toBe('put');
      expect(req.url).toBe('/snippets/ws/kypj');
      expect(req.headers?.['Content-Type']).toBe('application/json');
      // axios serializes the body; it's available as a string in req.data
      const parsed =
        typeof req.data === 'string'
          ? JSON.parse(req.data)
          : (req.data as Record<string, unknown>);
      expect(parsed).toEqual({ title: 'New' });
    });

    it('includes is_private when provided', async () => {
      const { svc, captured } = makeService();

      await svc.editMetadata({
        workspace: 'ws',
        encodedId: 'kypj',
        isPrivate: false,
      });

      const req = captured[0];
      const parsed =
        typeof req.data === 'string'
          ? JSON.parse(req.data)
          : (req.data as Record<string, unknown>);
      expect(parsed).toEqual({ is_private: false });
    });

    it('propagates API errors from the JSON PUT', async () => {
      const { svc } = makeService([{ status: 400, statusText: 'Bad Request' }]);

      const rejection = svc.editMetadata({
        workspace: 'ws',
        encodedId: 'kypj',
        title: 'New',
      });
      await expect(rejection).rejects.toBeInstanceOf(axios.AxiosError);
      await expect(rejection).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  describe('editWithFiles', () => {
    it('PUTs multipart/form-data when files are supplied', async () => {
      const { svc, captured } = makeService();
      const filePath = writeTempFile('up.txt', 'updated');

      await svc.editWithFiles({
        workspace: 'ws',
        encodedId: 'kypj',
        title: 'T',
        files: [{ path: filePath }],
      });

      const req = captured[0];
      expect(req.method?.toLowerCase()).toBe('put');
      expect(req.url).toBe('/snippets/ws/kypj');
      expect(req.headers?.['Content-Type']).toBe('multipart/form-data');
      const flat = await formDataToString(req.data);
      expect(flat).toContain('title:T');
      expect(flat).toContain('file:blob(updated)');
    });

    it('omits title and is_private parts when not provided', async () => {
      const { svc, captured } = makeService();
      const filePath = writeTempFile('up.txt', 'updated');

      await svc.editWithFiles({
        workspace: 'ws',
        encodedId: 'kypj',
        files: [{ path: filePath }],
      });

      const flat = await formDataToString(captured[0].data);
      expect(flat).toContain('file:blob(updated)');
      expect(flat).not.toContain('title:');
      expect(flat).not.toContain('is_private:');
    });

    it('propagates API errors from the multipart PUT', async () => {
      const { svc } = makeService([{ status: 403, statusText: 'Forbidden' }]);
      const filePath = writeTempFile('up.txt', 'updated');

      const rejection = svc.editWithFiles({
        workspace: 'ws',
        encodedId: 'kypj',
        files: [{ path: filePath }],
      });
      await expect(rejection).rejects.toBeInstanceOf(axios.AxiosError);
      await expect(rejection).rejects.toMatchObject({
        response: { status: 403 },
      });
    });
  });

  describe('getFileContent', () => {
    it('GETs raw file content with text response type', async () => {
      const { svc, captured } = makeService(['hello file']);

      const result = await svc.getFileContent('ws', 'kypj', 'path/to/file.txt');

      expect(result).toBe('hello file');
      expect(captured[0].url).toBe('/snippets/ws/kypj/files/path/to/file.txt');
      expect(captured[0].responseType).toBe('text');
    });

    it('URL-encodes path segments while preserving slashes', async () => {
      const { svc, captured } = makeService(['x']);

      await svc.getFileContent('ws', 'kypj', 'dir name/sub/f oo.txt');
      expect(captured[0].url).toBe(
        '/snippets/ws/kypj/files/dir%20name/sub/f%20oo.txt'
      );
    });

    it('coerces non-string raw responses to strings', async () => {
      const { svc } = makeService([{ data: 12345 }]);

      const result = await svc.getFileContent('ws', 'kypj', 'a.txt');

      expect(result).toBe('12345');
    });

    it('propagates 404 errors from the raw-file fetch', async () => {
      const { svc } = makeService([{ status: 404, statusText: 'Not Found' }]);

      const rejection = svc.getFileContent('ws', 'kypj', 'missing.txt');
      await expect(rejection).rejects.toBeInstanceOf(axios.AxiosError);
      await expect(rejection).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });
});
