export interface CloneLink {
  name?: string;
  href?: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isIterable = (value: unknown): value is Iterable<unknown> =>
  isObject(value) && Symbol.iterator in value;

export const toArray = <T>(values?: Iterable<T> | null): T[] => {
  return values ? Array.from(values) : [];
};

export const getLinkHref = (
  links: unknown,
  key: string
): string | undefined => {
  if (!isObject(links)) {
    return undefined;
  }

  const link = links[key];
  if (!isObject(link)) {
    return undefined;
  }

  const href = link.href;
  return typeof href === 'string' ? href : undefined;
};

export const getCloneLinks = (links: unknown): CloneLink[] => {
  if (!isObject(links)) {
    return [];
  }

  const cloneLinks = links.clone;
  if (!isIterable(cloneLinks)) {
    return [];
  }

  return Array.from(cloneLinks)
    .map((entry) => {
      if (!isObject(entry)) {
        return {};
      }

      const name = entry.name;
      const href = entry.href;
      return {
        name: typeof name === 'string' ? name : undefined,
        href: typeof href === 'string' ? href : undefined,
      };
    })
    .filter((entry) => entry.name || entry.href);
};

export const getBranchName = (endpoint: unknown): string | undefined => {
  if (!isObject(endpoint)) {
    return undefined;
  }

  const branch = endpoint.branch;
  if (!isObject(branch)) {
    return undefined;
  }

  const name = branch.name;
  return typeof name === 'string' ? name : undefined;
};

export const getUserDisplayName = (user: unknown): string | undefined => {
  if (!isObject(user)) {
    return undefined;
  }

  const nickname = user.nickname;
  if (typeof nickname === 'string' && nickname.length > 0) {
    return nickname;
  }

  const displayName = user.display_name;
  if (typeof displayName === 'string' && displayName.length > 0) {
    return displayName;
  }

  const username = user.username;
  return typeof username === 'string' && username.length > 0
    ? username
    : undefined;
};

export const getContentRaw = (content: unknown): string | undefined => {
  if (!isObject(content)) {
    return undefined;
  }

  const raw = content.raw;
  return typeof raw === 'string' ? raw : undefined;
};
