/**
 * Tests for the `bb api` raw passthrough command.
 */

import { describe, it, expect } from 'bun:test';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiCommand } from '../../src/commands/api.command.js';
import type { CommandContext } from '../../src/core/interfaces/commands.js';
import { APIError, BBError } from '../../src/types/errors.js';
import { createMockContextService, createMockOutputService } from '../setup.js';

interface MockAxios {
  instance: AxiosInstance;
  calls: AxiosRequestConfig[];
}

type Responder = (
  config: AxiosRequestConfig,
  callIndex: number
) => { data: unknown; status?: number; headers?: Record<string, string> };

function createMockAxios(responder: Responder): MockAxios {
  const calls: AxiosRequestConfig[] = [];
  const instance = {
    async request(config: AxiosRequestConfig) {
      calls.push(config);
      const result = responder(config, calls.length);
      return {
        data: result.data,
        status: result.status ?? 200,
        statusText: 'OK',
        headers: result.headers ?? {},
        config,
      };
    },
  } as unknown as AxiosInstance;
  return { instance, calls };
}

const ctx: CommandContext = { globalOptions: {} };
const jsonCtx: CommandContext = { globalOptions: { json: true } };

function makeCommand(responder: Responder) {
  const axios = createMockAxios(responder);
  const output = createMockOutputService();
  const context = createMockContextService({
    workspace: 'ws',
    repoSlug: 'repo',
  });
  const command = new ApiCommand(axios.instance, context, output);
  return { command, axios, output };
}

