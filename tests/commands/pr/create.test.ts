import { describe, it, expect } from 'bun:test';
import type { AxiosResponse } from 'axios';
import { CreatePRCommand } from '../../../src/commands/pr/create.command.js';
import type { IConfigService } from '../../../src/core/interfaces/services.js';
import type { Pullrequest } from '../../../src/generated/api.js';
import type {
  DefaultReviewerEntry,
  DefaultReviewerService,
} from '../../../src/services/default-reviewer.service.js';
import { fakeApi, fakeUsersApi } from '../../helpers/fake-api.js';
import {
  createMockConfigService,
  createMockContextService,
  createMockGitService,
  createMockOutputService,
  createMockPromptService,
  mockUser,
} from '../../setup.js';
import { createMockPullrequestsApi } from './fakes.js';

function createMockDefaultReviewerService(
  entries: DefaultReviewerEntry[] = [],
  throwOnList = false
): DefaultReviewerService {
  const svc = {
    async list() {
      if (throwOnList) {
        throw new Error('effective reviewers fetch failed');
      }
      return entries;
    },
    async add() {
      return entries[0] ?? { uuid: '{}' };
    },
    async remove() {
      // not used
    },
  };
  return fakeApi<DefaultReviewerService>(svc);
}

interface CreatePRHarnessOptions {
  currentBranch?: string;
  defaultReviewers?: DefaultReviewerEntry[];
  defaultReviewersThrow?: boolean;
  authorUuid?: string;
  config?: Parameters<typeof createMockConfigService>[0];
  capturedBodyRef?: { body?: Pullrequest };
  createPRThrows?: boolean;
}

function buildCreatePRCommand(options: CreatePRHarnessOptions = {}): {
  command: CreatePRCommand;
  output: ReturnType<typeof createMockOutputService>;
  captured: { body?: Pullrequest };
} {
  const captured: {
    body?: Pullrequest;
  } = options.capturedBodyRef ?? {};

  const basePullrequestsApi = createMockPullrequestsApi();
  // Wrap POST so we can inspect the body on assertions.
  const originalPost =
    basePullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPost.bind(
      basePullrequestsApi
    );
  const pullrequestsApi = basePullrequestsApi as typeof basePullrequestsApi & {
    repositoriesWorkspaceRepoSlugPullrequestsPost: (params: {
      workspace: string;
      repoSlug: string;
      body: Pullrequest;
    }) => Promise<AxiosResponse<Pullrequest>>;
  };
  pullrequestsApi.repositoriesWorkspaceRepoSlugPullrequestsPost = async (
    params
  ) => {
    captured.body = params.body;
    if (options.createPRThrows) {
      throw new Error('PR creation failed');
    }
    return originalPost(params);
  };

  const authorUuid = options.authorUuid ?? '{author-uuid}';
  const usersApi = fakeUsersApi({
    currentUser: { ...mockUser, uuid: authorUuid },
  });

  const contextService = createMockContextService({
    workspace: 'workspace',
    repoSlug: 'repo',
  });

  const gitService = createMockGitService({
    currentBranch: options.currentBranch ?? 'feature-branch',
  });

  const defaultReviewerService = createMockDefaultReviewerService(
    options.defaultReviewers,
    options.defaultReviewersThrow
  );

  const configService: IConfigService = createMockConfigService(
    options.config ?? {}
  );

  const output = createMockOutputService();

  const command = new CreatePRCommand(
    pullrequestsApi,
    usersApi,
    contextService,
    gitService,
    defaultReviewerService,
    configService,
    output
  );

  return { command, output, captured };
}

