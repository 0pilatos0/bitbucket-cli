import { describe, it, expect } from 'bun:test';
import { ChecksPRCommand } from '../../../src/commands/pr/checks.command.js';
import {
  createMockContextService,
  createMockOutputService,
} from '../../setup.js';
import { getTableRows } from '../../helpers/output-logs.js';
import { createMockCommitStatusesApi } from './fakes.js';

describe('ChecksPRCommand', () => {
  it('should list check statuses for a pull request', async () => {
    const commitStatusesApi = createMockCommitStatusesApi({
      statuses: [
        {
          type: 'commit_status',
          key: 'build',
          name: 'Build',
          state: 'SUCCESSFUL',
          description: 'All checks passed',
          updated_on: '2024-01-01T00:00:00.000Z',
        },
        {
          type: 'commit_status',
          key: 'tests',
          name: 'Tests',
          state: 'FAILED',
          description: 'Tests failed',
          updated_on: '2024-01-01T01:00:00.000Z',
        },
      ],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ChecksPRCommand(
      commitStatusesApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('table:'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Build'))).toBe(true);
    expect(output.logs.some((log) => log.includes('Tests'))).toBe(true);
  });

  it('should output json when requested', async () => {
    const commitStatusesApi = createMockCommitStatusesApi();
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ChecksPRCommand(
      commitStatusesApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: { json: true } });

    expect(output.logs.some((log) => log.startsWith('json:'))).toBe(true);
  });

  it('should show info when no checks exist', async () => {
    const commitStatusesApi = createMockCommitStatusesApi({ statuses: [] });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ChecksPRCommand(
      commitStatusesApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    expect(
      output.logs.some((log) =>
        log.includes('No CI/CD checks found for this pull request')
      )
    ).toBe(true);
  });

  it('should truncate long check descriptions by default', async () => {
    const longDescription = 'C'.repeat(80);
    const commitStatusesApi = createMockCommitStatusesApi({
      statuses: [
        {
          type: 'commit_status',
          key: 'build',
          name: 'Build',
          state: 'SUCCESSFUL',
          description: longDescription,
          updated_on: '2024-01-01T00:00:00.000Z',
        },
      ],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ChecksPRCommand(
      commitStatusesApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: {} });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[2]).toBe('C'.repeat(37) + '...');
  });

  it('should show full check descriptions when noTruncate is set', async () => {
    const longDescription = 'C'.repeat(80);
    const commitStatusesApi = createMockCommitStatusesApi({
      statuses: [
        {
          type: 'commit_status',
          key: 'build',
          name: 'Build',
          state: 'SUCCESSFUL',
          description: longDescription,
          updated_on: '2024-01-01T00:00:00.000Z',
        },
      ],
    });
    const contextService = createMockContextService({
      workspace: 'workspace',
      repoSlug: 'repo',
    });
    const output = createMockOutputService();

    const command = new ChecksPRCommand(
      commitStatusesApi,
      contextService,
      output
    );
    await command.execute({ id: '1' }, { globalOptions: { noTruncate: true } });

    const rows = getTableRows(output.logs);
    expect(rows[0]?.[2]).toBe(longDescription);
  });
});
