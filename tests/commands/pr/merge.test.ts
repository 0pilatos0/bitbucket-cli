import { describe, it, expect } from 'bun:test';
import { MergePRCommand } from '../../../src/commands/pr/merge.command.js';
import {
  createMockContextService,
  createMockOutputService,
} from '../../setup.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('MergePRCommand', () => {
  it('should merge pull request', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new MergePRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(pullrequestsApi.lastMergeBody).toEqual({
      type: 'pullrequest_merge_parameters',
    });
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Merged'))).toBe(true);
  });

  it('should fail for non-existent PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new MergePRCommand(pullrequestsApi, contextService, output);

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should reject an invalid --strategy value', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new MergePRCommand(pullrequestsApi, contextService, output);

    await expect(
      command.execute({ id: '1', strategy: 'bogus' }, { globalOptions: {} })
    ).rejects.toThrow(/--strategy must be one of/);
  });

  it('should accept a valid --strategy value', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new MergePRCommand(pullrequestsApi, contextService, output);
    await command.execute(
      {
        id: '1',
        strategy: 'squash',
        message: 'Merging now',
        closeSourceBranch: true,
      },
      { globalOptions: {} }
    );

    expect(pullrequestsApi.lastMergeBody).toEqual({
      type: 'pullrequest_merge_parameters',
      message: 'Merging now',
      close_source_branch: true,
      merge_strategy: 'squash',
    });
    expect(output.logs.some((log) => log.includes('Merged'))).toBe(true);
  });

  it('should reject a non-integer --id', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new MergePRCommand(pullrequestsApi, contextService, output);

    await expect(
      command.execute({ id: 'abc' }, { globalOptions: {} })
    ).rejects.toThrow(/--id must be a positive integer/);
  });

  it('should run a spinner labeled with the PR id', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new MergePRCommand(pullrequestsApi, contextService, output);
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.startsWith('spinner-start:Merging pull request #1')
      )
    ).toBe(true);
    expect(output.logs.some((log) => log === 'spinner-stop')).toBe(true);
  });
});
