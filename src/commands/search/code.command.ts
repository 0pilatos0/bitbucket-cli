/**
 * Search code command implementation
 */

import { BaseCommand } from '../../core/base-command.js';
import type { CommandContext } from '../../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../../core/interfaces/services.js';
import type {
  SearchApi,
  SearchCodeSearchResult,
  SearchLine,
} from '../../generated/api.js';
import type { GlobalOptions } from '../../types/config.js';
import {
  BBError,
  ErrorCode,
  rethrowWithNotFoundContext,
} from '../../types/errors.js';

// The default response omits the repository of each matched file, which a
// workspace-wide search cannot do without.
const REPOSITORY_FIELDS = '+values.file.commit.repository';

const MATCH_TEXT_MAX_LENGTH = 60;

export interface SearchCodeOptions extends GlobalOptions {
  query: string[];
  limit?: string;
  all?: boolean;
}

export class SearchCodeCommand extends BaseCommand<SearchCodeOptions, void> {
  public readonly name = 'code';
  public readonly description = 'Search code in a workspace';

  constructor(
    private readonly searchApi: SearchApi,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: SearchCodeOptions,
    context: CommandContext
  ): Promise<void> {
    const terms = options.query.join(' ').trim();
    if (terms.length === 0) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: this.appendHelpHint('A search query is required.'),
      });
    }

    const repo = options.repo ?? context.globalOptions.repo;
    const searchQuery = repo ? `${terms} repo:${repo}` : terms;
    const workspace = await this.contextService.resolveWorkspaceFor(
      options,
      context
    );

    await this.runList<SearchCodeSearchResult>(
      {
        options,
        fetchPage: async (page, pagelen) => {
          const response = await this.searchApi
            .searchWorkspace(
              { workspace, searchQuery, page, pagelen },
              { params: { fields: REPOSITORY_FIELDS } }
            )
            .catch((error: unknown) =>
              rethrowWithNotFoundContext(
                error,
                `Code search is not available for workspace ${workspace}. Either the workspace does not exist, or code search is not enabled for it (turn it on at https://bitbucket.org/search).`
              )
            );
          return response.data;
        },
        wrapperKey: 'results',
        jsonMetadata: { workspace, query: searchQuery },
        emptyMessage: `No code matches for "${searchQuery}" in workspace ${workspace}`,
        tableHeaders: ['REPOSITORY', 'PATH', 'LINE', 'MATCH'],
        mapRow: (result) => {
          const line = firstMatchingLine(result);
          return [
            result.file?.commit?.repository?.full_name ?? '',
            result.file?.path ?? '',
            line?.line === undefined ? '' : String(line.line),
            line
              ? this.truncateText(
                  lineText(line),
                  MATCH_TEXT_MAX_LENGTH,
                  context.globalOptions
                )
              : '',
          ];
        },
        noun: 'results',
      },
      context
    );
  }
}

function firstMatchingLine(
  result: SearchCodeSearchResult
): SearchLine | undefined {
  for (const match of result.content_matches ?? []) {
    const line = match.lines?.find((candidate) =>
      candidate.segments?.some((segment) => segment.match)
    );
    if (line) {
      return line;
    }
  }
  return undefined;
}

function lineText(line: SearchLine): string {
  return (line.segments ?? [])
    .map((segment) => segment.text ?? '')
    .join('')
    .trim();
}
