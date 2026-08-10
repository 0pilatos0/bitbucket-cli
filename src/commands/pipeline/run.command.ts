/**
 * Run pipeline command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IGitService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  Pipeline,
  PipelineTarget,
  PipelineVariable,
  PipelinesApi,
} from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import { BBError, ErrorCode } from '../../types/errors.js';

export interface RunPipelineOptions extends GlobalOptions {
  branch?: string;
  commit?: string;
  pipeline?: string;
  var?: string[];
}

export class RunPipelineCommand extends BaseCommand<RunPipelineOptions, void> {
  public readonly name = 'run';
  public readonly description = 'Trigger a pipeline run';

  constructor(
    private readonly pipelinesApi: PipelinesApi,
    private readonly contextService: IContextService,
    private readonly gitService: IGitService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: RunPipelineOptions,
    context: CommandContext
  ): Promise<void> {
    const repoContext = await this.contextService.requireRepoContextFor(
      options,
      context
    );

    const branch = options.branch ?? (await this.resolveCurrentBranch());
    const variables = this.parseVariables(options.var);

    // `PipelineTarget` is an empty marker interface in the generated client
    // (the spec models ref/commit targets as subtypes), so the literal is
    // built to the documented `pipeline_ref_target` shape and cast.
    const target = {
      type: 'pipeline_ref_target',
      ref_type: 'branch',
      ref_name: branch,
      ...(options.commit
        ? { commit: { type: 'commit', hash: options.commit } }
        : {}),
      ...(options.pipeline
        ? { selector: { type: 'custom', pattern: options.pipeline } }
        : {}),
    } as unknown as PipelineTarget;

    const pipeline: Pipeline = {
      type: 'pipeline',
      target,
      ...(variables.length > 0 ? { variables } : {}),
    };

    const response = await this.pipelinesApi.createPipelineForRepository({
      workspace: repoContext.workspace,
      repoSlug: repoContext.repoSlug,
      body: pipeline,
    });

    const created = response.data;

    if (context.globalOptions.json) {
      // Same context envelope as the other pipeline subcommands, so scripts
      // read the pipeline from `.pipeline` after both `run` and `view`.
      await this.output.json({
        workspace: repoContext.workspace,
        repoSlug: repoContext.repoSlug,
        pipeline: created,
      });
      return;
    }

    const buildNumber = created.build_number;
    this.output.success(
      `Pipeline #${buildNumber ?? '?'} started on branch ${branch}` +
        (options.pipeline ? ` (custom pipeline: ${options.pipeline})` : '')
    );
    if (buildNumber !== undefined) {
      this.output.text(
        this.output.dim(
          `View it with: bb pipeline view ${buildNumber}` +
            ` | Logs: bb pipeline logs ${buildNumber}`
        )
      );
    }
  }

  private async resolveCurrentBranch(): Promise<string> {
    try {
      return await this.gitService.getCurrentBranch();
    } catch {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: this.appendHelpHint(
          'Could not determine the current git branch (not inside a git repository?). Pass --branch <branch> to choose the ref to run the pipeline on.'
        ),
      });
    }
  }

  /**
   * Parse repeated `--var key=value` flags into Bitbucket pipeline variables.
   * The value may itself contain `=`; only the first one splits.
   */
  private parseVariables(vars: string[] | undefined): PipelineVariable[] {
    if (!vars || vars.length === 0) {
      return [];
    }

    return vars.map((entry) => {
      const separator = entry.indexOf('=');
      if (separator <= 0) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message: this.appendHelpHint(
            `--var must be in key=value format (got '${entry}').`
          ),
          context: { var: entry },
        });
      }
      return {
        type: 'pipeline_variable',
        key: entry.slice(0, separator),
        value: entry.slice(separator + 1),
        secured: false,
      };
    });
  }
}
