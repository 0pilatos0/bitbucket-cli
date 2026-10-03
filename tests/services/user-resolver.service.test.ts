/**
 * UserResolverService tests.
 */

import { describe, it, expect } from 'bun:test';
import type { AxiosResponse } from 'axios';
import { UserResolverService } from '../../src/services/user-resolver.service.js';
import type {
  User,
  UsersApi,
  WorkspaceMembership,
  WorkspacesApi,
} from '../../src/generated/api.js';
import { BBError, ErrorCode } from '../../src/types/errors.js';

function axiosOk<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as never,
  };
}

const JANE: User = {
  type: 'user',
  uuid: '{jane-uuid}',
  account_id: '712020:jane',
  display_name: 'Jane Doe',
  nickname: 'jdoe',
};
const JANE_SMITH: User = {
  type: 'user',
  uuid: '{smith-uuid}',
  account_id: '712020:smith',
  display_name: 'Jane Smith',
  nickname: 'jane',
};
const JOHN_A: User = {
  type: 'user',
  uuid: '{john-a-uuid}',
  account_id: '712020:john-a',
  display_name: 'John Park',
  nickname: 'jpark',
};
const JOHN_B: User = {
  type: 'user',
  uuid: '{john-b-uuid}',
  account_id: '712020:john-b',
  display_name: 'John Park',
  nickname: 'johnp',
};

interface MembersRequest {
  workspace: string;
  params: { page?: number; pagelen?: number; q?: string; fields?: string };
}

function createResolver(
  options: {
    memberPages?: User[][];
    emailMatches?: Array<User & { email?: string }>;
    me?: User;
  } = {}
): {
  resolver: UserResolverService;
  membersRequests: MembersRequest[];
  calls: { userGet: number; selectedUser: string[] };
} {
  const membersRequests: MembersRequest[] = [];
  const calls = { userGet: 0, selectedUser: [] as string[] };
  const pages = options.memberPages ?? [[JANE, JANE_SMITH, JOHN_A, JOHN_B]];

  const usersApi = {
    async userGet() {
      calls.userGet += 1;
      return axiosOk(options.me ?? JANE);
    },
    async usersSelectedUserGet(params: { selectedUser: string }) {
      calls.selectedUser.push(params.selectedUser);
      return axiosOk({ ...JANE, uuid: `{${params.selectedUser}}` });
    },
  } as unknown as UsersApi;

  const workspacesApi = {
    async workspacesWorkspaceMembersGet(
      request: { workspace: string },
      axiosOpts: { params: MembersRequest['params'] }
    ) {
      membersRequests.push({
        workspace: request.workspace,
        params: axiosOpts.params,
      });
      const toMembership = (user: User): WorkspaceMembership => ({
        type: 'workspace_membership',
        user,
      });
      if (axiosOpts.params.q) {
        return axiosOk({
          values: (options.emailMatches ?? []).map(toMembership),
        });
      }
      const page = axiosOpts.params.page ?? 1;
      return axiosOk({
        values: (pages[page - 1] ?? []).map(toMembership),
        next: page < pages.length ? `next-${page + 1}` : undefined,
      });
    },
  } as unknown as WorkspacesApi;

  return {
    resolver: new UserResolverService(usersApi, workspacesApi),
    membersRequests,
    calls,
  };
}

async function captureError(promise: Promise<unknown>): Promise<BBError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof BBError) {
      return error;
    }
    throw error;
  }
  throw new Error('expected a BBError');
}

