import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  createHttpDebugLogger,
  isDebugEnabled,
  redactRequestUrl,
  redactSensitive,
  resolveHttpDebugLevel,
} from '../../src/services/http-debug.js';

const BASE = 'https://api.bitbucket.org/2.0';

function makeConfig(
  url = '/repositories/ws/r',
  method = 'get'
): InternalAxiosRequestConfig {
  return { url, method, baseURL: BASE } as InternalAxiosRequestConfig;
}

function makeResponse(
  config: InternalAxiosRequestConfig,
  status = 200,
  data: unknown = {}
): AxiosResponse {
  return { config, status, statusText: '', headers: {}, data };
}

function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => void
): void {
  const saved = Object.fromEntries(
    Object.keys(vars).map((key) => [key, process.env[key]])
  );
  try {
    for (const [key, value] of Object.entries(vars)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    fn();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe('resolveHttpDebugLevel', () => {
  const cases: Array<[string | undefined, string | undefined, string]> = [
    [undefined, undefined, 'off'],
    ['http', undefined, 'http'],
    ['verbose', undefined, 'verbose'],
    [' HTTP ', undefined, 'http'],
    ['Verbose', undefined, 'verbose'],
    [undefined, 'true', 'verbose'],
    [undefined, '1', 'off'],
    [undefined, 'TRUE', 'off'],
    ['', 'true', 'verbose'],
    ['http', 'true', 'http'],
    ['off', 'true', 'off'],
    ['1', undefined, 'http'],
    ['true', undefined, 'http'],
    ['ON', undefined, 'http'],
    ['nonsense', 'true', 'http'],
    ['0', 'true', 'off'],
    ['false', undefined, 'off'],
    ['no', undefined, 'off'],
    [' None ', 'true', 'off'],
  ];

  for (const [bbDebug, debug, expected] of cases) {
    it(`BB_DEBUG=${JSON.stringify(bbDebug)} DEBUG=${JSON.stringify(debug)} -> ${expected}`, () => {
      withEnv({ BB_DEBUG: bbDebug, DEBUG: debug }, () => {
        expect(resolveHttpDebugLevel()).toBe(expected);
      });
    });
  }

  it('reports isDebugEnabled for any level other than off', () => {
    withEnv({ BB_DEBUG: 'http', DEBUG: undefined }, () => {
      expect(isDebugEnabled()).toBe(true);
    });
    withEnv({ BB_DEBUG: 'off', DEBUG: 'true' }, () => {
      expect(isDebugEnabled()).toBe(false);
    });
  });
});

describe('createHttpDebugLogger', () => {
  let consoleDebugSpy: ReturnType<typeof spyOn>;
  let clock: number;
  const now = (): number => clock;

  beforeEach(() => {
    clock = 1000;
    consoleDebugSpy = spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
  });

  function lines(): string[] {
    return consoleDebugSpy.mock.calls.map((args) =>
      args.map((a) => String(a)).join(' ')
    );
  }

  function send(
    logger: ReturnType<typeof createHttpDebugLogger>,
    config: InternalAxiosRequestConfig
  ): void {
    logger.request(config);
    logger.dispatch(config);
  }

  it('logs nothing and leaves the config untouched when off', () => {
    const logger = createHttpDebugLogger('off', now);
    const config = makeConfig();

    send(logger, config);
    logger.response(makeResponse(config));
    logger.error(new AxiosError('boom', 'ECONNRESET', config, {}));

    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(Object.keys(config)).toEqual(['url', 'method', 'baseURL']);
  });

  it('logs method, URL, status and elapsed milliseconds at the http level', () => {
    const logger = createHttpDebugLogger('http', now);
    const config = makeConfig();

    send(logger, config);
    clock += 142.4;
    logger.response(makeResponse(config, 200, { secret: 'body' }));

    const [request, response] = lines();
    expect(lines()).toHaveLength(2);
    expect(request).toMatch(
      /^\[HTTP\] [0-9a-f]{6} GET https:\/\/api\.bitbucket\.org\/2\.0\/repositories\/ws\/r$/
    );
    expect(response).toMatch(
      /^\[HTTP\] [0-9a-f]{6} 200 GET https:\/\/api\.bitbucket\.org\/2\.0\/repositories\/ws\/r 142ms$/
    );
  });

  it('stamps request and outcome lines with the same correlation id', () => {
    const logger = createHttpDebugLogger('http', now);
    const first = makeConfig('/a');
    const second = makeConfig('/b');

    logger.request(first);
    logger.request(second);
    logger.response(makeResponse(second));
    logger.error(new AxiosError('boom', undefined, first, {}, undefined));

    const ids = lines().map((line) => line.split(' ')[1]);
    expect(ids[0]).toBe(ids[3]);
    expect(ids[1]).toBe(ids[2]);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('keeps the id on a replayed config and numbers the attempt', () => {
    const logger = createHttpDebugLogger('http', now);
    const config = makeConfig();

    logger.request(config);
    logger.request(config);

    const [first, second] = lines();
    expect(second).toBe(`${first} (attempt 2)`);
  });

  it('times each attempt from its own dispatch', () => {
    const logger = createHttpDebugLogger('http', now);
    const config = makeConfig();

    send(logger, config);
    clock += 500;
    send(logger, config);
    clock += 20;
    logger.response(makeResponse(config));

    expect(lines()[2]).toEndWith(' 20ms');
  });

  it('shows the pacer wait on the request line', () => {
    const logger = createHttpDebugLogger('http', now);

    logger.request(makeConfig(), 1840.4);

    expect(lines()[0]).toEndWith('/repositories/ws/r (waited 1840ms)');
  });

  it('shows the gap since the previous attempt on a retry', () => {
    const logger = createHttpDebugLogger('http', now);
    const config = makeConfig();
    send(logger, config);
    clock += 10;
    logger.error(
      new AxiosError(
        'unavailable',
        undefined,
        config,
        {},
        makeResponse(config, 503)
      )
    );
    clock += 1000;

    logger.request(config, 5);

    expect(lines()[2]).toEndWith(
      '/repositories/ws/r (attempt 2, waited 1000ms)'
    );
  });

  it('shows credential lookup time separately from wire time', () => {
    const logger = createHttpDebugLogger('http', now);
    const config = makeConfig();
    logger.request(config);
    clock += 412;
    logger.dispatch(config);
    clock += 20;

    logger.response(makeResponse(config));

    expect(lines()[1]).toEndWith('/repositories/ws/r 20ms (auth 412ms)');
  });

  it('logs the request line before a failure that happens ahead of dispatch', () => {
    const logger = createHttpDebugLogger('http', now);

    logger.request(makeConfig('/x', 'post'));
    logger.error(new Error('Auth required'));

    const [request, error] = lines();
    expect(request).toMatch(/^\[HTTP\] [0-9a-f]{6} POST \S+\/x$/);
    expect(error).toBe('[HTTP] Error: Auth required');
  });

  it('logs the status of error responses without their body at the http level', () => {
    const logger = createHttpDebugLogger('http', now);
    const config = makeConfig('/x', 'post');
    send(logger, config);
    clock += 7;

    logger.error(
      new AxiosError(
        'Request failed with status code 503',
        undefined,
        config,
        {},
        makeResponse(config, 503, { password: 'p' })
      )
    );

    expect(lines()).toHaveLength(2);
    expect(lines()[1]).toMatch(/^\[HTTP\] [0-9a-f]{6} 503 POST \S+\/x 7ms$/);
  });

  it('logs the network error code and message when no response arrived', () => {
    const logger = createHttpDebugLogger('http', now);
    const config = makeConfig();
    send(logger, config);
    clock += 30;

    logger.error(new AxiosError('socket hang up', 'ECONNRESET', config, {}));

    expect(lines()[1]).toMatch(
      /^\[HTTP\] [0-9a-f]{6} ECONNRESET GET \S+ 30ms: socket hang up$/
    );
  });

  it('omits id and timing for an outcome whose request was never traced', () => {
    const logger = createHttpDebugLogger('http', now);

    logger.response(makeResponse(makeConfig(), 204));

    expect(lines()).toEqual([
      '[HTTP] 204 GET https://api.bitbucket.org/2.0/repositories/ws/r',
    ]);
  });

  it('adds redacted response and error bodies at the verbose level', () => {
    const logger = createHttpDebugLogger('verbose', now);
    const ok = makeConfig('/ok');
    const bad = makeConfig('/bad');
    logger.request(ok);
    logger.request(bad);

    logger.response(
      makeResponse(ok, 200, { access_token: 'secret-AT', keep: 'visible' })
    );
    logger.error(
      new AxiosError(
        'bad',
        undefined,
        bad,
        {},
        makeResponse(bad, 400, {
          refresh_token: 'secret-RT',
          error: 'invalid_grant',
        })
      )
    );

    const output = lines().join('\n');
    expect(output).toMatch(/\[HTTP\] [0-9a-f]{6} Response Body:/);
    expect(output).toMatch(/\[HTTP\] [0-9a-f]{6} Error Response Body:/);
    expect(output).not.toContain('secret-AT');
    expect(output).not.toContain('secret-RT');
    expect(output).toContain('[REDACTED]');
    expect(output).toContain('visible');
    expect(output).toContain('invalid_grant');
  });

  it('adds redacted request bodies at the verbose level', () => {
    const logger = createHttpDebugLogger('verbose', now);
    const object = {
      ...makeConfig('/o', 'post'),
      data: { password: 'p1', title: 'kept' },
    };
    const raw = {
      ...makeConfig('/r', 'put'),
      data: '{"token":"t1","name":"raw"}',
    };
    const text = { ...makeConfig('/t', 'post'), data: 'not json' };

    logger.request(object);
    logger.request(raw);
    logger.request(text);
    logger.request(makeConfig('/none'));

    const output = lines().join('\n');
    expect(
      lines().filter((line) => line.includes('Request Body:'))
    ).toHaveLength(3);
    expect(output).not.toContain('p1');
    expect(output).not.toContain('t1');
    expect(output).toContain('kept');
    expect(output).toContain('raw');
    expect(output).toContain('"not json"');
  });

  it('never logs request bodies at the http level', () => {
    const logger = createHttpDebugLogger('http', now);

    logger.request({ ...makeConfig('/o', 'post'), data: { title: 'hidden' } });

    expect(lines()).toHaveLength(1);
    expect(lines()[0]).not.toContain('hidden');
  });

  it('redacts query strings from logged URLs', () => {
    const logger = createHttpDebugLogger('http', now);
    const config = makeConfig('/test?token=abc&other=xyz');

    send(logger, config);
    logger.response(makeResponse(config));

    const output = lines().join('\n');
    expect(output).not.toContain('token=abc');
    expect(output).not.toContain('other=xyz');
    expect(output).toContain('/test?[redacted]');
  });
});

describe('redactSensitive', () => {
  it('replaces values under sensitive keys with [REDACTED] case-insensitively', () => {
    const result = redactSensitive({
      Access_Token: 'a',
      refresh_token: 'b',
      Authorization: 'c',
      client_secret: 'd',
      id: 1,
      name: 'keep',
    });
    expect(result).toEqual({
      Access_Token: '[REDACTED]',
      refresh_token: '[REDACTED]',
      Authorization: '[REDACTED]',
      client_secret: '[REDACTED]',
      id: 1,
      name: 'keep',
    });
  });

  it('redacts sensitive keys nested inside arrays and objects', () => {
    const result = redactSensitive({
      items: [
        { id: 1, token: 'nested' },
        { id: 2, password: 'also' },
      ],
      meta: { token: 'deep' },
    });
    expect(result).toEqual({
      items: [
        { id: 1, token: '[REDACTED]' },
        { id: 2, password: '[REDACTED]' },
      ],
      meta: { token: '[REDACTED]' },
    });
  });

  it('passes primitives and null through unchanged', () => {
    expect(redactSensitive(null)).toBeNull();
    expect(redactSensitive('plain')).toBe('plain');
    expect(redactSensitive(42)).toBe(42);
    expect(redactSensitive(undefined)).toBeUndefined();
  });

  it('breaks circular references with [Circular]', () => {
    const circular: Record<string, unknown> = { name: 'self' };
    circular.self = circular;
    const result = redactSensitive(circular) as Record<string, unknown>;
    expect(result.name).toBe('self');
    expect(result.self).toBe('[Circular]');
  });

  it('flags repeated object references as [Circular] via the seen-set', () => {
    // Not a cycle: `arr` holds the same object twice. The WeakSet marks it
    // seen on the first pass, so the second occurrence renders '[Circular]'.
    // Deliberate seen-set semantics — production bodies come from JSON.parse
    // and never share references, but the guard must stay bounded anyway.
    const inner: Record<string, unknown> = { token: 'x' };
    const arr = [inner, inner];
    const result = redactSensitive(arr) as Array<Record<string, unknown>>;
    expect(result[0]).toEqual({ token: '[REDACTED]' });
    expect(result[1]).toBe('[Circular]');
  });
});

describe('redactRequestUrl', () => {
  it('keeps path and origin but scrubs the query string', () => {
    expect(
      redactRequestUrl(
        '/repositories/ws/r?token=abc&other=xyz',
        'https://api.bitbucket.org/2.0'
      )
    ).toBe('https://api.bitbucket.org/2.0/repositories/ws/r?[redacted]');
  });

  it('keeps a URL without a query string unchanged', () => {
    expect(
      redactRequestUrl('/repositories/ws/r', 'https://api.bitbucket.org/2.0')
    ).toBe('https://api.bitbucket.org/2.0/repositories/ws/r');
  });

  it('preserves the base path for root-relative URLs', () => {
    // axios concatenates baseURL + url, so the logged URL must keep the
    // base path (e.g. /2.0) to match the actual wire request.
    expect(redactRequestUrl('/a/b', 'https://api.bitbucket.org/2.0')).toBe(
      'https://api.bitbucket.org/2.0/a/b'
    );
  });

  it('handles absolute request URLs', () => {
    expect(redactRequestUrl('https://example.com/x?a=1', undefined)).toBe(
      'https://example.com/x?[redacted]'
    );
  });

  it('falls back to a manual query split when URL parsing fails', () => {
    expect(redactRequestUrl('https://[invalid?a=1', undefined)).toBe(
      'https://[invalid?[redacted]'
    );
    expect(redactRequestUrl('https://[invalid', undefined)).toBe(
      'https://[invalid'
    );
  });
});
