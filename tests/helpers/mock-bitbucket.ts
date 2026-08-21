/**
 * Mock Bitbucket Cloud HTTP server for integration tests (issue #264).
 *
 * Existing command tests inject `as unknown as SomeApi` stubs, so the real
 * generated client, request serialization, and the shared axios interceptor
 * stack are never exercised. This module fills that gap: a local `Bun.serve`
 * fixture that speaks enough of the Bitbucket wire protocol (paginated list
 * envelopes with `size`/`next`, Basic-auth enforcement, Bitbucket-shaped
 * error bodies) to drive REAL commands end-to-end:
 *
 *   generated *Api  →  createApiClient(axios)  →  Bun.serve fixture
 *
 * The server records every request (method, path, query params, auth header)
 * so tests can assert on the exact wire traffic, and supports fault injection
 * (429 + Retry-After, forced status codes) plus concurrency observation for
 * the pagination fast path.
 */

import { createApiClient } from '../../src/services/api-client.service.js';
import type { AxiosInstance } from 'axios';

export interface RecordedRequest {
  method: string;
  /** URL pathname, e.g. `/repositories/workspace`. */
  path: string;
  query: URLSearchParams;
  headers: Record<string, string>;
}

export interface MockResponse {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface MockRoute {
  method?: string;
  /**
   * Matched against the URL pathname. The base URL carries no `/2.0` prefix,
   * so list endpoints look like `/repositories/{workspace}`; matchers may
   * also see the `/2.0`-prefixed form and should handle both.
   */
  matchPathname: (pathname: string) => boolean;
  respond: (context: {
    path: string;
    query: URLSearchParams;
    headers: Record<string, string>;
    method: string;
  }) => Promise<MockResponse> | MockResponse;
}

export interface MockBitbucketServer {
  /** Base URL to point the API client at, e.g. `http://127.0.0.1:port`. */
  url: string;
  port: number;
  requests: RecordedRequest[];
  /** Peak number of requests handled simultaneously (concurrency probe). */
  peakInFlight: { value: number };
  stop(): Promise<void>;
}

export interface StartMockBitbucketOptions {
  routes?: MockRoute[];
  /**
   * Stamped onto every non-error response unless the route sets its own.
   * Leave undefined to simulate responses without rate-limit headers.
   */
  rateLimitHeaders?: Record<string, string>;
  /** Milliseconds each handler waits before responding (default ~10ms). */
  latencyMs?: number;
  requireAuth?: boolean;
}

/**
 * Build a Bitbucket-style paginated envelope for canned data. Mirrors the
 * real wire shape: `size` (total), `pagelen`, `page`, and a full `next` URL
 * while more pages remain.
 */
export function paginatedEnvelope<T>(
  allValues: T[],
  options: { page: number; pagelen: number; baseUrl: string; path: string }
): {
  values: T[];
  size: number;
  page: number;
  pagelen: number;
  next?: string;
} {
  const { page, pagelen, baseUrl, path } = options;
  const start = (page - 1) * pagelen;
  const values = allValues.slice(start, start + pagelen);
  const hasNext = start + pagelen < allValues.length;
  return {
    values,
    size: allValues.length,
    page,
    pagelen,
    ...(hasNext && {
      next: `${baseUrl}${path}?page=${page + 1}&pagelen=${pagelen}`,
    }),
  };
}

/** Canned repository payload with just the fields commands read. */
export function makeRepo(index: number): {
  uuid: string;
  slug: string;
  full_name: string;
  name: string;
  is_private: boolean;
  description: string;
} {
  return {
    uuid: `{repo-uuid-${index}}`,
    slug: `repo-${index}`,
    full_name: `workspace/repo-${index}`,
    name: `repo-${index}`,
    is_private: index % 2 === 0,
    description: `Integration fixture repository ${index}`,
  };
}

/**
 * Route serving `/repositories/{workspace}` (and its `/2.0` alias) from a
 * canned repo list, honoring the caller's `page`/`pagelen` exactly like the
 * real API — including capping `pagelen` at {@link maxPagelen}.
 */
export function repositoriesRoute(options: {
  repos: ReturnType<typeof makeRepo>[];
  baseUrl: string;
  maxPagelen?: number;
}): MockRoute {
  return {
    method: 'GET',
    matchPathname: (pathname) =>
      pathname === '/repositories/workspace' ||
      pathname === '/2.0/repositories/workspace',
    respond: ({ query }) => {
      const page = Number.parseInt(query.get('page') ?? '1', 10);
      const requested = Number.parseInt(query.get('pagelen') ?? '25', 10);
      const maxPagelen = options.maxPagelen ?? 100;
      const pagelen = Math.max(1, Math.min(requested, maxPagelen));
      return {
        body: paginatedEnvelope(options.repos, {
          page: Number.isNaN(page) ? 1 : page,
          pagelen,
          baseUrl: options.baseUrl,
          path: '/repositories/workspace',
        }),
      };
    },
  };
}

/**
 * Start the fixture server on an OS-assigned port. Always `await stop()` in
 * test teardown so Bun's test runner can exit.
 */
export async function startMockBitbucket(
  options: StartMockBitbucketOptions = {}
): Promise<MockBitbucketServer> {
  const routes = options.routes ?? [];
  const latencyMs = options.latencyMs ?? 10;
  const requireAuth = options.requireAuth ?? true;

  const requests: RecordedRequest[] = [];
  const peakInFlight = { value: 0 };
  let inFlight = 0;

  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(request): Promise<Response> {
      inFlight += 1;
      peakInFlight.value = Math.max(peakInFlight.value, inFlight);
      try {
        const url = new URL(request.url);
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
          headers[key.toLowerCase()] = value;
        });

        requests.push({
          method: request.method,
          path: url.pathname,
          query: url.searchParams,
          headers,
        });

        const commonHeaders: Record<string, string> = {
          'content-type': 'application/json',
          ...(options.rateLimitHeaders ?? {}),
        };

        if (requireAuth && !headers.authorization?.startsWith('Basic ')) {
          return Response.json(
            { error: { message: 'Not authenticated' } },
            { status: 401 }
          );
        }

        if (latencyMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, latencyMs));
        }

        for (const route of routes) {
          if (route.method && route.method !== request.method) {
            continue;
          }
          if (!route.matchPathname(url.pathname)) {
            continue;
          }
          const result = await route.respond({
            path: url.pathname,
            query: url.searchParams,
            headers,
            method: request.method,
          });
          return Response.json(result.body ?? {}, {
            status: result.status ?? 200,
            headers: { ...commonHeaders, ...(result.headers ?? {}) },
          });
        }

        // Unknown route: Bitbucket-shaped 404 so tests fail loudly instead of
        // silently matching nothing.
        return Response.json(
          {
            error: {
              message: `No route matched ${request.method} ${url.pathname}`,
            },
          },
          { status: 404, headers: commonHeaders }
        );
      } finally {
        inFlight -= 1;
      }
    },
  });

  return {
    url: server.url.origin,
    port: server.port,
    requests,
    peakInFlight,
    stop: () => server.stop(true),
  };
}

/**
 * Bootstrap-style wiring for integration tests: build the REAL axios instance
 * via `createApiClient` pointed at the fixture server, then construct real
 * generated API classes over it — the same shape production uses
 * (`registerApiClient` passes the shared instance as the third constructor
 * argument). Credential/output edges stay mocked (from tests/setup.ts).
 *
 * `BB_API_BASE_URL` is swapped synchronously around the synchronous
 * `createApiClient` call and restored immediately, so no other test code can
 * observe the mutated environment.
 */
export function buildApiFor<T>(
  serverUrl: string,
  credentialStore: Parameters<typeof createApiClient>[0],
  output: Parameters<typeof createApiClient>[1],
  ApiClass: new (
    configuration: undefined,
    basePath: undefined,
    axios: AxiosInstance
  ) => T
): T {
  const previous = process.env.BB_API_BASE_URL;
  process.env.BB_API_BASE_URL = serverUrl;
  try {
    const axiosInstance = createApiClient(credentialStore, output);
    return new ApiClass(undefined, undefined, axiosInstance);
  } finally {
    if (previous === undefined) {
      delete process.env.BB_API_BASE_URL;
    } else {
      process.env.BB_API_BASE_URL = previous;
    }
  }
}
