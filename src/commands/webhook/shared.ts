/**
 * Shared helpers for webhook commands
 */

import type { RawAxiosRequestConfig } from 'axios';
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

export const WEBHOOK_EVENTS = Object.values(
  WebhookSubscriptionEventsEnum
) as readonly WebhookSubscriptionEventsEnum[];

export interface WebhookScopeOptions extends GlobalOptions {
  scope?: string;
}

export type WebhookTarget =
  | { scope: 'repo'; workspace: string; repoSlug: string }
  | { scope: 'workspace'; workspace: string };

export interface WebhookEndpoints {
  list(
    options: RawAxiosRequestConfig
  ): Promise<{ data: PaginatedWebhookSubscriptions }>;
  get(uid: string): Promise<{ data: WebhookSubscription }>;
  create(body: WebhookSubscription): Promise<{ data: WebhookSubscription }>;
  delete(uid: string): Promise<unknown>;
}

export async function resolveWebhookTarget(
  scope: WebhookScope,
  options: WebhookScopeOptions,
  context: CommandContext,
  contextService: IContextService
): Promise<WebhookTarget> {
  if (scope === 'repo') {
    const repoContext = await contextService.requireRepoContextFor(
      options,
      context
    );
    return { scope, ...repoContext };
  }

  if (options.repo ?? context.globalOptions.repo) {
    throw new BBError({
      code: ErrorCode.VALIDATION_INVALID,
      message:
        '--repo cannot be combined with --scope workspace; workspace webhooks apply to every repository.',
    });
  }

  const workspace =
    options.workspace ??
    context.globalOptions.workspace ??
    (await contextService.getRepoContextFromGit())?.workspace ??
    (await contextService.requireWorkspace());
  return { scope, workspace };
}

/**
 * The repository and workspace hook endpoints mirror each other; this is the
 * one place that picks between them, so each command stays scope-agnostic.
 */
export function webhookEndpoints(
  api: WebhooksApi,
  target: WebhookTarget
): WebhookEndpoints {
  if (target.scope === 'repo') {
    const { workspace, repoSlug } = target;
    return {
      list: (options) =>
        api.repositoriesWorkspaceRepoSlugHooksGet(
          { workspace, repoSlug },
          options
        ),
      get: (uid) =>
        api.repositoriesWorkspaceRepoSlugHooksUidGet({
          workspace,
          repoSlug,
          uid,
        }),
      create: (body) =>
        api.repositoriesWorkspaceRepoSlugHooksPost({
          workspace,
          repoSlug,
          body,
        }),
      delete: (uid) =>
        api.repositoriesWorkspaceRepoSlugHooksUidDelete({
          workspace,
          repoSlug,
          uid,
        }),
    };
  }

  const { workspace } = target;
  return {
    list: (options) => api.workspacesWorkspaceHooksGet({ workspace }, options),
    get: (uid) => api.workspacesWorkspaceHooksUidGet({ workspace, uid }),
    create: (body) => api.workspacesWorkspaceHooksPost({ workspace, body }),
    delete: (uid) => api.workspacesWorkspaceHooksUidDelete({ workspace, uid }),
  };
}

/** JSON envelope metadata identifying where the webhook lives. */
export function targetMetadata(target: WebhookTarget): Record<string, string> {
  return target.scope === 'repo'
    ? { workspace: target.workspace, repoSlug: target.repoSlug }
    : { workspace: target.workspace };
}

export function describeTarget(target: WebhookTarget): string {
  return target.scope === 'repo'
    ? `${target.workspace}/${target.repoSlug}`
    : `workspace ${target.workspace}`;
}

/** Webhook ids are brace-wrapped UUIDs; accept a bare UUID too. */
export function normalizeWebhookUid(uid: string): string {
  const trimmed = uid.trim();
  return trimmed.startsWith('{') ? trimmed : `{${trimmed}}`;
}
