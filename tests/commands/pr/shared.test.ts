import { describe, it, expect } from 'bun:test';
import { ActivityPRCommand } from '../../../src/commands/pr/activity.command.js';
import { ApprovePRCommand } from '../../../src/commands/pr/approve.command.js';
import { ChecksPRCommand } from '../../../src/commands/pr/checks.command.js';
import { ListCommentsPRCommand } from '../../../src/commands/pr/comments.list.command.js';
import { DeclinePRCommand } from '../../../src/commands/pr/decline.command.js';
import { MergePRCommand } from '../../../src/commands/pr/merge.command.js';
import { ReadyPRCommand } from '../../../src/commands/pr/ready.command.js';
import { findPullRequestIdForCurrentBranch } from '../../../src/commands/pr/shared.js';
import { ViewPRCommand } from '../../../src/commands/pr/view.command.js';
import type {
  CommitStatusesApi,
  Pullrequest,
} from '../../../src/generated/api.js';
import { BBError, ErrorCode } from '../../../src/types/errors.js';
import { axiosResponse, fakeApi } from '../../helpers/fake-api.js';
import {
  createMockContextService,
  createMockGitService,
  createMockOutputService,
  mockPullRequest,
} from '../../setup.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('findPullRequestIdForCurrentBranch', () => {
  const repoContext = { workspace: 'workspace', repoSlug: 'repo' };
  const contextService = createMockContextService(repoContext);
  const openPullRequest = (
    id: number,
    branch: string,
    sourceRepo = 'workspace/repo'
  ): Pullrequest =>
    ({
      ...mockPullRequest,
      id,
      source: {
        branch: { name: branch },
        repository: { full_name: sourceRepo },
      },
    }) as Pullrequest;

  it('returns the only open pull request for the branch, filtered server-side', async () => {
    const calls: Array<{ request: unknown; axiosOptions: unknown }> = [];
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [
        openPullRequest(7, 'other-branch'),
        openPullRequest(8, 'feature-branch'),
      ],
      onListCall: (request, axiosOptions) =>
        calls.push({ request, axiosOptions }),
    });

    const id = await findPullRequestIdForCurrentBranch(
      pullrequestsApi,
      createMockGitService({ currentBranch: 'feature-branch' }),
      contextService,
      repoContext
    );

    expect(id).toBe(8);
    expect(calls).toEqual([
      {
        request: { workspace: 'workspace', repoSlug: 'repo', state: 'OPEN' },
        axiosOptions: {
          params: { q: 'source.branch.name = "feature-branch"', pagelen: 50 },
        },
      },
    ]);
  });

  it('fails with a not-found error when the branch has no open pull request', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [openPullRequest(7, 'other-branch')],
    });

    const error = await findPullRequestIdForCurrentBranch(
      pullrequestsApi,
      createMockGitService({ currentBranch: 'feature-branch' }),
      contextService,
      repoContext
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BBError);
    expect((error as BBError).code).toBe(ErrorCode.API_NOT_FOUND);
    expect((error as BBError).message).toBe(
      'No open pull request found for branch "feature-branch". Pass a pull request ID.'
    );
  });

  it('refuses to guess when the branch has several open pull requests', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [
        openPullRequest(7, 'feature-branch'),
        openPullRequest(9, 'feature-branch'),
      ],
    });

    const error = await findPullRequestIdForCurrentBranch(
      pullrequestsApi,
      createMockGitService({ currentBranch: 'feature-branch' }),
      contextService,
      repoContext
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BBError);
    expect((error as BBError).code).toBe(ErrorCode.VALIDATION_REQUIRED);
    expect((error as BBError).message).toBe(
      'Branch "feature-branch" has 2 open pull requests (#7, #9). Pass a pull request ID.'
    );
  });

  it('ignores pull requests from another repository with the same branch name', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [
        openPullRequest(7, 'main', 'stranger/repo'),
        openPullRequest(8, 'main', 'Workspace/Repo'),
      ],
    });

    const id = await findPullRequestIdForCurrentBranch(
      pullrequestsApi,
      createMockGitService({ currentBranch: 'main' }),
      contextService,
      repoContext
    );

    expect(id).toBe(8);
  });

  it('matches the checkout repository when targeting upstream from a fork', async () => {
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [
        openPullRequest(7, 'feature-branch', 'upstream/repo'),
        openPullRequest(8, 'feature-branch', 'workspace/repo'),
      ],
    });

    const id = await findPullRequestIdForCurrentBranch(
      pullrequestsApi,
      createMockGitService({ currentBranch: 'feature-branch' }),
      contextService,
      { workspace: 'upstream', repoSlug: 'repo' }
    );

    expect(id).toBe(8);
  });

  it('escapes quotes and backslashes in the branch name', async () => {
    const queries: unknown[] = [];
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [openPullRequest(3, 'fix/"quoted"\\name')],
      onListCall: (_request, axiosOptions) =>
        queries.push((axiosOptions as { params: { q: string } }).params.q),
    });

    const id = await findPullRequestIdForCurrentBranch(
      pullrequestsApi,
      createMockGitService({ currentBranch: 'fix/"quoted"\\name' }),
      contextService,
      repoContext
    );

    expect(id).toBe(3);
    expect(queries).toEqual([
      'source.branch.name = "fix/\\"quoted\\"\\\\name"',
    ]);
  });

  it('asks for an ID on a detached HEAD without calling the API', async () => {
    let listCalls = 0;
    const pullrequestsApi = createMockPullrequestsApi({
      onListCall: () => listCalls++,
    });

    await expect(
      findPullRequestIdForCurrentBranch(
        pullrequestsApi,
        createMockGitService({ currentBranch: 'HEAD' }),
        contextService,
        repoContext
      )
    ).rejects.toThrow(
      'No pull request ID given and HEAD is detached. Pass a pull request ID.'
    );
    expect(listCalls).toBe(0);
  });

  it('asks for an ID when the current branch cannot be read', async () => {
    await expect(
      findPullRequestIdForCurrentBranch(
        createMockPullrequestsApi(),
        createMockGitService({ throwOnGetCurrentBranch: true }),
        contextService,
        repoContext
      )
    ).rejects.toThrow(
      'No pull request ID given and the current git branch could not be determined. Pass a pull request ID.'
    );
  });
});

