/**
 * Shared helpers for the `bb branch-restriction` command group
 */

import type { Branchrestriction } from '../../generated/api.js';
import {
  BranchrestrictionBranchTypeEnum,
  BranchrestrictionKindEnum,
} from '../../generated/api.js';

/** Restriction kinds, single-sourced from the generated enum. */
export const BRANCH_RESTRICTION_KINDS = Object.values(
  BranchrestrictionKindEnum
) as readonly BranchrestrictionKindEnum[];

/** Branching-model branch types a restriction can target. */
export const BRANCH_RESTRICTION_BRANCH_TYPES = Object.values(
  BranchrestrictionBranchTypeEnum
) as readonly BranchrestrictionBranchTypeEnum[];

/**
 * The branches a restriction applies to: the glob pattern, or the
 * branching-model branch type for `branching_model` matches.
 */
export function describeBranchMatch(restriction: Branchrestriction): string {
  if (restriction.branch_match_kind === 'branching_model') {
    return `${restriction.branch_type ?? '?'} (branching model)`;
  }
  return restriction.pattern || '-';
}
