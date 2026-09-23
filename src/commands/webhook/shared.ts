/**
 * Shared helpers for webhook commands
 */

import type { CommandContext } from '../../core/interfaces/commands.js';
import type { IContextService } from '../../core/interfaces/services.js';
import type {
  PaginatedWebhookSubscriptions,
  WebhookSubscription,
  WebhooksApi,
} from '../../generated/api.js';
import { WebhookSubscriptionEventsEnum } from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export const WEBHOOK_SCOPES = ['repo', 'workspace'] as const;
export type WebhookScope = (typeof WEBHOOK_SCOPES)[number];
export const DEFAULT_WEBHOOK_SCOPE: WebhookScope = 'repo';

export const WEBHOOK_EVENTS = Object.values(
  WebhookSubscriptionEventsEnum
) as readonly WebhookSubscriptionEventsEnum[];

export interface WebhookScopeOptions extends GlobalOptions {
  scope?: string;
}

/**
 * The webhooks of one repository or one workspace. The two endpoint families
 * mirror each other, so commands work against this and never branch on scope.
 */
export interface WebhookTarget {
  /** Human-readable location, e.g. `ws/repo` or `workspace ws`. */
  label: string;
  /** JSON envelope fields identifying where the webhooks live. */
  metadata: { workspace: string; repoSlug?: string };
  list(page: number, pagelen: number): Promise<PaginatedWebhookSubscriptions>;
  get(uid: string): Promise<WebhookSubscription>;
  create(body: WebhookSubscription): Promise<WebhookSubscription>;
  delete(uid: string): Promise<void>;
}

export async function resolveWebhooks(
  scope: WebhookScope,
  options: WebhookScopeOptions,
  context: CommandContext,
  contextService: IContextService,
  api: WebhooksApi
): Promise<WebhookTarget> {
  if (scope === 'repo') {
    const { workspace, repoSlug } = await contextService.requireRepoContextFor(
      options,
      context
    );
    return {
      label: `${workspace}/${repoSlug}`,
      metadata: { workspace, repoSlug },
      list: async (page, pagelen) =>
        (
          await api.repositoriesWorkspaceRepoSlugHooksGet(
            { workspace, repoSlug },
            { params: { page, pagelen } }
          )
        ).data,
      get: async (uid) =>
        (
          await api.repositoriesWorkspaceRepoSlugHooksUidGet({
            workspace,
            repoSlug,
            uid,
          })
        ).data,
      create: async (body) =>
        (
          await api.repositoriesWorkspaceRepoSlugHooksPost({
            workspace,
            repoSlug,
            body,
          })
        ).data,
      delete: async (uid) => {
        await api.repositoriesWorkspaceRepoSlugHooksUidDelete({
          workspace,
          repoSlug,
          uid,
        });
      },
    };
  }

  if (options.repo ?? context.globalOptions.repo) {
    throw new BBError({
      code: ErrorCode.VALIDATION_INVALID,
      message:
        '--repo cannot be combined with --scope workspace; workspace webhooks apply to every repository.',
    });
  }

  const workspace = await contextService.resolveWorkspaceFor(options, context);
  return {
    label: `workspace ${workspace}`,
    metadata: { workspace },
    list: async (page, pagelen) =>
      (
        await api.workspacesWorkspaceHooksGet(
          { workspace },
          { params: { page, pagelen } }
        )
      ).data,
    get: async (uid) =>
      (await api.workspacesWorkspaceHooksUidGet({ workspace, uid })).data,
    create: async (body) =>
      (await api.workspacesWorkspaceHooksPost({ workspace, body })).data,
    delete: async (uid) => {
      await api.workspacesWorkspaceHooksUidDelete({ workspace, uid });
    },
  };
}

/** Webhook ids are brace-wrapped UUIDs; accept a bare UUID too. */
export function normalizeWebhookUid(uid: string): string {
  const trimmed = uid.trim();
  if (trimmed.length === 0) {
    throw new BBError({
      code: ErrorCode.VALIDATION_REQUIRED,
      message: 'A webhook UUID is required.',
    });
  }
  return trimmed.startsWith('{') ? trimmed : `{${trimmed}}`;
}
