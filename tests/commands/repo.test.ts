/**
 * Repo command tests
 */

import { describe, it, expect } from 'bun:test';
import { ListReposCommand } from '../../src/commands/repo/list.command.js';
import { ViewRepoCommand } from '../../src/commands/repo/view.command.js';
import { CreateRepoCommand } from '../../src/commands/repo/create.command.js';
import { DeleteRepoCommand } from '../../src/commands/repo/delete.command.js';
import { CloneCommand } from '../../src/commands/repo/clone.command.js';
import {
  createMockContextService,
  createMockOutputService,
  createMockGitService,
  mockRepository,
} from '../setup.js';
import { BBError, ErrorCode } from '../../src/types/errors.js';
import type { RepositoriesApi } from '../../src/generated/api.js';

function extractPaginationParams(axiosOptions: unknown): {
  page: number;
  pagelen: number;
} {
  if (!axiosOptions || typeof axiosOptions !== 'object') {
    return { page: 1, pagelen: 25 };
  }

  const params = (axiosOptions as { params?: unknown }).params;
  if (!params || typeof params !== 'object') {
    return { page: 1, pagelen: 25 };
  }

  const pageValue = (params as { page?: unknown }).page;
  const pagelenValue = (params as { pagelen?: unknown }).pagelen;

  const page =
    typeof pageValue === 'number' && Number.isFinite(pageValue) && pageValue > 0
      ? pageValue
      : 1;
  const pagelen =
    typeof pagelenValue === 'number' &&
    Number.isFinite(pagelenValue) &&
    pagelenValue > 0
      ? pagelenValue
      : 25;

  return { page, pagelen };
}

function getTableRows(logs: string[]): string[][] {
  const rowsLog = logs.find((log) => log.startsWith('table-rows:'));
  if (!rowsLog) {
    return [];
  }

  return JSON.parse(rowsLog.substring('table-rows:'.length)) as string[][];
}

// Helper to create mock RepositoriesApi
function createMockRepositoriesApi(
  repos: (typeof mockRepository)[] = [mockRepository],
  options: {
    onListCall?: (request: unknown, axiosOptions?: unknown) => void;
  } = {}
): RepositoriesApi {
  return {
    repositoriesWorkspaceGet: async (
      request: unknown,
      axiosOptions?: unknown
    ) => {
      options.onListCall?.(request, axiosOptions);

      const { page, pagelen } = extractPaginationParams(axiosOptions);
      const start = (page - 1) * pagelen;
      const end = start + pagelen;
      const values = repos.slice(start, end);

      return {
        data: {
          values,
          page,
          pagelen,
          size: repos.length,
          next:
            end < repos.length
              ? `https://api.bitbucket.org/2.0/repositories/workspace?page=${page + 1}`
              : undefined,
        },
      };
    },
    repositoriesWorkspaceRepoSlugGet: async ({
      repoSlug,
    }: {
      repoSlug: string;
      workspace: string;
    }) => ({
      data:
        repos.find(
          (r) => r.slug === repoSlug || r.full_name?.endsWith(`/${repoSlug}`)
        ) || mockRepository,
    }),
    repositoriesWorkspaceRepoSlugPost: async () => ({
      data: mockRepository,
    }),
    repositoriesWorkspaceRepoSlugDelete: async () => ({
      data: undefined,
    }),
  } as unknown as RepositoriesApi;
}

describe('ListReposCommand', () => {
  it('should list repositories with explicit workspace', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new ListReposCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute({ workspace: 'workspace' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table:'))).toBe(true);
  });

  it('should use default workspace from config', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const output = createMockOutputService();

    const command = new ListReposCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table:'))).toBe(true);
  });

  it('should fail when no workspace specified and no default', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new ListReposCommand(
      repositoriesApi,
      contextService,
      output
    );

    await expect(command.execute({}, { globalOptions: {} })).rejects.toThrow();
  });

  it('should respect limit option', async () => {
    const repos = [
      { ...mockRepository, slug: 'repo1', full_name: 'workspace/repo1' },
      { ...mockRepository, slug: 'repo2', full_name: 'workspace/repo2' },
      { ...mockRepository, slug: 'repo3', full_name: 'workspace/repo3' },
    ];
    const repositoriesApi = createMockRepositoriesApi(repos);
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new ListReposCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute(
      { workspace: 'workspace', limit: '2' },
      { globalOptions: {} }
    );

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(2);
  });

  it('should paginate when limit exceeds first page size', async () => {
    const repos = Array.from({ length: 55 }, (_, index) => ({
      ...mockRepository,
      slug: `repo-${index + 1}`,
      full_name: `workspace/repo-${index + 1}`,
      name: `repo-${index + 1}`,
    }));
    const requestedPages: number[] = [];
    const repositoriesApi = createMockRepositoriesApi(repos, {
      onListCall: (_request, axiosOptions) => {
        requestedPages.push(extractPaginationParams(axiosOptions).page);
      },
    });
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new ListReposCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute(
      { workspace: 'workspace', limit: '55' },
      { globalOptions: {} }
    );

    const rows = getTableRows(output.logs);
    expect(rows).toHaveLength(55);
    expect(requestedPages).toEqual([1, 2]);
  });

  it('should show message when no repositories found', async () => {
    const repositoriesApi = createMockRepositoriesApi([]);
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new ListReposCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute({ workspace: 'empty' }, { globalOptions: {} });

    expect(output.logs).toContain('info:No repositories found');
  });

  it('should list repos when json flag is set', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new ListReposCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute(
      { workspace: 'workspace' },
      { globalOptions: { json: true } }
    );

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });
});