describe('ApiCommand', () => {
  it('performs a GET by default and prints JSON', async () => {
    const { command, axios, output } = makeCommand(() => ({
      data: { username: 'me' },
    }));

    await command.execute({ methodOrEndpoint: '/user' }, ctx);

    expect(axios.calls).toHaveLength(1);
    expect(axios.calls[0]!.method).toBe('GET');
    expect(axios.calls[0]!.url).toBe('/user');
    expect(axios.calls[0]!.data).toBeUndefined();
    expect(output.logs).toContain('json:{"username":"me"}');
  });

  it('accepts a leading positional method', async () => {
    const { command, axios } = makeCommand(() => ({ data: {} }));

    await command.execute({ methodOrEndpoint: 'GET', endpoint: '/user' }, ctx);

    expect(axios.calls[0]!.method).toBe('GET');
    expect(axios.calls[0]!.url).toBe('/user');
  });

  it('infers POST and sends a JSON body when fields are present', async () => {
    const { command, axios } = makeCommand(() => ({ data: { id: 1 } }));

    await command.execute(
      {
        methodOrEndpoint: '/repositories/ws/repo/issues',
        rawField: ['title=Bug'],
        field: ['priority=3', 'confidential=true'],
      },
      ctx
    );

    expect(axios.calls[0]!.method).toBe('POST');
    expect(axios.calls[0]!.data).toEqual({
      title: 'Bug',
      priority: 3,
      confidential: true,
    });
  });

  it('sends fields as a query string on an explicit GET', async () => {
    const { command, axios } = makeCommand(() => ({ data: {} }));

    await command.execute(
      { methodOrEndpoint: '/search', method: 'GET', rawField: ['q=foo bar'] },
      ctx
    );

    expect(axios.calls[0]!.method).toBe('GET');
    expect(axios.calls[0]!.url).toBe('/search?q=foo%20bar');
    expect(axios.calls[0]!.data).toBeUndefined();
  });

  it('rejects --input combined with fields', async () => {
    const { command } = makeCommand(() => ({ data: {} }));

    await expect(
      command.execute(
        { methodOrEndpoint: '/x', input: 'body.json', rawField: ['a=b'] },
        ctx
      )
    ).rejects.toThrow(BBError);
  });

  it('substitutes {workspace}/{repo} from context', async () => {
    const { command, axios } = makeCommand(() => ({ data: { values: [] } }));

    await command.execute(
      { methodOrEndpoint: '/repositories/{workspace}/{repo}/pullrequests' },
      ctx
    );

    expect(axios.calls[0]!.url).toBe('/repositories/ws/repo/pullrequests');
  });

  it('follows pagination and merges values', async () => {
    const { command, axios, output } = makeCommand((config, index) => {
      if (index === 1) {
        return {
          data: {
            values: [{ id: 1 }, { id: 2 }],
            next: 'https://api.bitbucket.org/2.0/repositories/ws?page=2',
          },
        };
      }
      return { data: { values: [{ id: 3 }] } };
    });

    await command.execute(
      { methodOrEndpoint: '/repositories/ws', paginate: true },
      ctx
    );

    expect(axios.calls).toHaveLength(2);
    expect(axios.calls[1]!.url).toBe(
      'https://api.bitbucket.org/2.0/repositories/ws?page=2'
    );
    expect(output.logs).toContain(
      'json:{"values":[{"id":1},{"id":2},{"id":3}]}'
    );
  });

  it('warns and returns the first page when --paginate hits a non-list', async () => {
    const { command, axios, output } = makeCommand(() => ({
      data: { username: 'me' },
    }));

    await command.execute({ methodOrEndpoint: '/user', paginate: true }, ctx);

    expect(axios.calls).toHaveLength(1);
    expect(output.logs).toContain('json:{"username":"me"}');
    expect(output.logs.some((l) => l.startsWith('warning:'))).toBe(true);
  });

  it('passes custom headers through', async () => {
    const { command, axios } = makeCommand(() => ({ data: {} }));

    await command.execute(
      { methodOrEndpoint: '/user', header: ['Accept: application/json'] },
      ctx
    );

    expect(axios.calls[0]!.headers).toEqual({ Accept: 'application/json' });
  });

  it('prints a non-JSON (string) response verbatim', async () => {
    const { command, output } = makeCommand(() => ({
      data: 'diff --git a/x b/x',
    }));

    await command.execute(
      { methodOrEndpoint: '/repositories/ws/repo/diff' },
      ctx
    );

    expect(output.logs).toContain('text:diff --git a/x b/x');
    expect(output.logs.some((l) => l.startsWith('json:'))).toBe(false);
  });

  it('requires an endpoint', async () => {
    const { command } = makeCommand(() => ({ data: {} }));

    await expect(command.execute({}, ctx)).rejects.toThrow(BBError);
  });

  it('rejects an absolute URL to a foreign host', async () => {
    const { command } = makeCommand(() => ({ data: {} }));

    await expect(
      command.execute({ methodOrEndpoint: 'https://evil.example.com/x' }, ctx)
    ).rejects.toThrow(BBError);
  });

  it('surfaces the API error body to stdout in text mode, then rethrows', async () => {
    const { command, output } = makeCommand(() => {
      throw new APIError('Not found', 404, {
        type: 'error',
        error: { message: 'Repository not found' },
      });
    });

    await expect(
      command.execute({ methodOrEndpoint: '/repositories/ws/missing' }, ctx)
    ).rejects.toThrow(APIError);

    expect(
      output.logs.some(
        (l) => l.startsWith('json:') && l.includes('Repository not found')
      )
    ).toBe(true);
  });

  it('does not pre-print the error body in JSON mode', async () => {
    const { command, output } = makeCommand(() => {
      throw new APIError('Not found', 404, { error: { message: 'nope' } });
    });

    await expect(
      command.execute({ methodOrEndpoint: '/repositories/ws/missing' }, jsonCtx)
    ).rejects.toThrow(APIError);

    expect(output.logs.some((l) => l.startsWith('json:'))).toBe(false);
  });

  it('rejects two positionals when the first is not an HTTP verb', async () => {
    const { command, axios } = makeCommand(() => ({ data: {} }));

    await expect(
      command.execute(
        { methodOrEndpoint: '/repositories/a', endpoint: '/repositories/b' },
        ctx
      )
    ).rejects.toThrow(BBError);
    expect(axios.calls).toHaveLength(0);
  });

  it('rejects a lone HTTP verb with no endpoint', async () => {
    const { command } = makeCommand(() => ({ data: {} }));

    await expect(
      command.execute({ methodOrEndpoint: 'GET' }, ctx)
    ).rejects.toThrow(BBError);
    await expect(
      command.execute({ methodOrEndpoint: 'delete' }, ctx)
    ).rejects.toThrow(BBError);
  });

  it('rejects a user-supplied Authorization header', async () => {
    const { command, axios } = makeCommand(() => ({ data: {} }));

    await expect(
      command.execute(
        { methodOrEndpoint: '/user', header: ['Authorization: Bearer x'] },
        ctx
      )
    ).rejects.toThrow(BBError);
    expect(axios.calls).toHaveLength(0);
  });

  it('warns when --paginate is used on a non-GET method', async () => {
    const { command, axios, output } = makeCommand(() => ({ data: { id: 1 } }));

    await command.execute(
      { methodOrEndpoint: '/x', method: 'POST', paginate: true },
      ctx
    );

    expect(axios.calls).toHaveLength(1);
    expect(axios.calls[0]!.method).toBe('POST');
    expect(
      output.logs.some(
        (l) => l.startsWith('warning:') && l.includes('--paginate')
      )
    ).toBe(true);
  });

  it('emits {} for an empty body in JSON mode', async () => {
    const { command, output } = makeCommand(() => ({ data: '' }));

    await command.execute({ methodOrEndpoint: '/x' }, jsonCtx);

    expect(output.logs).toContain('json:{}');
  });

  it('prints nothing for an empty body in text mode', async () => {
    const { command, output } = makeCommand(() => ({ data: '' }));

    await command.execute({ methodOrEndpoint: '/x' }, ctx);

    expect(output.logs.some((l) => l.startsWith('json:'))).toBe(false);
    expect(output.logs.some((l) => l.startsWith('text:'))).toBe(false);
  });

  it('prints the status line and headers with -i/--include', async () => {
    const { command, output } = makeCommand(() => ({
      data: { ok: true },
      status: 200,
      headers: { 'content-type': 'application/json', 'x-test': '1' },
    }));

    await command.execute({ methodOrEndpoint: '/user', include: true }, ctx);

    expect(output.logs).toContain('text:HTTP/1.1 200 OK');
    expect(output.logs).toContain('text:x-test: 1');
    expect(output.logs).toContain('json:{"ok":true}');
  });

  it('quotes a JSON-string body when content-type is application/json', async () => {
    const { command, output } = makeCommand(() => ({
      data: 'hello',
      headers: { 'content-type': 'application/json' },
    }));

    await command.execute({ methodOrEndpoint: '/x' }, ctx);

    expect(output.logs).toContain('json:"hello"');
    expect(output.logs.some((l) => l.startsWith('text:'))).toBe(false);
  });
});
