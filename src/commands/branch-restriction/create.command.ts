/**
 * Create branch restriction command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  Account,
  BranchRestrictionsApi,
  Branchrestriction,
  UsersApi,
} from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';
import {
  BRANCH_RESTRICTION_BRANCH_TYPES,
  BRANCH_RESTRICTION_KINDS,
  describeBranchMatch,
} from './shared.js';

/** The only kinds Bitbucket lets exempt users/groups be attached to. */
const EXEMPTABLE_KINDS: readonly string[] = ['push', 'restrict_merges'];

export interface CreateBranchRestrictionOptions extends GlobalOptions {
  kind?: string;
  pattern?: string;
  branchType?: string;
  value?: string;
  user?: string[];
  group?: string[];
}

export class CreateBranchRestrictionCommand extends BaseCommand<
  CreateBranchRestrictionOptions,
  void
> {
  public readonly name = 'create';
  public readonly description = 'Create a branch restriction rule';

  constructor(
    private readonly branchRestrictionsApi: BranchRestrictionsApi,
    private readonly usersApi: UsersApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: CreateBranchRestrictionOptions,
    context: CommandContext
  ): Promise<void> {
    const kind = this.parseEnumOption(
      this.requireOption(options.kind, 'kind'),
      'kind',
      BRANCH_RESTRICTION_KINDS
    );
    const match = this.parseMatch(options);
    const value =
      options.value === undefined ? undefined : this.parseValue(options.value);
    const users = options.user ?? [];
    const groups = options.group ?? [];

    if (
      (users.length > 0 || groups.length > 0) &&
      !EXEMPTABLE_KINDS.includes(kind)
    ) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: this.appendHelpHint(
          `--user and --group only apply to the ${EXEMPTABLE_KINDS.join(' and ')} kinds.`
        ),
        context: { kind },
      });
    }

    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const body: Branchrestriction = {
      type: 'branchrestriction',
      kind,
      ...match,
      ...(value === undefined ? {} : { value }),
      ...(users.length > 0 ? { users: await this.resolveUsers(users) } : {}),
      ...(groups.length > 0
        ? { groups: groups.map((slug) => ({ type: 'group', slug })) }
        : {}),
    };

    const response =
      await this.branchRestrictionsApi.repositoriesWorkspaceRepoSlugBranchRestrictionsPost(
        {
          workspace: repoContext.workspace,
          repoSlug: repoContext.repoSlug,
          body,
        }
      );
    const branchRestriction = response.data;

    if (context.globalOptions.json) {
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        branchRestriction,
      });
      return;
    }

    this.output.success(
      `Created branch restriction ${branchRestriction.id ?? ''} (${branchRestriction.kind} on ${describeBranchMatch(branchRestriction)})`
    );
  }

  /**
   * Exactly one of `--pattern` (glob) or `--branch-type` (branching model)
   * selects the branches. The spec marks `pattern` required, so a
   * branching-model rule still sends it, empty.
   */
  private parseMatch(
    options: CreateBranchRestrictionOptions
  ): Pick<Branchrestriction, 'branch_match_kind' | 'pattern' | 'branch_type'> {
    if (options.pattern !== undefined && options.branchType !== undefined) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: this.appendHelpHint(
          '--pattern and --branch-type cannot both be set.'
        ),
      });
    }
    if (options.branchType !== undefined) {
      return {
        branch_match_kind: 'branching_model',
        branch_type: this.parseEnumOption(
          options.branchType,
          'branch-type',
          BRANCH_RESTRICTION_BRANCH_TYPES
        ),
        pattern: '',
      };
    }
    return {
      branch_match_kind: 'glob',
      pattern: this.requireOption(
        options.pattern,
        'pattern',
        'One of --pattern or --branch-type is required.'
      ),
    };
  }

  /** `--value` is a count (approvals, builds, commits behind); 0 is valid. */
  private parseValue(raw: string): number {
    const trimmed = raw.trim();
    if (!/^\d+$/.test(trimmed)) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message: this.appendHelpHint('--value must be a non-negative integer.'),
        context: { value: raw },
      });
    }
    return Number.parseInt(trimmed, 10);
  }

  /** Accept account IDs or `{uuid}`s; the rule body needs UUIDs. */
  private async resolveUsers(users: string[]): Promise<Account[]> {
    return Promise.all(
      users.map(async (selectedUser) => {
        const response = await this.usersApi.usersSelectedUserGet({
          selectedUser,
        });
        const uuid = response.data.uuid;
        if (!uuid) {
          throw new BBError({
            code: ErrorCode.API_REQUEST_FAILED,
            message: `Could not resolve a UUID for user ${selectedUser}.`,
          });
        }
        return { type: 'user', uuid };
      })
    );
  }
}
