/**
 * View branch restriction command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  BranchRestrictionsApi,
  Branchrestriction,
} from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { rethrowWithNotFoundContext } from '../../types/errors.js';
import { describeBranchMatch } from './shared.js';

export interface ViewBranchRestrictionOptions extends GlobalOptions {
  id: string;
}

export class ViewBranchRestrictionCommand extends BaseCommand<
  ViewBranchRestrictionOptions,
  void
> {
  public readonly name = 'view';
  public readonly description = 'View a branch restriction rule';

  constructor(
    private readonly branchRestrictionsApi: BranchRestrictionsApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ViewBranchRestrictionOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );
    const id = this.parsePositiveInt(options.id, 'id');

    const response = await this.branchRestrictionsApi
      .repositoriesWorkspaceRepoSlugBranchRestrictionsIdGet({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        id: String(id),
      })
      .catch((error: unknown) =>
        rethrowWithNotFoundContext(
          error,
          `Branch restriction ${id} not found in ${repoContext.workspace}/${repoContext.repoSlug}.`
        )
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

    this.render(branchRestriction);
  }

  private render(restriction: Branchrestriction): void {
    this.output.text('');
    this.output.text(
      `${this.output.bold(`#${restriction.id ?? '?'}`)}  ${restriction.kind}`
    );
    this.output.separator();
    this.output.text(`Branch:      ${describeBranchMatch(restriction)}`);
    if (restriction.value !== undefined && restriction.value !== null) {
      this.output.text(`Value:       ${restriction.value}`);
    }

    const users = restriction.users ?? [];
    const groups = restriction.groups ?? [];
    if (users.length > 0 || groups.length > 0) {
      this.output.text('');
      this.output.text(this.output.bold('Exempt'));
      for (const user of users) {
        this.output.text(`  user   ${user.display_name ?? user.uuid ?? '?'}`);
      }
      for (const group of groups) {
        this.output.text(`  group  ${group.name ?? group.slug ?? '?'}`);
      }
    }
    this.output.text('');
  }
}