describe('CreatePRCommand', () => {
  it('should create pull request with title', async () => {
    const { command, output } = buildCreatePRCommand();
    await command.execute({ title: 'My PR' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
    expect(
      output.logs.some((log) => log.includes('Created pull request'))
    ).toBe(true);
  });

  it('should fail when title not provided', async () => {
    const { command, output } = buildCreatePRCommand();
    await expect(command.run({}, { globalOptions: {} })).rejects.toThrow();
    expect(output.logs.some((log) => log.includes('title'))).toBe(true);
  });

  describe('interactive prompts', () => {
    it('asks for the title and description when --title is missing', async () => {
      const prompt = createMockPromptService([
        'Prompted title',
        'Prompted body',
      ]);
      const { command, captured } = buildCreatePRCommand();

      await command.execute({}, { globalOptions: {}, prompt });

      expect(prompt.calls).toEqual([
        'text:Title',
        'text:Description (optional)',
      ]);
      expect(captured.body?.title).toBe('Prompted title');
      expect(captured.body?.description).toBe('Prompted body');
    });

    it('omits the description when the prompt is left empty', async () => {
      const prompt = createMockPromptService(['Prompted title', '']);
      const { command, captured } = buildCreatePRCommand();

      await command.execute({}, { globalOptions: {}, prompt });

      expect(captured.body?.title).toBe('Prompted title');
      expect(captured.body?.description).toBeUndefined();
    });

    it('keeps an explicit --body and only asks for the title', async () => {
      const prompt = createMockPromptService(['Prompted title']);
      const { command, captured } = buildCreatePRCommand();

      await command.execute(
        { body: 'Flag body' },
        { globalOptions: {}, prompt }
      );

      expect(prompt.calls).toEqual(['text:Title']);
      expect(captured.body?.description).toBe('Flag body');
    });

    it('does not prompt when --title is given', async () => {
      const prompt = createMockPromptService();
      const { command, captured } = buildCreatePRCommand();

      await command.execute(
        { title: 'Flag title' },
        { globalOptions: {}, prompt }
      );

      expect(prompt.calls).toEqual([]);
      expect(captured.body?.title).toBe('Flag title');
      expect(captured.body?.description).toBeUndefined();
    });
  });

  it('should use current branch as source', async () => {
    const { command, output } = buildCreatePRCommand({
      currentBranch: 'my-feature',
    });
    await command.execute({ title: 'My PR' }, { globalOptions: {} });
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should use explicit source branch', async () => {
    const { command, output } = buildCreatePRCommand();
    await command.execute(
      { title: 'My PR', source: 'explicit-branch' },
      { globalOptions: {} }
    );
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should use main as default destination', async () => {
    const { command, output } = buildCreatePRCommand({
      currentBranch: 'feature',
    });
    await command.execute({ title: 'My PR' }, { globalOptions: {} });
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should use explicit destination branch', async () => {
    const { command, output } = buildCreatePRCommand({
      currentBranch: 'feature',
    });
    await command.execute(
      { title: 'My PR', destination: 'develop' },
      { globalOptions: {} }
    );
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should create draft pull request when flag is set', async () => {
    const { command, output } = buildCreatePRCommand({
      currentBranch: 'feature',
    });
    await command.execute(
      { title: 'Draft PR', draft: true },
      { globalOptions: {} }
    );
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should output json when requested', async () => {
    const { command, output } = buildCreatePRCommand();
    await command.execute(
      { title: 'My PR' },
      { globalOptions: { json: true } }
    );
    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });

  it('should not include reviewers by default', async () => {
    const { command, captured } = buildCreatePRCommand({
      defaultReviewers: [
        { uuid: '{r1}', displayName: 'R One' },
        { uuid: '{r2}', displayName: 'R Two' },
      ],
    });
    await command.execute({ title: 'My PR' }, { globalOptions: {} });
    expect(captured.body?.reviewers).toBeUndefined();
  });

  it('should include default reviewers when --default-reviewers is set', async () => {
    const { command, captured, output } = buildCreatePRCommand({
      defaultReviewers: [
        { uuid: '{r1}', displayName: 'R One' },
        { uuid: '{r2}', displayName: 'R Two' },
      ],
      authorUuid: '{author-uuid}',
    });
    await command.execute(
      { title: 'My PR', defaultReviewers: true },
      { globalOptions: {} }
    );
    const uuids = Array.from(captured.body?.reviewers ?? []).map((r) => r.uuid);
    expect(uuids).toEqual(['{r1}', '{r2}']);
    expect(output.logs.some((log) => log.includes('Reviewers:'))).toBe(true);
  });

  it('should include explicit --reviewer values and dedupe with defaults', async () => {
    const { command, captured } = buildCreatePRCommand({
      defaultReviewers: [{ uuid: '{r1}', displayName: 'R One' }],
      authorUuid: '{author-uuid}',
    });
    await command.execute(
      {
        title: 'My PR',
        defaultReviewers: true,
        reviewer: ['r1', 'r3'],
      },
      { globalOptions: {} }
    );
    const uuids = Array.from(captured.body?.reviewers ?? []).map((r) => r.uuid);
    // Default {r1} + explicit {r1-uuid} + explicit {r3-uuid}, de-duped
    expect(uuids).toContain('{r1}');
    expect(uuids).toContain('{r1-uuid}');
    expect(uuids).toContain('{r3-uuid}');
  });

  it('should filter out the author from the reviewer list', async () => {
    const { command, captured } = buildCreatePRCommand({
      defaultReviewers: [
        { uuid: '{author-uuid}', displayName: 'Me' },
        { uuid: '{r1}', displayName: 'R One' },
      ],
      authorUuid: '{author-uuid}',
    });
    await command.execute(
      { title: 'My PR', defaultReviewers: true },
      { globalOptions: {} }
    );
    const uuids = Array.from(captured.body?.reviewers ?? []).map((r) => r.uuid);
    expect(uuids).toEqual(['{r1}']);
  });

  it('should respect --no-default-reviewers even when config enables it', async () => {
    const { command, captured } = buildCreatePRCommand({
      defaultReviewers: [{ uuid: '{r1}', displayName: 'R One' }],
      config: { prCreateIncludeDefaultReviewers: true },
    });
    await command.execute(
      { title: 'My PR', defaultReviewers: false },
      { globalOptions: {} }
    );
    expect(captured.body?.reviewers).toBeUndefined();
  });

  it('should include defaults when config enables it and no flag is passed', async () => {
    const { command, captured } = buildCreatePRCommand({
      defaultReviewers: [{ uuid: '{r1}', displayName: 'R One' }],
      config: { prCreateIncludeDefaultReviewers: true },
      authorUuid: '{author-uuid}',
    });
    await command.execute({ title: 'My PR' }, { globalOptions: {} });
    const uuids = Array.from(captured.body?.reviewers ?? []).map((r) => r.uuid);
    expect(uuids).toEqual(['{r1}']);
  });

  it('should warn and continue when the default-reviewer fetch fails', async () => {
    const { command, captured, output } = buildCreatePRCommand({
      defaultReviewersThrow: true,
    });
    await command.execute(
      { title: 'My PR', defaultReviewers: true },
      { globalOptions: {} }
    );
    expect(captured.body?.reviewers).toBeUndefined();
    expect(
      output.logs.some(
        (log) => log.startsWith('warning:') && log.includes('default reviewers')
      )
    ).toBe(true);
    expect(output.logs.some((log) => log.includes('success:'))).toBe(true);
  });

  it('should run a spinner for the duration of the API call', async () => {
    const { command, output } = buildCreatePRCommand();
    await command.execute({ title: 'My PR' }, { globalOptions: {} });

    const startIdx = output.logs.findIndex((log) =>
      log.startsWith('spinner-start:Creating pull request')
    );
    const stopIdx = output.logs.findIndex((log) => log === 'spinner-stop');
    const successIdx = output.logs.findIndex((log) =>
      log.startsWith('success:')
    );

    expect(startIdx).toBeGreaterThanOrEqual(0);
    expect(stopIdx).toBeGreaterThan(startIdx);
    expect(successIdx).toBeGreaterThan(stopIdx);
  });

  it('should stop the spinner even when the API call fails', async () => {
    const { command, output } = buildCreatePRCommand({
      createPRThrows: true,
    });

    await expect(
      command.execute({ title: 'My PR' }, { globalOptions: {} })
    ).rejects.toThrow();

    expect(output.logs.some((log) => log.startsWith('spinner-start:'))).toBe(
      true
    );
    expect(output.logs.some((log) => log === 'spinner-stop')).toBe(true);
  });
});