describe('UserResolverService', () => {
  it('resolves @me through GET /user once per run', async () => {
    const { resolver, calls, membersRequests } = createResolver();

    const first = await resolver.resolve('ws', '@me');
    const second = await resolver.resolve('ws', '@ME');

    expect(first.uuid).toBe('{jane-uuid}');
    expect(second).toBe(first);
    expect(calls.userGet).toBe(1);
    expect(membersRequests).toHaveLength(0);
  });

  it('passes braced UUIDs and account IDs straight to GET /users', async () => {
    const { resolver, calls, membersRequests } = createResolver();

    await resolver.resolve('ws', '{c1cb1bb5-2e32-456e-a373-43978dc12aa1}');
    await resolver.resolve('ws', '712020:3cfed7e0-0ed6-49fc-bb35-410a00ccee6f');
    await resolver.resolve('ws', '5b10ac8d82e05b22cc7d4ef5');
    await resolver.resolve('ws', 'qm:a1b2c3d4-0000:e5f6a7b8-1111');

    expect(calls.selectedUser).toEqual([
      '{c1cb1bb5-2e32-456e-a373-43978dc12aa1}',
      '712020:3cfed7e0-0ed6-49fc-bb35-410a00ccee6f',
      '5b10ac8d82e05b22cc7d4ef5',
      'qm:a1b2c3d4-0000:e5f6a7b8-1111',
    ]);
    expect(membersRequests).toHaveLength(0);
  });

  it('matches a nickname exactly, ignoring case', async () => {
    const { resolver } = createResolver();

    const user = await resolver.resolve('ws', 'JDoe');

    expect(user).toEqual({
      uuid: '{jane-uuid}',
      displayName: 'Jane Doe',
      nickname: 'jdoe',
      accountId: '712020:jane',
    });
  });

  it('matches a display name when no nickname matches', async () => {
    const { resolver } = createResolver();

    const user = await resolver.resolve('ws', 'jane doe');

    expect(user.uuid).toBe('{jane-uuid}');
  });

  it('prefers a nickname match over a display name match', async () => {
    const { resolver } = createResolver({
      memberPages: [[{ ...JANE, display_name: 'jane' }, JANE_SMITH]],
    });

    const user = await resolver.resolve('ws', 'jane');

    expect(user.uuid).toBe('{smith-uuid}');
  });

  it('lists every candidate when a name is ambiguous', async () => {
    const { resolver } = createResolver();

    const error = await captureError(resolver.resolve('ws', 'John Park'));

    expect(error.code).toBe(ErrorCode.VALIDATION_INVALID);
    expect(error.message).toContain(
      "'John Park' matches 2 members of workspace 'ws'"
    );
    expect(error.message).toContain('712020:john-a');
    expect(error.message).toContain('712020:john-b');
  });

  it('fails with a not-found error for an unknown name', async () => {
    const { resolver } = createResolver();

    const error = await captureError(resolver.resolve('ws', 'nobody'));

    expect(error.code).toBe(ErrorCode.API_NOT_FOUND);
    expect(error.message).toContain(
      "No member of workspace 'ws' has the nickname or display name 'nobody'"
    );
  });

  it('walks every page of members and fetches them once per workspace', async () => {
    const { resolver, membersRequests } = createResolver({
      memberPages: [[JANE], [JOHN_A]],
    });

    expect((await resolver.resolve('ws', 'jpark')).uuid).toBe('{john-a-uuid}');
    expect((await resolver.resolve('ws', 'jdoe')).uuid).toBe('{jane-uuid}');
    await resolver.resolve('other', 'jdoe');

    expect(
      membersRequests.map((r) => `${r.workspace}:${r.params.page}`)
    ).toEqual(['ws:1', 'ws:2', 'other:1', 'other:2']);
  });

  it('looks up an email with the workspace member email filter', async () => {
    const { resolver, membersRequests } = createResolver({
      emailMatches: [{ ...JANE, email: 'Jane@Example.com' }],
    });

    const user = await resolver.resolve('ws', 'jane@example.com');

    expect(user.uuid).toBe('{jane-uuid}');
    expect(membersRequests).toHaveLength(1);
    expect(membersRequests[0]?.params).toMatchObject({
      q: 'user.email IN ("jane@example.com")',
      fields: '+values.user.email',
    });
  });

  it('ignores members whose returned email does not match, as when the filter is not honoured', async () => {
    const { resolver } = createResolver({
      emailMatches: [JANE, { ...JOHN_A, email: 'john@example.com' }],
    });

    const error = await captureError(
      resolver.resolve('ws', 'jane@example.com')
    );

    expect(error.code).toBe(ErrorCode.API_NOT_FOUND);
  });

  it('explains the admin-only email filter when no member matches', async () => {
    const { resolver } = createResolver({ emailMatches: [] });

    const error = await captureError(
      resolver.resolve('ws', 'ghost@example.com')
    );

    expect(error.code).toBe(ErrorCode.API_NOT_FOUND);
    expect(error.message).toContain('only matches emails for workspace admins');
  });
});
