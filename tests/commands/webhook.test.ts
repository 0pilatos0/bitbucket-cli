/**
 * Webhook command tests
 */

import { describe, it, expect } from 'bun:test';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { ListWebhooksCommand } from '../../src/commands/webhook/list.command.js';
import { ViewWebhookCommand } from '../../src/commands/webhook/view.command.js';
import { CreateWebhookCommand } from '../../src/commands/webhook/create.command.js';
import { DeleteWebhookCommand } from '../../src/commands/webhook/delete.command.js';
import {
  createMockAdapter,
  createMockContextService,
  createMockOutputService,
} from '../setup.js';
import { APIError } from '../../src/types/errors.js';
import {
  WebhooksApi,
  type WebhookSubscription,
} from '../../src/generated/api.js';

const UID = '{a1b2c3d4-0000-0000-0000-000000000000}';

const mockWebhook: WebhookSubscription = {
  type: 'webhook_subscription',
  uuid: UID,
  url: 'https://ci.example.com/hook',
  description: 'CI trigger',
  subject_type: 'repository',
  active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  events: ['repo:push', 'pullrequest:created'],
  secret_set: true,
};

interface ApiCall {
  method: string;
  request: Record<string, unknown>;
  axiosOptions?: { params?: Record<string, unknown> };
}

function createMockWebhooksApi(
  options: {
    webhooks?: WebhookSubscription[];
    notFound?: boolean;
    calls?: ApiCall[];
  } = {}
): WebhooksApi {
  const webhooks = options.webhooks ?? [mockWebhook];
  const record =
    (method: string, respond: (request: Record<string, unknown>) => unknown) =>
    async (
      request: Record<string, unknown>,
      axiosOptions?: ApiCall['axiosOptions']
    ) => {
      options.calls?.push({ method, request, axiosOptions });
      if (options.notFound) {
        throw new APIError('Resource not found', 404);
      }
      return { data: respond(request) };
    };
  const list = () => ({ values: webhooks, size: webhooks.length });
  const get = () => mockWebhook;
  const create = (request: Record<string, unknown>) => ({
    ...(request.body as WebhookSubscription),
    uuid: UID,
  });

  return {
    repositoriesWorkspaceRepoSlugHooksGet: record('repoList', list),
    repositoriesWorkspaceRepoSlugHooksUidGet: record('repoGet', get),
    repositoriesWorkspaceRepoSlugHooksPost: record('repoCreate', create),
    repositoriesWorkspaceRepoSlugHooksUidDelete: record(
      'repoDelete',
      () => undefined
    ),
    workspacesWorkspaceHooksGet: record('workspaceList', list),
    workspacesWorkspaceHooksUidGet: record('workspaceGet', get),
    workspacesWorkspaceHooksPost: record('workspaceCreate', create),
    workspacesWorkspaceHooksUidDelete: record(
      'workspaceDelete',
      () => undefined
    ),
  } as unknown as WebhooksApi;
}

function repoContextService() {
  return createMockContextService({ workspace: 'acme', repoSlug: 'demo' });
}

function getTableRows(logs: string[]): string[][] {
  const rowsLog = logs.find((log) => log.startsWith('table-rows:'));
  return rowsLog
    ? (JSON.parse(rowsLog.substring('table-rows:'.length)) as string[][])
    : [];
}

function getJsonPayload(logs: string[]): Record<string, unknown> {
  const jsonLog = logs.find((log) => log.startsWith('json:'));
  expect(jsonLog).toBeDefined();
  return JSON.parse(jsonLog!.substring('json:'.length)) as Record<
    string,
    unknown
  >;
}

