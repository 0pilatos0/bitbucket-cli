import { describe, it, expect } from 'bun:test';
import { ViewPRCommand } from '../../../src/commands/pr/view.command.js';
import {
  createMockContextService,
  createMockGitService,
  createMockOutputService,
  mockPullRequest,
  mockUser,
} from '../../setup.js';
import type { Pullrequest } from '../../../src/generated/api.js';
import { createMockPullrequestsApi } from './fakes.js';

describe('ViewPRCommand', () => {
  it('should view pull request by ID', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('#1'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Test PR'))).toBe(true);
  });

  it('should fail for non-existent PR', async () => {
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );

    await expect(
      command.execute({ id: '999' }, { globalOptions: {} })
    ).rejects.toThrow();
  });

  it('should show draft indicator when PR is draft', async () => {
    const prs = [{ ...mockPullRequest, draft: true }];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('[DRAFT]'))).toBe(true);
  });

  it('should output json when requested', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: { json: true } });

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });

  it('should reject a non-integer --id', async () => {
    const pullrequestsApi = createMockPullrequestsApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );

    await expect(
      command.execute({ id: 'abc' }, { globalOptions: {} })
    ).rejects.toThrow(/--id must be a positive integer/);
  });

  it('should render "No reviewers assigned" when there are no reviewer participants', async () => {
    const prs = [{ ...mockPullRequest, participants: [] } as Pullrequest];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs).toContain('info:No reviewers assigned');
  });

  it('should render approved, changes requested, and pending reviewer statuses', async () => {
    const prs = [
      {
        ...mockPullRequest,
        participants: [
          {
            role: 'REVIEWER',
            approved: true,
            user: { display_name: 'Alice Approver' },
          },
          {
            role: 'REVIEWER',
            approved: false,
            state: 'changes_requested',
            user: { display_name: 'Bob Blocker' },
          },
          {
            role: 'REVIEWER',
            approved: false,
            user: { display_name: 'Carol Pending' },
          },
          // Non-reviewer participant should be filtered out.
          {
            role: 'PARTICIPANT',
            approved: false,
            user: { display_name: 'Dan Drive-by' },
          },
        ],
      } as unknown as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    const joined = output.logs.join('\n');
    expect(joined).toContain('Alice Approver');
    expect(joined).toContain('approved');
    expect(joined).toContain('Bob Blocker');
    expect(joined).toContain('changes requested');
    expect(joined).toContain('Carol Pending');
    expect(joined).toContain('pending');
    expect(joined).not.toContain('Dan Drive-by');
  });

  it('should fall back to ASCII separators, arrows, and reviewer icons under noUnicode', async () => {
    const prs = [
      {
        ...mockPullRequest,
        participants: [
          {
            role: 'REVIEWER',
            approved: true,
            user: { display_name: 'Alice Approver' },
          },
          {
            role: 'REVIEWER',
            approved: false,
            state: 'changes_requested',
            user: { display_name: 'Bob Blocker' },
          },
          {
            role: 'REVIEWER',
            approved: false,
            user: { display_name: 'Carol Pending' },
          },
        ],
      } as unknown as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService({ noUnicode: true });

    const command = new ViewPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    const joined = output.logs.join('\n');
    // No unicode glyphs.
    expect(joined).not.toContain('─');
    expect(joined).not.toContain('→');
    expect(joined).not.toContain('○');
    expect(joined).not.toContain('✓');
    expect(joined).not.toContain('✗');
    // ASCII fallbacks come through.
    expect(joined).toContain('->');
    expect(joined).toContain('[OK]'); // approved
    expect(joined).toContain('[X]'); // changes requested
    expect(joined).toContain('[ ]'); // pending
  });

  it('should render merge commit hash when PR is merged', async () => {
    const prs = [
      {
        ...mockPullRequest,
        state: 'MERGED' as const,
        merge_commit: { hash: '1234567abcdef' },
        closed_by: { ...mockUser, display_name: 'Mergebot' },
      } as unknown as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    const joined = output.logs.join('\n');
    expect(joined).toContain('1234567');
    expect(joined).toContain('Merged:');
    expect(joined).toContain('Mergebot');
  });

  it('should render "Closed" label when state is DECLINED and closed_by is present', async () => {
    const prs = [
      {
        ...mockPullRequest,
        state: 'DECLINED' as const,
        closed_by: { ...mockUser, display_name: 'Decliner' },
      } as unknown as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    const joined = output.logs.join('\n');
    expect(joined).toContain('Closed:');
    expect(joined).toContain('Decliner');
  });

  it('should show "unknown" placeholder when branch info is missing', async () => {
    const prs = [
      {
        ...mockPullRequest,
        source: {} as unknown as typeof mockPullRequest.source,
        destination: {} as unknown as typeof mockPullRequest.destination,
      } as Pullrequest,
    ];
    const pullrequestsApi = createMockPullrequestsApi({ pullRequests: prs });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ViewPRCommand(
      pullrequestsApi,
      contextService,
      createMockGitService(),
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    const joined = output.logs.join('\n');
    expect(joined).toContain('Branch:');
    expect(joined).toContain('unknown');
  });
});
