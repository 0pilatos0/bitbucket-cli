/**
 * Integration test for `bb repo downloads upload`: the real generated
 * DownloadsApi and axios stack against a local server, so the multipart form
 * sent through request options (the spec models no body) is checked on the
 * wire rather than against a stub.
 */

import { afterAll, describe, expect, it } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DownloadsApi } from '../../src/generated/api.js';
import { UploadDownloadCommand } from '../../src/commands/repo/downloads.upload.command.js';
import { buildApiFor } from '../helpers/mock-bitbucket.js';
import {
  createMockContextService,
  createMockCredentialStoreOnly,
  createMockOutputService,
} from '../setup.js';

interface CapturedUpload {
  method: string;
  path: string;
  contentType: string;
  parts: { field: string; name: string; text: string }[];
}

const cleanups: Array<() => Promise<void>> = [];

afterAll(async () => {
  await Promise.all(cleanups.map((cleanup) => cleanup()));
});

describe('mock Bitbucket integration (repo downloads upload)', () => {
  it('sends each file as a named `files` part of a multipart form', async () => {
    const captured: CapturedUpload[] = [];
    const server = Bun.serve({
      hostname: '127.0.0.1',
      port: 0,
      async fetch(request) {
        const form = await request.formData();
        const parts = await Promise.all(
          Array.from(form.entries()).map(async ([field, value]) => {
            const file = value as File;
            return { field, name: file.name, text: await file.text() };
          })
        );
        captured.push({
          method: request.method,
          path: new URL(request.url).pathname,
          contentType: request.headers.get('content-type') ?? '',
          parts,
        });
        return new Response(null, { status: 201 });
      },
    });
    const dir = await mkdtemp(join(tmpdir(), 'bb-downloads-'));
    cleanups.push(async () => {
      server.stop(true);
      await rm(dir, { recursive: true, force: true });
    });
    await writeFile(join(dir, 'hello.txt'), 'hello\n');
    await writeFile(join(dir, 'notes.md'), '# notes\n');

    const output = createMockOutputService();
    const downloadsApi = buildApiFor(
      server.url.origin,
      createMockCredentialStoreOnly({
        username: 'tester',
        apiToken: 'test-token',
      }),
      output,
      DownloadsApi
    );
    const cmd = new UploadDownloadCommand(
      downloadsApi,
      createMockContextService({ workspace: 'workspace', repoSlug: 'repo' }),
      output
    );

    await cmd.run(
      { files: [join(dir, 'hello.txt'), join(dir, 'notes.md')] },
      { globalOptions: {} }
    );

    expect(captured).toHaveLength(1);
    const [upload] = captured;
    expect(upload!.method).toBe('POST');
    expect(upload!.path).toBe('/repositories/workspace/repo/downloads');
    expect(upload!.contentType).toStartWith('multipart/form-data');
    expect(upload!.contentType).toContain('boundary=');
    expect(upload!.parts).toEqual([
      { field: 'files', name: 'hello.txt', text: 'hello\n' },
      { field: 'files', name: 'notes.md', text: '# notes\n' },
    ]);
  });

  it('keeps streaming a large upload past the base timeout to a slow reader', async () => {
    const originalTimeout = process.env.BB_HTTP_TIMEOUT;
    process.env.BB_HTTP_TIMEOUT = '500';
    let received = 0;
    const server = Bun.serve({
      hostname: '127.0.0.1',
      port: 0,
      async fetch(request) {
        const reader = request.body!.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value.byteLength;
          await Bun.sleep(250);
        }
        return new Response(null, { status: 201 });
      },
    });
    const dir = await mkdtemp(join(tmpdir(), 'bb-downloads-'));
    cleanups.push(async () => {
      server.stop(true);
      await rm(dir, { recursive: true, force: true });
      if (originalTimeout === undefined) {
        delete process.env.BB_HTTP_TIMEOUT;
      } else {
        process.env.BB_HTTP_TIMEOUT = originalTimeout;
      }
    });
    const size = 4 * 1024 * 1024;
    await writeFile(join(dir, 'big.bin'), new Uint8Array(size));

    const output = createMockOutputService();
    const downloadsApi = buildApiFor(
      server.url.origin,
      createMockCredentialStoreOnly({
        username: 'tester',
        apiToken: 'test-token',
      }),
      output,
      DownloadsApi
    );
    const cmd = new UploadDownloadCommand(
      downloadsApi,
      createMockContextService({ workspace: 'workspace', repoSlug: 'repo' }),
      output
    );

    const started = performance.now();
    await cmd.run({ files: [join(dir, 'big.bin')] }, { globalOptions: {} });

    expect(performance.now() - started).toBeGreaterThan(500);
    expect(received).toBeGreaterThan(size);
    expect(output.logs).toContain(
      'success:Uploaded big.bin to workspace/repo downloads'
    );
  }, 20_000);
});