describe('ListWebhooksCommand', () => {
  it('lists repository webhooks from the git context with pagination params', async () => {
    const calls: ApiCall[] = [];
    const output = createMockOutputService();
    const command = new ListWebhooksCommand(
      createMockWebhooksApi({ calls }),
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(calls[0]?.method).toBe('repoList');
    expect(calls[0]?.request).toEqual({ workspace: 'acme', repoSlug: 'demo' });
    expect(calls[0]?.axiosOptions?.params?.page).toBe(1);
    expect(getTableRows(output.logs)).toEqual([
      [
        UID,
        'CI trigger',
        'https://ci.example.com/hook',
        'repo:push,pullrequest:created',
        'yes',
      ],
    ]);
  });

  it('lists workspace webhooks with --scope workspace', async () => {
    const calls: ApiCall[] = [];
    const command = new ListWebhooksCommand(
      createMockWebhooksApi({ calls }),
      repoContextService(),
      createMockOutputService()
    );

    await command.execute({ scope: 'workspace' }, { globalOptions: {} });

    expect(calls[0]?.method).toBe('workspaceList');
    expect(calls[0]?.request).toEqual({ workspace: 'acme' });
  });

  it('emits the { workspace, repoSlug, count, webhooks } envelope', async () => {
    const output = createMockOutputService();
    const command = new ListWebhooksCommand(
      createMockWebhooksApi(),
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual([
      'workspace',
      'repoSlug',
      'count',
      'webhooks',
    ]);
    expect(payload.count).toBe(1);
  });

  it('omits repoSlug from the workspace-scope envelope', async () => {
    const output = createMockOutputService();
    const command = new ListWebhooksCommand(
      createMockWebhooksApi(),
      createMockContextService({ defaultWorkspace: 'acme' }),
      output
    );

    await command.execute(
      { scope: 'workspace' },
      { globalOptions: { json: true } }
    );

    expect(Object.keys(getJsonPayload(output.logs))).toEqual([
      'workspace',
      'count',
      'webhooks',
    ]);
  });

  it('shows the empty state naming the target', async () => {
    const output = createMockOutputService();
    const command = new ListWebhooksCommand(
      createMockWebhooksApi({ webhooks: [] }),
      repoContextService(),
      output
    );

    await command.execute({}, { globalOptions: {} });

    expect(output.logs).toContain('info:No webhooks found for acme/demo');
  });

  it('rejects an unknown --scope', async () => {
    const command = new ListWebhooksCommand(
      createMockWebhooksApi(),
      repoContextService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ scope: 'org' }, { globalOptions: {} })
    ).rejects.toThrow('--scope must be one of: repo, workspace');
  });

  it('rejects --repo together with --scope workspace', async () => {
    const command = new ListWebhooksCommand(
      createMockWebhooksApi(),
      repoContextService(),
      createMockOutputService()
    );

    await expect(
      command.execute(
        { scope: 'workspace', repo: 'demo' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('--repo cannot be combined with --scope workspace');
  });
});

describe('ViewWebhookCommand', () => {
  it('renders webhook details', async () => {
    const output = createMockOutputService();
    const command = new ViewWebhookCommand(
      createMockWebhooksApi(),
      repoContextService(),
      output
    );

    await command.execute({ uid: UID }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('CI trigger'))).toBe(true);
    expect(output.logs).toContain(
      'text:URL:        https://ci.example.com/hook'
    );
    expect(output.logs).toContain('text:Secret:     set');
    expect(output.logs).toContain('text:  repo:push');
  });

  it('wraps a bare UUID in braces', async () => {
    const calls: ApiCall[] = [];
    const command = new ViewWebhookCommand(
      createMockWebhooksApi({ calls }),
      repoContextService(),
      createMockOutputService()
    );

    await command.execute(
      { uid: 'a1b2c3d4-0000-0000-0000-000000000000' },
      { globalOptions: {} }
    );

    expect(calls[0]?.request.uid).toBe(UID);
  });

  it('emits the { workspace, repoSlug, webhook } envelope', async () => {
    const output = createMockOutputService();
    const command = new ViewWebhookCommand(
      createMockWebhooksApi(),
      repoContextService(),
      output
    );

    await command.execute({ uid: UID }, { globalOptions: { json: true } });

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['workspace', 'repoSlug', 'webhook']);
    expect((payload.webhook as WebhookSubscription).uuid).toBe(UID);
  });

  it('names the webhook and target on a 404', async () => {
    const command = new ViewWebhookCommand(
      createMockWebhooksApi({ notFound: true }),
      repoContextService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ uid: UID }, { globalOptions: {} })
    ).rejects.toThrow(`Webhook ${UID} not found for acme/demo.`);
  });
});