describe('pr commands without an ID', () => {
  const setup = () => {
    const pullrequestsApi = createMockPullrequestsApi({
      pullRequests: [
        { ...mockPullRequest, id: 5, source: { branch: { name: 'other' } } },
        mockPullRequest,
      ] as Pullrequest[],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      currentBranch: 'feature-branch',
    });
    const output = createMockOutputService();
    return { pullrequestsApi, contextService, gitService, output };
  };

  it('view shows the pull request for the current branch', async () => {
    const { pullrequestsApi, contextService, gitService, output } = setup();
    await new ViewPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    ).execute({}, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('#1'))).toBe(true);
  });

  it('approve, decline, ready and merge act on the inferred pull request', async () => {
    const commands = [
      [ApprovePRCommand, 'Approved pull request #1'],
      [DeclinePRCommand, 'Declined pull request #1'],
      [ReadyPRCommand, 'Marked pull request #1 as ready for review'],
      [MergePRCommand, 'Merged pull request #1'],
    ] as const;

    for (const [Command, expected] of commands) {
      const { pullrequestsApi, contextService, gitService, output } = setup();
      await new Command(
        pullrequestsApi,
        contextService,
        gitService,
        output
      ).execute({}, { globalOptions: {} });

      expect(output.logs.join('\n')).toContain(expected);
    }
  });

  it('activity and comments list read the inferred pull request', async () => {
    const activityRequests: unknown[] = [];
    const commentRequests: unknown[] = [];
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      currentBranch: 'feature-branch',
    });
    const pullrequestsApi = createMockPullrequestsApi({
      onActivityCall: (request) => activityRequests.push(request),
      onCommentsListCall: (request) => commentRequests.push(request),
    });

    await new ActivityPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      createMockOutputService()
    ).execute({}, { globalOptions: {} });
    await new ListCommentsPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      createMockOutputService()
    ).execute({}, { globalOptions: {} });

    expect(activityRequests).toEqual([
      expect.objectContaining({ pullRequestId: 1 }),
    ]);
    expect(commentRequests).toEqual([
      expect.objectContaining({ pullRequestId: 1 }),
    ]);
  });

  it('checks reads statuses for the inferred pull request', async () => {
    const { pullrequestsApi, contextService, gitService, output } = setup();
    const statusRequests: unknown[] = [];
    const commitStatusesApi = fakeApi<CommitStatusesApi>({
      async repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet(
        request
      ) {
        statusRequests.push(request);
        return axiosResponse({ values: new Set([]) });
      },
    });

    await new ChecksPRCommand(
      commitStatusesApi,
      pullrequestsApi,
      contextService,
      gitService,
      output
    ).execute({}, { globalOptions: {} });

    expect(statusRequests).toEqual([
      expect.objectContaining({ pullRequestId: 1 }),
    ]);
  });

  it('rejects an empty ID instead of falling back to the current branch', async () => {
    const { contextService, gitService, output } = setup();
    let listCalls = 0;
    const api = createMockPullrequestsApi({ onListCall: () => listCalls++ });

    await expect(
      new MergePRCommand(api, contextService, gitService, output).execute(
        { id: '' },
        { globalOptions: {} }
      )
    ).rejects.toThrow(/<id> must be a positive integer/);
    expect(listCalls).toBe(0);
    expect(api.lastMergeBody).toBeUndefined();
  });

  it('does not touch git when an ID is given', async () => {
    const { pullrequestsApi, contextService, output } = setup();
    const gitService = createMockGitService({ throwOnGetCurrentBranch: true });

    await new ViewPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    ).execute({ id: '5' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('#5'))).toBe(true);
  });
});
