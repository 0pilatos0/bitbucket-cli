import { afterAll, describe, expect, it } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ApiCommand } from '../../src/commands/api.command.js';
import { createApiClient } from '../../src/services/api-client.service.js';
import { buildMultipartForm } from '../../src/services/api-multipart.js';
import { DryRunMode, DryRunStop } from '../../src/services/dry-run.js';
import {
  createMockContextService,
  createMockOAuthService,
  createMockOutputService,
  mockConfigService,
  mockOAuthConfigService,
} from '../setup.js';

const dir = await mkdtemp(join(tmpdir(), 'bb-api-form-'));
const file = join(dir, 'shot.bin');
const binary = new Uint8Array([0, 255, 128, 13, 10]);
await writeFile(file, binary);
afterAll(() => rm(dir, { recursive: true, force: true }));

function setup(status = 200, dryRun = false) {
  const captured: { method: string; type: string; parts: unknown[] }[] = [];
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(request) {
      const form = await request.formData();
      const parts = await Promise.all(
        Array.from(form.entries()).map(async ([key, value]) =>
          typeof value === 'string'
            ? [key, value]
            : [
                key,
                value.name,
                Array.from(new Uint8Array(await value.arrayBuffer())),
              ]
        )
      );
      captured.push({
        method: request.method,
        type: request.headers.get('content-type') ?? '',
        parts,
      });
      return Response.json(
        { ok: true },
        {
          status: captured.length === 1 ? status : 200,
          headers: { 'Retry-After': '0' },
        }
      );
    },
  });
  const mode = new DryRunMode();
  if (dryRun) mode.enable();
  const oauth = createMockOAuthService();
  const output = createMockOutputService();
  const client = createApiClient(
    status === 401 ? mockOAuthConfigService() : mockConfigService(),
    output,
    oauth.service,
    undefined,
    mode
  );
  client.defaults.baseURL = server.url.origin;
  return {
    server,
    captured,
    oauth,
    client,
    command: new ApiCommand(client, createMockContextService(), output),
  };
}

const parts = () => [
  `files=@${file}`,
  'title=true',
  'files=@@literal',
  'empty=',
  'src/a=b=c',
  'constructor=safe',
  '__proto__=safe',
];

describe('bb api multipart', () => {
  it.each([200, 429, 401])(
    'sends ordered binary parts intact, including replay after %s',
    async (status) => {
      const harness = setup(status);
      try {
        await harness.command.execute(
          { methodOrEndpoint: '/upload', form: parts() },
          { globalOptions: {} }
        );
        expect(harness.captured).toHaveLength(status === 200 ? 1 : 2);
        for (const request of harness.captured) {
          expect(request.method).toBe('POST');
          expect(request.type).toContain('multipart/form-data; boundary=');
          expect(request.parts).toEqual([
            ['files', 'shot.bin', Array.from(binary)],
            ['title', 'true'],
            ['files', '@literal'],
            ['empty', ''],
            ['src/a', 'b=c'],
            ['constructor', 'safe'],
            ['__proto__', 'safe'],
          ]);
        }
        expect(harness.oauth.getRefreshCallCount()).toBe(
          status === 401 ? 1 : 0
        );
      } finally {
        harness.server.stop(true);
      }
    }
  );

  it('does not replay a mutation after a gateway failure', async () => {
    const harness = setup(502);
    try {
      await expect(
        harness.command.execute(
          { methodOrEndpoint: '/upload', form: parts() },
          { globalOptions: {} }
        )
      ).rejects.toThrow();
      expect(harness.captured).toHaveLength(1);
    } finally {
      harness.server.stop(true);
    }
  });

  it('dry-run shows safe metadata and sends nothing', async () => {
    const harness = setup(200, true);
    try {
      const error = await harness.command
        .execute(
          { methodOrEndpoint: '/upload', form: [...parts(), 'token=secret'] },
          { globalOptions: {} }
        )
        .catch((error: unknown) => error);
      expect(error).toBeInstanceOf(DryRunStop);
      const body = (error as DryRunStop).request.body as Record<
        string,
        unknown
      >;
      expect(body.files).toEqual(['<file shot.bin, 5 bytes>', '@literal']);
      expect(body['constructor']).toBe('safe');
      expect(body.__proto__).toBe('safe');
      expect(body.token).not.toBe('secret');
      expect(harness.captured).toHaveLength(0);
    } finally {
      harness.server.stop(true);
    }
  });

  it('rejects invalid combinations and framing headers before opening files', async () => {
    const harness = setup();
    try {
      for (const options of [
        { method: 'GET' },
        { method: 'HEAD' },
        { rawField: ['a=b'] },
        { field: ['a=b'] },
        { input: 'missing' },
        ...['Content-Type', 'content-length', 'TRANSFER-ENCODING'].map(
          (name) => ({ header: [`${name}: x`] })
        ),
      ]) {
        await expect(
          harness.command.execute(
            {
              methodOrEndpoint: '/upload',
              form: ['file=@missing'],
              ...options,
            },
            { globalOptions: {} }
          )
        ).rejects.toThrow(/--form/);
      }
      expect(harness.captured).toHaveLength(0);
    } finally {
      harness.server.stop(true);
    }
  });

  it('keeps a disabled timeout and budgets upload bytes otherwise', async () => {
    const harness = setup();
    const previous = process.env.BB_HTTP_TIMEOUT;
    const timeouts: unknown[] = [];
    harness.client.interceptors.request.use((config) => {
      timeouts.push(config.timeout);
      return config;
    });
    try {
      for (const value of ['0', '100']) {
        process.env.BB_HTTP_TIMEOUT = value;
        await harness.command.execute(
          { methodOrEndpoint: '/upload', form: parts() },
          { globalOptions: {} }
        );
      }
      expect(timeouts[0]).toBe(0);
      expect(timeouts[1]).toBeGreaterThan(100);
    } finally {
      if (previous === undefined) delete process.env.BB_HTTP_TIMEOUT;
      else process.env.BB_HTTP_TIMEOUT = previous;
      harness.server.stop(true);
    }
  });

  it('validates file paths and assignment syntax', () => {
    for (const entry of [
      'bad',
      '=value',
      'file=@',
      'file=@-',
      'file=@missing',
      `file=@${dir}`,
    ]) {
      expect(() => buildMultipartForm([entry])).toThrow();
    }
    expect(buildMultipartForm(['text=é', `file=@${file}`]).bytes).toBe(7);
  });
});
