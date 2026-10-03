import { describe, it, expect } from 'bun:test';
import { EditPRCommand } from '../../../src/commands/pr/edit.command.js';
import {
  createMockContextService,
  createMockOutputService,
  createMockGitService,
} from '../../setup.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('EditPRCommand', () => {
  it('should update PR title', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { id: '1', title: 'New Title' },
      { globalOptions: {} }
    );

    expect(pullrequestsApi.lastPutBody).toEqual({
      type: 'pullrequest',
      title: 'New Title',
    });
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Updated'))).toBe(true);
  });

  it('should update PR body', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { id: '1', body: 'New description' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should auto-detect PR from current branch', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({
      currentBranch: 'feature-branch',
    });
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
    await command.execute(
      { title: 'Updated via auto-detect' },
      { globalOptions: {} }
    );

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should fail when no changes provided', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.run({ id: '1' }, { globalOptions: {} })
    ).rejects.toThrow();
    expect(output.logs.some((log) => log.includes('At least one of'))).toBe(
      true
    );
  });

  it('should fail when PR not found', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.execute({ id: '999', title: 'New Title' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should fail when no repo context', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService();
    const gitService = createMockGitService();
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.execute({ id: '1', title: 'New Title' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should fail when auto-detect finds no matching PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const gitService = createMockGitService({ currentBranch: 'other-branch' });
    const output = createMockOutputService();

    const command = new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );

    await expect(
      command.run({ title: 'New Title' }, { globalOptions: {} })
    ).rejects.toThrow();
    expect(
      output.logs.some((log) => log.includes('No open pull request found'))
    ).toBe(true);
  });
});

describe('EditPRCommand --body-file', () => {
  class StdinEditPRCommand extends EditPRCommand {
    protected override async readStdin(): Promise<string> {
      return 'From stdin\n';
    }
  }

  const buildCommand = (pullrequestsApi = createMockPullrequestsApi()) => ({
    pullrequestsApi,
    command: new StdinEditPRCommand(
      pullrequestsApi,
      createMockContextService({ workspace: 'workspace', repoSlug: 'repo' }),
      createMockGitService(),
      createMockOutputService()
    ),
  });

  it('reads the description from stdin for -', async () => {
    const { command, pullrequestsApi } = buildCommand();
    await command.execute({ id: '1', bodyFile: '-' }, { globalOptions: {} });

    expect(pullrequestsApi.lastPutBody).toEqual({
      type: 'pullrequest',
      description: 'From stdin\n',
    });
  });

  it('keeps letting --body-file override --body', async () => {
    const { command, pullrequestsApi } = buildCommand();
    await command.execute(
      { id: '1', body: 'inline', bodyFile: '-' },
      { globalOptions: {} }
    );

    expect(pullrequestsApi.lastPutBody?.description).toBe('From stdin\n');
  });
});
