import { describe, it, expect } from 'bun:test';
import { createApiClient } from '../../src/services/api-client.service.js';
import {
  DryRunMode,
  DryRunStop,
  describeRequestBody,
  describeRequestUrl,
} from '../../src/services/dry-run.js';
import {
  createMockAdapter,
  createMockOutputService,
  mockConfigService,
} from '../setup.js';

function buildClient(enabled: boolean) {
  const dryRun = new DryRunMode();
  if (enabled) dryRun.enable();
  const client = createApiClient(
    mockConfigService(),
    createMockOutputService(),
    undefined,
    undefined,
    dryRun
  );
  const mockAdapter = createMockAdapter([{ status: 200, data: { ok: true } }]);
  client.defaults.adapter = mockAdapter.adapter;
  return { client, calls: mockAdapter.getCallCount };
}

describe('createApiClient - dry run', () => {
  it.each(['post', 'put', 'patch', 'delete'] as const)(
    'stops a %s request before it is sent',
    async (method) => {
      const { client, calls } = buildClient(true);

      const error = await client
        .request({
          method,
          url: '/repositories/ws/repo/pullrequests/7',
          params: { force: 'true' },
          data: JSON.stringify({ title: 'New title' }),
        })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(DryRunStop);
      expect((error as DryRunStop).request).toEqual({
        method: method.toUpperCase(),
        url: 'https://api.bitbucket.org/2.0/repositories/ws/repo/pullrequests/7?force=true',
        body: { title: 'New title' },
      });
      expect(calls()).toBe(0);
    }
  );

  it('lets read requests through so commands can build the write', async () => {
    const { client, calls } = buildClient(true);

    const response = await client.get('/repositories/ws/repo');

    expect(response.data).toEqual({ ok: true });
    expect(calls()).toBe(1);
  });

  it('sends writes normally when dry run is off', async () => {
    const { client, calls } = buildClient(false);

    await client.post('/repositories/ws/repo/pullrequests/7/decline');

    expect(calls()).toBe(1);
  });
});

describe('describeRequestUrl', () => {
  it('masks credential-like query parameters only', () => {
    expect(
      describeRequestUrl('https://api.example/2.0/x?access_token=abc&force=1')
    ).toBe('https://api.example/2.0/x?access_token=[REDACTED]&force=1');
  });

  it('leaves other URLs untouched', () => {
    const url = 'https://api.example/2.0/x?q=a%20b';
    expect(describeRequestUrl(url)).toBe(url);
  });
});

describe('describeRequestBody', () => {
  it('omits an empty body', () => {
    expect(describeRequestBody(undefined)).toBeUndefined();
    expect(describeRequestBody(null)).toBeUndefined();
    expect(describeRequestBody('')).toBeUndefined();
  });

  it('parses JSON strings and keeps other strings verbatim', () => {
    expect(describeRequestBody('{"a":1}')).toEqual({ a: 1 });
    expect(describeRequestBody('plain text')).toBe('plain text');
  });

  it('redacts credential-like keys', () => {
    expect(
      describeRequestBody({ url: 'https://ci', password: 'p', secret: 's' })
    ).toEqual({
      url: 'https://ci',
      password: '[REDACTED]',
      secret: '[REDACTED]',
    });
  });

  it('lists multipart fields with files by name and size', () => {
    const form = new FormData();
    form.append('title', 'notes');
    form.append('files', new File(['hello'], 'a.txt'));
    form.append('files', new File(['hi'], 'b.txt'));

    expect(describeRequestBody(form)).toEqual({
      title: 'notes',
      files: ['<file a.txt, 5 bytes>', '<file b.txt, 2 bytes>'],
    });
  });

  it('summarises binary bodies by size', () => {
    expect(describeRequestBody(new Uint8Array(3))).toBe('<3 bytes>');
  });
});
