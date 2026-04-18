/**
 * Pull request related constants and types
 */

export const PR_STATES = ['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'] as const;

export type PRState = (typeof PR_STATES)[number];
