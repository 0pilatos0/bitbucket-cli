/**
 * Typed in-memory fakes for the generated `*Api` classes (or any class whose
 * public methods a test needs to stub).
 *
 * Prefer `tests/helpers/mock-bitbucket.ts` for new command tests: it runs the
 * real generated client over HTTP. These fakes are for unit tests that need a
 * stub at the API-class boundary.
 */

import type { AxiosResponse } from 'axios';
import type { Account, UsersApi } from '../../src/generated/api.js';
import { mockUser } from '../setup.js';

/**
 * Any subset of `T`'s public methods. Method names and parameters are checked
 * against `T` whenever tests are type-checked (`bun run lint` covers only
 * `src/` today). Return values stay loose: commands only read `.data`, so
 * fakes may resolve to `{ data }` with a partial payload.
 */
export type FakeApi<T> = {
  [K in keyof T]?: T[K] extends (...args: infer A) => unknown
    ? (...args: A) => unknown
    : never;
};

/**
 * The one place a partial fake becomes the full API type. `X` carries extra
 * recorder fields a fake exposes to its tests (e.g. `lastPutBody`).
 */
export function fakeApi<T, X extends object = object>(
  methods: FakeApi<T> & X
): T & X {
  return methods as unknown as T & X;
}

export function axiosResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as AxiosResponse['config'],
  };
}

/**
 * Reads `page`/`pagelen` from the axios options a command passes to a list
 * endpoint, falling back to Bitbucket's defaults (page 1, pagelen 25).
 */
export function extractPaginationParams(axiosOptions: unknown): {
  page: number;
  pagelen: number;
} {
  const params = (axiosOptions as { params?: unknown } | undefined)?.params;
  const read = (key: 'page' | 'pagelen'): unknown =>
    params instanceof URLSearchParams
      ? Number(params.get(key) ?? Number.NaN)
      : (params as Record<string, unknown> | undefined)?.[key];
  const positive = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) && value > 0
      ? value
      : fallback;

  return {
    page: positive(read('page'), 1),
    pagelen: positive(read('pagelen'), 25),
  };
}

export interface FakeUsersApiOptions {
  /** Returned by `userGet`; defaults to `mockUser`. */
  currentUser?: Account;
  /** Thrown by `userGet` instead of returning `currentUser`. */
  currentUserError?: Error;
  /**
   * Answers `usersSelectedUserGet`; throw to simulate an unknown user.
   * Defaults to `mockUser` with uuid `{<name>-uuid}` and display name
   * `Display <name>`.
   */
  resolveUser?: (selectedUser: string) => Account;
}

export function fakeUsersApi(options: FakeUsersApiOptions = {}): UsersApi {
  const resolveUser =
    options.resolveUser ??
    ((selectedUser: string): Account => ({
      ...mockUser,
      uuid: `{${selectedUser}-uuid}`,
      display_name: `Display ${selectedUser}`,
    }));

  return fakeApi<UsersApi>({
    async userGet() {
      if (options.currentUserError) {
        throw options.currentUserError;
      }
      return axiosResponse(options.currentUser ?? mockUser);
    },
    async usersSelectedUserGet({ selectedUser }) {
      return axiosResponse(resolveUser(selectedUser));
    },
  });
}
