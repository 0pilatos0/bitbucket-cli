/**
 * `bb pr checkout` against real git repositories.
 *
 * Remotes carry real `git@bitbucket.org:` URLs; a fake `ssh` program serves
 * them from local bare repositories, so the command matches remotes exactly
 * as it would against Bitbucket.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CheckoutPRCommand } from '../../src/commands/pr/checkout.command.js';
import type { PullrequestsApi } from '../../src/generated/api.js';
import { ContextService } from '../../src/services/context.service.js';
import { GitService } from '../../src/services/git.service.js';
import { createMockConfigService, createMockOutputService } from '../setup.js';

let root: string;
let env: Record<string, string>;

async function git(args: string[], cwd: string): Promise<string> {
  const proc = Bun.spawn(['git', ...args], {
    cwd,
    env,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const stdout = await new Response(proc.stdout).text();
  const exited = await proc.exited;
  if (exited !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`git ${args.join(' ')} failed (${exited}): ${stderr}`);
  }
  return stdout.trim();
}

async function commit(cwd: string, file: string, content: string) {
  await writeFile(join(cwd, file), content);
  await git(['add', file], cwd);
  await git(['commit', '-m', `edit ${file}`], cwd);
  return git(['rev-parse', 'HEAD'], cwd);
}

/** A bare repo served as `git@bitbucket.org:<fullName>.git`. */
async function createBitbucketRepo(fullName: string): Promise<string> {
  const bare = join(root, `${fullName}.git`);
  await git(['init', '--bare', bare], root);
  return bare;
}

/** Push a `feature` branch with one commit on top of main to `bare`. */
async function pushFeature(seed: string, bare: string): Promise<string> {
  await git(['checkout', '-B', 'feature', 'main'], seed);
  const sha = await commit(seed, 'feature.txt', `feature for ${bare}`);
  await git(['push', '--force', bare, 'feature'], seed);
  await git(['checkout', 'main'], seed);
  return sha;
}

function makeCommand(sourceRepo: string | null, cwd: string) {
  const pr = {
    id: 7,
    title: 'Add feature',
    source: {
      branch: { name: 'feature' },
      repository: sourceRepo === null ? null : { full_name: sourceRepo },
    },
  };
  const pullrequestsApi = {
    repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet: async () => ({
      data: pr,
    }),
  } as unknown as PullrequestsApi;
  const gitService = new GitService(cwd, { env });
  const contextService = new ContextService(
    gitService,
    createMockConfigService()
  );
  const output = createMockOutputService();
  const command = new CheckoutPRCommand(
    pullrequestsApi,
    contextService,
    gitService,
    createMockConfigService(),
    output
  );
  return { command, output };
}

const globalOptions = { workspace: 'team', repo: 'app' };