describe('ViewRepoCommand', () => {
  it('should view repository with explicit workspace/repo', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new ViewRepoCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute(
      { repository: 'workspace/repo' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('workspace/repo'))).toBe(
      true
    );
  });

  it('should use context when no repository specified', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewRepoCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('workspace/repo'))).toBe(
      true
    );
  });

  it('should fail when no context available', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new ViewRepoCommand(
      repositoriesApi,
      contextService,
      output
    );

    await expect(command.execute({}, { globalOptions: {} })).rejects.toThrow();
  });

  it('should view repo when json flag is set', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewRepoCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: { json: true } });

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });

  it('should display repository details', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewRepoCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute({}, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('workspace/repo'))).toBe(
      true
    );
  });
});

describe('CreateRepoCommand', () => {
  it('should create repository', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const output = createMockOutputService();

    const command = new CreateRepoCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute({ name: 'new-repo' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should throw when name is missing', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const output = createMockOutputService();

    const command = new CreateRepoCommand(
      repositoriesApi,
      contextService,
      output
    );

    try {
      await command.execute(
        { name: undefined as unknown as string },
        { globalOptions: {} }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_REQUIRED);
    }
  });

  it('should throw when name is empty string', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const output = createMockOutputService();

    const command = new CreateRepoCommand(
      repositoriesApi,
      contextService,
      output
    );

    try {
      await command.execute({ name: '' }, { globalOptions: {} });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(BBError);
      expect((error as BBError).code).toBe(ErrorCode.VALIDATION_REQUIRED);
    }
  });

  it('should fail when no workspace available', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new CreateRepoCommand(
      repositoriesApi,
      contextService,
      output
    );

    await expect(
      command.execute({ name: 'new-repo' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should use explicit workspace option', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new CreateRepoCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute(
      { name: 'new-repo', workspace: 'explicit-workspace' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should respect isPrivate option', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const output = createMockOutputService();

    const command = new CreateRepoCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute(
      { name: 'public-repo', public: true },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should create repo when json flag is set', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService({
      defaultWorkspace: 'workspace',
    });
    const output = createMockOutputService();

    const command = new CreateRepoCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute(
      { name: 'new-repo' },
      { globalOptions: { json: true } }
    );

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });
});

describe('DeleteRepoCommand', () => {
  it('should delete repository with yes flag', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new DeleteRepoCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute(
      { repository: 'workspace/repo', yes: true },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should fail without yes flag', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new DeleteRepoCommand(
      repositoriesApi,
      contextService,
      output
    );

    await expect(
      command.run({ repository: 'workspace/repo' }, { globalOptions: {} })
    ).rejects.toThrow();

    expect(output.logs.some((log) => log.includes('--yes'))).toBe(true);
  });

  it('should parse workspace/repo format', async () => {
    const repositoriesApi = createMockRepositoriesApi();
    const contextService = createMockContextService({
      workspace: 'myworkspace',
      repoSlug: 'myrepo',
    });
    const output = createMockOutputService();

    const command = new DeleteRepoCommand(
      repositoriesApi,
      contextService,
      output
    );
    await command.execute(
      { repository: 'myworkspace/myrepo', yes: true },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });
});

describe('CloneCommand', () => {
  it('should clone repository', async () => {
    const gitService = createMockGitService();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new CloneCommand(gitService, contextService, output);
    await command.execute(
      { repository: 'workspace/repo' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should use SSH by default', async () => {
    const gitService = createMockGitService();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new CloneCommand(gitService, contextService, output);
    await command.execute(
      { repository: 'workspace/repo' },
      { globalOptions: {} }
    );

    // Clone command outputs success message with repo name
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('workspace/repo'))).toBe(
      true
    );
  });

  it('should support custom destination', async () => {
    const gitService = createMockGitService();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new CloneCommand(gitService, contextService, output);
    await command.execute(
      { repository: 'workspace/repo', directory: '/tmp/my-clone' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('/tmp/my-clone'))).toBe(true);
  });

  it('should use default workspace when only repo name provided', async () => {
    const gitService = createMockGitService();
    const contextService = createMockContextService({
      defaultWorkspace: 'myworkspace',
    });
    const output = createMockOutputService();

    const command = new CloneCommand(gitService, contextService, output);
    await command.execute({ repository: 'myrepo' }, { globalOptions: {} });

    // Clone command outputs success message with repo name
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('myrepo'))).toBe(true);
  });

  it('should fail when no workspace available for single repo name', async () => {
    const gitService = createMockGitService();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new CloneCommand(gitService, contextService, output);

    await expect(
      command.execute({ repository: 'myrepo' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should run a spinner around the git clone call', async () => {
    const gitService = createMockGitService();
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new CloneCommand(gitService, contextService, output);
    await command.execute(
      { repository: 'workspace/repo' },
      { globalOptions: {} }
    );

    expect(
      output.logs.some((log) =>
        log.startsWith('spinner-start:Cloning workspace/repo')
      )
    ).toBe(true);
    expect(output.logs.some((log) => log === 'spinner-stop')).toBe(true);
  });

  it('should stop the spinner when the git clone call fails', async () => {
    const gitService = createMockGitService();
    gitService.clone = async () => {
      throw new Error('clone failed');
    };
    const contextService = createMockContextService();
    const output = createMockOutputService();

    const command = new CloneCommand(gitService, contextService, output);
    await expect(
      command.execute({ repository: 'workspace/repo' }, { globalOptions: {} })
    ).rejects.toThrow('clone failed');

    expect(
      output.logs.some((log) =>
        log.startsWith('spinner-start:Cloning workspace/repo')
      )
    ).toBe(true);
    expect(output.logs.some((log) => log === 'spinner-stop')).toBe(true);
  });
});