describe('CreateWebhookCommand', () => {
  it('POSTs an active webhook body with de-duplicated events', async () => {
    const calls: ApiCall[] = [];
    const output = createMockOutputService();
    const command = new CreateWebhookCommand(
      createMockWebhooksApi({ calls }),
      repoContextService(),
      output
    );

    await command.execute(
      {
        url: 'https://ci.example.com/hook',
        event: ['repo:push', 'pullrequest:created', 'repo:push'],
        description: 'CI trigger',
        secret: 's3cret',
      },
      { globalOptions: {} }
    );

    expect(calls[0]?.method).toBe('repoCreate');
    expect(calls[0]?.request).toEqual({
      workspace: 'acme',
      repoSlug: 'demo',
      body: {
        type: 'webhook_subscription',
        url: 'https://ci.example.com/hook',
        events: ['repo:push', 'pullrequest:created'],
        active: true,
        description: 'CI trigger',
        secret: 's3cret',
      },
    });
    expect(output.logs).toContain(
      `success:Created webhook ${UID} for acme/demo`
    );
  });

  it('creates an inactive workspace webhook without optional fields', async () => {
    const calls: ApiCall[] = [];
    const command = new CreateWebhookCommand(
      createMockWebhooksApi({ calls }),
      createMockContextService({ defaultWorkspace: 'acme' }),
      createMockOutputService()
    );

    await command.execute(
      {
        scope: 'workspace',
        url: 'https://example.com/hook',
        event: ['repo:push'],
        inactive: true,
      },
      { globalOptions: {} }
    );

    expect(calls[0]?.method).toBe('workspaceCreate');
    expect(calls[0]?.request).toEqual({
      workspace: 'acme',
      body: {
        type: 'webhook_subscription',
        url: 'https://example.com/hook',
        events: ['repo:push'],
        active: false,
      },
    });
  });

  it('sends the body as JSON with events as an array through the generated client', async () => {
    const requests: InternalAxiosRequestConfig[] = [];
    const { adapter } = createMockAdapter(
      [{ status: 201, data: mockWebhook }],
      { onRequest: (config) => requests.push(config) }
    );
    const command = new CreateWebhookCommand(
      new WebhooksApi(
        undefined,
        'https://api.example.test/2.0',
        axios.create({ adapter })
      ),
      repoContextService(),
      createMockOutputService()
    );

    await command.execute(
      { url: 'https://example.com/hook', event: ['repo:push'] },
      { globalOptions: {} }
    );

    expect(requests[0]?.method).toBe('post');
    expect(requests[0]?.url).toBe(
      'https://api.example.test/2.0/repositories/acme/demo/hooks'
    );
    expect(JSON.parse(requests[0]?.data as string)).toEqual({
      type: 'webhook_subscription',
      url: 'https://example.com/hook',
      events: ['repo:push'],
      active: true,
    });
  });

  it('emits the { workspace, repoSlug, webhook } envelope', async () => {
    const output = createMockOutputService();
    const command = new CreateWebhookCommand(
      createMockWebhooksApi(),
      repoContextService(),
      output
    );

    await command.execute(
      { url: 'https://example.com/hook', event: ['repo:push'] },
      { globalOptions: { json: true } }
    );

    const payload = getJsonPayload(output.logs);
    expect(Object.keys(payload)).toEqual(['workspace', 'repoSlug', 'webhook']);
  });

  it('requires --url and at least one --event', async () => {
    const command = new CreateWebhookCommand(
      createMockWebhooksApi(),
      repoContextService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ event: ['repo:push'] }, { globalOptions: {} })
    ).rejects.toThrow('Option --url is required');
    await expect(
      command.execute(
        { url: 'https://example.com/hook' },
        { globalOptions: {} }
      )
    ).rejects.toThrow('At least one --event is required');
  });

  it('rejects an unknown event with a suggestion', async () => {
    const calls: ApiCall[] = [];
    const command = new CreateWebhookCommand(
      createMockWebhooksApi({ calls }),
      repoContextService(),
      createMockOutputService()
    );

    await expect(
      command.execute(
        { url: 'https://example.com/hook', event: ['repo:psuh'] },
        { globalOptions: {} }
      )
    ).rejects.toThrow('repo:push');
    expect(calls).toEqual([]);
  });
});

describe('DeleteWebhookCommand', () => {
  it('requires --yes and does not call the API without it', async () => {
    const calls: ApiCall[] = [];
    const command = new DeleteWebhookCommand(
      createMockWebhooksApi({ calls }),
      repoContextService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ uid: UID }, { globalOptions: {} })
    ).rejects.toThrow('Use --yes to confirm.');
    expect(calls).toEqual([]);
  });

  it('deletes a repository webhook with --yes', async () => {
    const calls: ApiCall[] = [];
    const output = createMockOutputService();
    const command = new DeleteWebhookCommand(
      createMockWebhooksApi({ calls }),
      repoContextService(),
      output
    );

    await command.execute({ uid: UID, yes: true }, { globalOptions: {} });

    expect(calls[0]).toMatchObject({
      method: 'repoDelete',
      request: { workspace: 'acme', repoSlug: 'demo', uid: UID },
    });
    expect(output.logs).toContain(`success:Deleted webhook ${UID}`);
  });

  it('deletes a workspace webhook and emits the JSON result', async () => {
    const calls: ApiCall[] = [];
    const output = createMockOutputService();
    const command = new DeleteWebhookCommand(
      createMockWebhooksApi({ calls }),
      createMockContextService({ defaultWorkspace: 'acme' }),
      output
    );

    await command.execute(
      { uid: UID, yes: true, scope: 'workspace' },
      { globalOptions: { json: true } }
    );

    expect(calls[0]?.method).toBe('workspaceDelete');
    expect(getJsonPayload(output.logs)).toEqual({
      success: true,
      workspace: 'acme',
      webhookId: UID,
    });
  });

  it('names the webhook and target on a 404', async () => {
    const command = new DeleteWebhookCommand(
      createMockWebhooksApi({ notFound: true }),
      createMockContextService({ defaultWorkspace: 'acme' }),
      createMockOutputService()
    );

    await expect(
      command.execute(
        { uid: UID, yes: true, scope: 'workspace' },
        { globalOptions: {} }
      )
    ).rejects.toThrow(`Webhook ${UID} not found for workspace acme.`);
  });
});
