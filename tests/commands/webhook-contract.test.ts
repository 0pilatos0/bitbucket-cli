import { describe, expect, it } from 'bun:test';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { CreateWebhookCommand } from '../../src/commands/webhook/create.command.js';
import { DeleteWebhookCommand } from '../../src/commands/webhook/delete.command.js';
import { ListWebhooksCommand } from '../../src/commands/webhook/list.command.js';
import { ViewWebhookCommand } from '../../src/commands/webhook/view.command.js';
import {
  WebhooksApi,
  type WebhookSubscription,
} from '../../src/generated/api.js';
import {
  createMockAdapter,
  createMockContextService,
  createMockOutputService,
} from '../setup.js';

const BASE_URL = 'https://api.example.test/2.0';
const UID = '{a1b2c3d4-0000-0000-0000-000000000000}';
const body: WebhookSubscription = {
  type: 'webhook_subscription',
  url: 'https://example.com/hook',
  events: ['repo:push', 'pullrequest:created'],
  description: 'CI trigger',
  active: false,
  secret: 'test-secret',
};
const webhook: WebhookSubscription = { ...body, uuid: UID };

for (const scope of ['repo', 'workspace'] as const) {
  const path =
    scope === 'repo'
      ? '/repositories/acme/demo/hooks'
      : '/workspaces/acme/hooks';
  const contextService = createMockContextService({
    workspace: 'acme',
    repoSlug: 'demo',
  });

  describe(`${scope} webhook HTTP contract`, () => {
    it('preserves create/get/update/delete paths and JSON event bodies', async () => {
      const requests: InternalAxiosRequestConfig[] = [];
      const { adapter } = createMockAdapter(
        [
          { status: 201, data: webhook },
          { status: 200, data: webhook },
          { status: 200, data: webhook },
          { status: 204, data: undefined },
        ],
        { onRequest: (config) => requests.push(config) }
      );
      const api = new WebhooksApi(
        undefined,
        BASE_URL,
        axios.create({ adapter })
      );
      const output = createMockOutputService();
      const context = { globalOptions: { json: true } };

      await new CreateWebhookCommand(api, contextService, output).execute(
        {
          scope,
          url: body.url,
          event: body.events,
          description: body.description,
          secret: body.secret,
          inactive: true,
        },
        context
      );
      await new ViewWebhookCommand(api, contextService, output).execute(
        { scope, uid: UID.slice(1, -1) },
        context
      );
      if (scope === 'repo') {
        await api.updateRepositoryHook({
          workspace: 'acme',
          repoSlug: 'demo',
          uid: UID,
          body,
        });
      } else {
        await api.updateWorkspaceHook({ workspace: 'acme', uid: UID, body });
      }
      await new DeleteWebhookCommand(api, contextService, output).execute(
        { scope, uid: UID.slice(1, -1), yes: true },
        context
      );

      expect(requests.map((request) => request.method)).toEqual([
        'post',
        'get',
        'put',
        'delete',
      ]);
      expect(requests.map((request) => request.url)).toEqual([
        `${BASE_URL}${path}`,
        ...Array(3).fill(`${BASE_URL}${path}/${encodeURIComponent(UID)}`),
      ]);
      for (const request of [requests[0]!, requests[2]!]) {
        expect(request.headers.get('Content-Type')).toBe('application/json');
        expect(JSON.parse(request.data as string)).toEqual(body);
      }
    });

    for (const options of [{ all: true }, { limit: '3' }]) {
      it(`follows opaque continuation queries with ${JSON.stringify(options)}`, async () => {
        const requests: InternalAxiosRequestConfig[] = [];
        const { adapter } = createMockAdapter(
          [
            {
              status: 200,
              data: {
                values: [webhook],
                size: 3,
                next: `${BASE_URL}${path}?page=opaque%2Btoken%3D&pagelen=1&cursor=first`,
              },
            },
            {
              status: 200,
              data: {
                values: [{ ...webhook, uuid: '{second}' }],
                next: `${BASE_URL}${path}?cursor=second%2Ftoken&pagelen=1`,
              },
            },
            {
              status: 200,
              data: { values: [{ ...webhook, uuid: '{third}' }] },
            },
          ],
          { onRequest: (config) => requests.push(config) }
        );
        const api = new WebhooksApi(
          undefined,
          BASE_URL,
          axios.create({ adapter })
        );
        const output = createMockOutputService();

        await new ListWebhooksCommand(api, contextService, output).execute(
          { scope, ...options },
          { globalOptions: { json: true } }
        );

        expect(requests).toHaveLength(3);
        expect(requests.map((request) => request.url)).toEqual(
          Array(3).fill(`${BASE_URL}${path}`)
        );
        expect(requests[0]!.params).toEqual({
          page: 1,
          pagelen: 'all' in options ? 50 : 3,
        });
        expect(requests[1]!.params).toEqual({
          page: 'opaque+token=',
          pagelen: '1',
          cursor: 'first',
        });
        expect(requests[2]!.params).toEqual({
          cursor: 'second/token',
          pagelen: '1',
        });
        const payload = JSON.parse(
          output.logs.find((line) => line.startsWith('json:'))!.slice(5)
        );
        expect(
          payload.webhooks.map((hook: WebhookSubscription) => hook.uuid)
        ).toEqual([UID, '{second}', '{third}']);
      });
    }
  });
}