describe('CheckoutPRCommand with real git', () => {
  let seed: string;
  let upstream: string;
  let clone: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'bb-checkout-'));
    const fakeSsh = join(root, 'fake-ssh');
    // git runs `<ssh> git@bitbucket.org "git-upload-pack 'team/app.git'"`.
    await writeFile(
      fakeSsh,
      `#!/bin/sh\nfor command; do :; done\ncd '${root}' && eval "$command"\n`
    );
    await chmod(fakeSsh, 0o755);
    env = {
      GIT_SSH_COMMAND: fakeSsh,
      GIT_SSH_VARIANT: 'simple',
      PATH: process.env.PATH ?? '',
      HOME: root,
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: join(root, '.gitconfig'),
      GIT_AUTHOR_NAME: 'Test',
      GIT_AUTHOR_EMAIL: 'test@test.com',
      GIT_COMMITTER_NAME: 'Test',
      GIT_COMMITTER_EMAIL: 'test@test.com',
      GIT_TERMINAL_PROMPT: '0',
    };
    await writeFile(env.GIT_CONFIG_GLOBAL!, '[init]\n\tdefaultBranch = main\n');

    upstream = await createBitbucketRepo('team/app');
    seed = join(root, 'seed');
    await git(['init', seed], root);
    await commit(seed, 'README.md', 'hello');
    await git(['push', upstream, 'main'], seed);

    clone = join(root, 'clone');
    await git(['clone', 'git@bitbucket.org:team/app.git', clone], root);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('creates a tracking branch from the detected remote', async () => {
    const sha = await pushFeature(seed, upstream);
    await git(['remote', 'rename', 'origin', 'bitbucket'], clone);

    const { command, output } = makeCommand('team/app', clone);
    await command.execute({ id: '7', ...globalOptions }, { globalOptions });

    expect(await git(['rev-parse', '--abbrev-ref', 'HEAD'], clone)).toBe(
      'feature'
    );
    expect(await git(['rev-parse', 'HEAD'], clone)).toBe(sha);
    expect(
      await git(['rev-parse', '--abbrev-ref', 'feature@{upstream}'], clone)
    ).toBe('bitbucket/feature');
    expect(output.logs).toContain("success:Checked out PR #7 as 'feature'");
  });

  it('fast-forwards an existing local branch', async () => {
    await pushFeature(seed, upstream);
    await git(['fetch', 'origin'], clone);
    await git(['branch', 'feature', 'origin/feature'], clone);
    await git(['checkout', 'feature'], seed);
    const latest = await commit(seed, 'more.txt', 'more');
    await git(['push', upstream, 'feature'], seed);

    const { command } = makeCommand('team/app', clone);
    await command.execute({ id: '7', ...globalOptions }, { globalOptions });

    expect(await git(['rev-parse', 'feature'], clone)).toBe(latest);
  });

  it('refuses to move a local branch that has diverged', async () => {
    await pushFeature(seed, upstream);
    await git(['fetch', 'origin'], clone);
    await git(['checkout', '-b', 'feature', 'origin/feature'], clone);
    const local = await commit(clone, 'local.txt', 'local work');
    await git(['checkout', 'main'], clone);
    await git(['checkout', '-B', 'feature', 'main'], seed);
    await commit(seed, 'feature.txt', 'rewritten');
    await git(['push', '--force', upstream, 'feature'], seed);

    const { command } = makeCommand('team/app', clone);
    await expect(
      command.execute({ id: '7', ...globalOptions }, { globalOptions })
    ).rejects.toThrow("Local branch 'feature' has diverged");

    expect(await git(['rev-parse', 'feature'], clone)).toBe(local);
    expect(await git(['rev-parse', '--abbrev-ref', 'HEAD'], clone)).toBe(
      'main'
    );
  });

  it('keeps unpushed local commits on a branch that is ahead', async () => {
    await pushFeature(seed, upstream);
    await git(['fetch', 'origin'], clone);
    await git(['checkout', '-b', 'feature', 'origin/feature'], clone);
    const local = await commit(clone, 'local.txt', 'unpushed');
    await git(['checkout', 'main'], clone);

    const { command } = makeCommand('team/app', clone);
    await command.execute({ id: '7', ...globalOptions }, { globalOptions });

    expect(await git(['rev-parse', 'HEAD'], clone)).toBe(local);
  });

  it('falls back to origin when no remote URL matches the repository', async () => {
    const sha = await pushFeature(seed, upstream);
    await git(
      ['remote', 'set-url', 'origin', join(root, 'team/app.git')],
      clone
    );

    const { command } = makeCommand('team/app', clone);
    await command.execute({ id: '7', ...globalOptions }, { globalOptions });

    expect(await git(['rev-parse', '--abbrev-ref', 'HEAD'], clone)).toBe(
      'feature'
    );
    expect(await git(['rev-parse', 'HEAD'], clone)).toBe(sha);
  });

  it('surfaces git errors instead of falling back to another branch', async () => {
    await pushFeature(seed, upstream);
    await writeFile(join(clone, 'feature.txt'), 'uncommitted');

    const { command } = makeCommand('team/app', clone);
    await expect(
      command.execute({ id: '7', ...globalOptions }, { globalOptions })
    ).rejects.toThrow(/would be overwritten/);

    expect(await git(['rev-parse', '--abbrev-ref', 'HEAD'], clone)).toBe(
      'main'
    );
    expect(await git(['branch', '--list', 'pr-7'], clone)).toBe('');
  });

  it('checks out a fork PR as pr-<id> without touching same-named branches', async () => {
    const fork = await createBitbucketRepo('alice/app');
    await git(['push', fork, 'main'], seed);
    const sha = await pushFeature(seed, fork);
    await git(['branch', 'feature'], clone);
    const ownFeature = await git(['rev-parse', 'feature'], clone);

    const { command } = makeCommand('alice/app', clone);
    await command.execute({ id: '7', ...globalOptions }, { globalOptions });

    expect(await git(['rev-parse', '--abbrev-ref', 'HEAD'], clone)).toBe(
      'pr-7'
    );
    expect(await git(['rev-parse', 'HEAD'], clone)).toBe(sha);
    expect(await git(['rev-parse', 'feature'], clone)).toBe(ownFeature);
  });

  it('fetches a fork PR through an existing remote for the fork', async () => {
    const fork = await createBitbucketRepo('alice/app');
    await git(['push', fork, 'main'], seed);
    const sha = await pushFeature(seed, fork);
    await git(
      ['remote', 'add', 'alice', 'git@bitbucket.org:alice/app.git'],
      clone
    );

    const { command } = makeCommand('alice/app', clone);
    await command.execute({ id: '7', ...globalOptions }, { globalOptions });

    expect(await git(['rev-parse', '--abbrev-ref', 'HEAD'], clone)).toBe(
      'pr-7'
    );
    expect(await git(['rev-parse', 'HEAD'], clone)).toBe(sha);
  });

  it('explains when the fork behind the PR was deleted', async () => {
    const { command } = makeCommand(null, clone);
    await expect(
      command.execute({ id: '7', ...globalOptions }, { globalOptions })
    ).rejects.toThrow('The source repository of PR #7 no longer exists');
  });

  it('reports the checked-out branch in JSON mode', async () => {
    await pushFeature(seed, upstream);

    const { command, output } = makeCommand('team/app', clone);
    await command.execute(
      { id: '7', ...globalOptions },
      { globalOptions: { ...globalOptions, json: true } }
    );

    const json = output.logs.find((log) => log.startsWith('json:'));
    expect(JSON.parse(json!.slice('json:'.length))).toMatchObject({
      success: true,
      pullRequestId: 7,
      branch: 'feature',
    });
  });

  it('updates the fork branch on a second checkout', async () => {
    const fork = await createBitbucketRepo('alice/app');
    await git(['push', fork, 'main'], seed);
    await pushFeature(seed, fork);

    const { command } = makeCommand('alice/app', clone);
    await command.execute({ id: '7', ...globalOptions }, { globalOptions });

    await git(['checkout', 'feature'], seed);
    const latest = await commit(seed, 'more.txt', 'more');
    await git(['push', fork, 'feature'], seed);

    await command.execute({ id: '7', ...globalOptions }, { globalOptions });

    expect(await git(['rev-parse', 'HEAD'], clone)).toBe(latest);
  });
});
