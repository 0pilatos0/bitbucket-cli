/**
 * Resolve a user reference typed on the command line to a Bitbucket account.
 *
 * Accepts `@me`, an account ID, a braced `{uuid}`, an email address, or a
 * nickname / display name matched against the workspace members.
 */

import type {
  PaginatedWorkspaceMemberships,
  User,
  UsersApi,
  WorkspaceMembership,
  WorkspacesApi,
} from '../generated/api.js';
import { BBError, ErrorCode } from '../types/errors.js';
import { collectPages } from './pagination.js';

export interface ResolvedUser {
  uuid: string;
  displayName?: string;
  nickname?: string;
  accountId?: string;
}

const BRACED_UUID = /^\{[0-9a-f-]+\}$/i;
// Atlassian account IDs: `557058:<uuid>`, `qm:<uuid>:<uuid>` or legacy 24-char hex.
const ACCOUNT_ID = /^(\S+:\S+|[0-9a-f]{24})$/i;
const EMAIL = /^[^\s@]+@[^\s@]+$/;

// The generated membership `user` is typed as Account; on the wire it is a
// User, plus `email` when requested through `fields=+values.user.email`.
type MemberUser = User & { email?: string };

export class UserResolverService {
  private currentUser?: Promise<ResolvedUser>;
  private readonly membersByWorkspace = new Map<
    string,
    Promise<ResolvedUser[]>
  >();

  constructor(
    private readonly usersApi: UsersApi,
    private readonly workspacesApi: WorkspacesApi
  ) {}

  public async resolve(
    workspace: string,
    input: string
  ): Promise<ResolvedUser> {
    const query = input.trim();

    if (query.toLowerCase() === '@me') {
      this.currentUser ??= this.usersApi
        .userGet()
        .then((response) => this.toResolved(response.data, query));
      return this.currentUser;
    }

    if (BRACED_UUID.test(query) || ACCOUNT_ID.test(query)) {
      const response = await this.usersApi.usersSelectedUserGet({
        selectedUser: query,
      });
      return this.toResolved(response.data, query);
    }

    if (EMAIL.test(query)) {
      return this.resolveByEmail(workspace, query);
    }

    return this.resolveByName(workspace, query);
  }

  // Bitbucket only honours the email filter for workspace admins and
  // workspace/integration tokens, and may ignore it for anyone else, so only
  // members whose returned email is the one asked for count.
  private async resolveByEmail(
    workspace: string,
    email: string
  ): Promise<ResolvedUser> {
    const members = await this.fetchMembers(workspace, {
      q: `user.email IN (${JSON.stringify(email)})`,
      fields: '+values.user.email',
    });
    const needle = email.toLowerCase();
    return this.pickOne(
      workspace,
      email,
      members
        .filter((member) => member.email?.toLowerCase() === needle)
        .map((member) => this.toResolved(member, email)),
      `No member of workspace '${workspace}' has the email ${email}. ` +
        'Bitbucket only matches emails for workspace admins; ' +
        'use a nickname, display name, account ID or {uuid} instead.'
    );
  }

  private async resolveByName(
    workspace: string,
    name: string
  ): Promise<ResolvedUser> {
    let members = this.membersByWorkspace.get(workspace);
    if (!members) {
      members = this.fetchMembers(workspace).then((users) =>
        users.map((user) => this.toResolved(user, name))
      );
      this.membersByWorkspace.set(workspace, members);
    }
    const all = await members;

    const needle = name.toLowerCase();
    const byNickname = all.filter(
      (member) => member.nickname?.toLowerCase() === needle
    );
    const matches =
      byNickname.length > 0
        ? byNickname
        : all.filter((member) => member.displayName?.toLowerCase() === needle);

    return this.pickOne(
      workspace,
      name,
      matches,
      `No member of workspace '${workspace}' has the nickname or display name '${name}'. ` +
        'Use an account ID, {uuid}, email or @me instead.'
    );
  }

  private async fetchMembers(
    workspace: string,
    params: { q?: string; fields?: string } = {}
  ): Promise<MemberUser[]> {
    const memberships = await collectPages<WorkspaceMembership>({
      limit: Number.POSITIVE_INFINITY,
      fetchPage: async (page, pagelen) => {
        const response = await this.workspacesApi.workspacesWorkspaceMembersGet(
          { workspace },
          { params: { page, pagelen, ...params } }
        );
        return response.data as PaginatedWorkspaceMemberships;
      },
    });

    return memberships.flatMap((membership) =>
      membership.user?.uuid ? [membership.user as MemberUser] : []
    );
  }

  private toResolved(user: User, query: string): ResolvedUser {
    if (!user.uuid) {
      throw new BBError({
        code: ErrorCode.API_REQUEST_FAILED,
        message: `Bitbucket returned no UUID for user '${query}'.`,
      });
    }
    return {
      uuid: user.uuid,
      displayName: user.display_name,
      nickname: user.nickname,
      accountId: user.account_id,
    };
  }

  private pickOne(
    workspace: string,
    query: string,
    matches: ResolvedUser[],
    notFoundMessage: string
  ): ResolvedUser {
    const [first, ...rest] = matches;
    if (!first) {
      throw new BBError({
        code: ErrorCode.API_NOT_FOUND,
        message: notFoundMessage,
        context: { workspace, user: query },
      });
    }
    if (rest.length === 0) {
      return first;
    }

    const candidates = matches.map(
      (m) =>
        `  ${m.displayName ?? '(no name)'}  nickname: ${m.nickname ?? '-'}  ${m.accountId ?? m.uuid}`
    );
    throw new BBError({
      code: ErrorCode.VALIDATION_INVALID,
      message: [
        `'${query}' matches ${matches.length} members of workspace '${workspace}':`,
        ...candidates,
        'Pass one of the account IDs above instead.',
      ].join('\n'),
      context: { workspace, user: query, candidates: matches },
    });
  }
}
