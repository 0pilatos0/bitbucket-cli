/**
 * API Client Service tests - Content-Type handling on bodyless requests
 *
 * Regression tests for issue #321: the shared axios instance sets
 * `Content-Type: application/json` as an instance default, which used to leak
 * onto bodyless POSTs (`bb pr approve` / `bb pr decline`, `bb api -X POST`
 * without fields). Bitbucket's request parser rejects an empty body declared
 * as JSON with a bare-text 400 before the request reaches the endpoint. The
 * fix strips `Content-Type` at the adapter level when the request carries no
 * body, so these tests assert against a real local HTTP server to capture the
 * actual wire headers (a mock adapter replaces the wrapper under test).
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { Server } from 'node:http';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiClient } from '../../src/services/api-client.service.js';
import { createMockOutputService, mockConfigService } from '../setup.js';
import type { AxiosInstance } from 'axios';

interface CapturedRequest {
  method: string;
  url: string;
  contentType: string | undefined;
  contentLength: string | undefined;
  rawBody: string;
}

/** Start a local server that records one request per path and always replies 200. */
async function startCaptureServer(): Promise<{
  server: Server;
  baseUrl: string;
  requests: Map<string, CapturedRequest>;
}> {
  const requests = new Map<string, CapturedRequest>();
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const key = `${req.method} ${req.url}`;
      requests.set(key, {
        method: req.method ?? '',
        url: req.url ?? '',
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        rawBody: Buffer.concat(chunks).toString('utf8'),
      });
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return { server, baseUrl: `http://127.0.0.1:${port}`, requests };
}

describe('createApiClient - Content-Type on bodyless requests (issue #321)', () => {
  let server: Server;
  let client: AxiosInstance;
  let requests: Map<string, CapturedRequest>;
  let previousBaseUrl: string | undefined;

  beforeEach(async () => {
    // `BB_API_BASE_URL` is process-wide state; save the prior value so it can
    // be restored in `afterEach`. Leaving it pointed at a server that is
    // closed below would break later tests in this Bun process.
    previousBaseUrl = process.env.BB_API_BASE_URL;

    const capture = await startCaptureServer();
    server = capture.server;
    requests = capture.requests;
    process.env.BB_API_BASE_URL = capture.baseUrl;
    client = createApiClient(mockConfigService(), createMockOutputService());
  });

  afterEach(() => {
    server.close();
    if (previousBaseUrl === undefined) {
      delete process.env.BB_API_BASE_URL;
    } else {
      process.env.BB_API_BASE_URL = previousBaseUrl;
    }
  });

  it('omits Content-Type on a bodyless POST', async () => {
    await client.post('/bodyless-post');

    const request = requests.get('POST /bodyless-post');
    expect(request).toBeDefined();
    expect(request?.contentType).toBeUndefined();
  });

  it('omits Content-Type on a bodyless DELETE (e.g. unapprove)', async () => {
    await client.delete('/bodyless-delete');

    const request = requests.get('DELETE /bodyless-delete');
    expect(request).toBeDefined();
    expect(request?.contentType).toBeUndefined();
  });

  it('sends application/json when a POST carries a JSON object body', async () => {
    await client.post('/json-post', { draft: false });

    const request = requests.get('POST /json-post');
    expect(request).toBeDefined();
    expect(request?.contentType).toBe('application/json');
    expect(request?.rawBody).toBe(JSON.stringify({ draft: false }));
  });

  it('sends application/json when a PUT carries a JSON object body (e.g. bb pr ready)', async () => {
    await client.put('/json-put', { type: 'pullrequest', draft: false });

    const request = requests.get('PUT /json-put');
    expect(request).toBeDefined();
    expect(request?.contentType).toBe('application/json');
    expect(request?.rawBody).toBe(
      JSON.stringify({ type: 'pullrequest', draft: false })
    );
  });

  it('keeps Content-Type on a raw string body (e.g. bb api --input)', async () => {
    await client.post('/raw-body', '{"key":"value"}');

    const request = requests.get('POST /raw-body');
    expect(request).toBeDefined();
    expect(request?.contentType).toBe('application/json');
    expect(request?.rawBody).toBe('{"key":"value"}');
  });
});
