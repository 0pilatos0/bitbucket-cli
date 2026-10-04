import { describe, it, expect } from 'bun:test';
import {
  COMPILE_TARGETS,
  assetName,
  type CompileTarget,
} from '../scripts/compile.js';

interface Step {
  id?: string;
  if?: string;
  run?: string;
  uses?: string;
  with?: Record<string, string>;
  env?: Record<string, string>;
}

interface Job {
  needs?: string[];
  if?: string;
  uses?: string;
  permissions?: Record<string, string>;
  outputs?: Record<string, string>;
  strategy?: { matrix: { include?: Record<string, string>[] } };
  steps?: Step[];
}

interface Workflow {
  on: string | string[] | Record<string, unknown>;
  jobs: Record<string, Job>;
}

const workflowsDir = `${import.meta.dir}/../.github/workflows`;

async function loadWorkflow(name: string): Promise<Workflow> {
  return Bun.YAML.parse(
    await Bun.file(`${workflowsDir}/${name}`).text()
  ) as Workflow;
}

function triggers(workflow: Workflow): string[] {
  if (typeof workflow.on === 'string') return [workflow.on];
  if (Array.isArray(workflow.on)) return workflow.on;
  return Object.keys(workflow.on);
}

describe('release PR checks', () => {
  it('uses the supported Changesets action inputs', async () => {
    const { jobs } = await loadWorkflow('release.yml');
    const openPr = jobs.release!.steps!.find((step) =>
      step.uses?.startsWith('changesets/action@')
    );

    expect(openPr?.with).toEqual({
      'version-script': 'bun run version',
      'pr-title': 'chore: version packages',
      'commit-message': 'chore: version packages',
    });
  });

  it('dispatches every pull_request workflow after opening the release PR', async () => {
    const { jobs } = await loadWorkflow('release.yml');
    const release = jobs.release!;
    const checks = jobs['release-pr-checks']!;

    const openPr = release.steps!.find((step) =>
      step.uses?.startsWith('changesets/action@')
    );
    expect(openPr?.id).toBeDefined();
    expect(release.outputs?.release_pr_number).toBe(
      `\${{ steps.${openPr!.id}.outputs.pr-number }}`
    );
    expect(release.permissions?.actions).toBeUndefined();

    expect(checks.needs).toEqual(['release']);
    expect(checks.if).toBe("needs.release.outputs.release_pr_number != ''");
    expect(checks.permissions).toEqual({ actions: 'write' });

    const dispatch = checks.steps!.find((step) =>
      step.run?.includes('gh workflow run')
    );
    expect(dispatch).toBeDefined();
    expect(dispatch!.env?.RELEASE_BRANCH).toBe(
      'changeset-release/${{ github.ref_name }}'
    );
    expect(dispatch!.run).not.toContain('${{');

    const prWorkflows: string[] = [];
    for (const file of new Bun.Glob('*.{yml,yaml}').scanSync(workflowsDir)) {
      const events = triggers(await loadWorkflow(file));
      if (!events.includes('pull_request')) continue;
      prWorkflows.push(file);
      expect(events).toContain('workflow_dispatch');
      expect(dispatch!.run).toContain(
        `gh workflow run ${file} --ref "$RELEASE_BRANCH"`
      );
    }
    expect(prWorkflows.length).toBeGreaterThan(0);
  });
});

describe('release CI gate', () => {
  it('runs CI only through the release workflow on main', async () => {
    const events = triggers(await loadWorkflow('ci.yml'));
    expect(events).toContain('workflow_call');
    expect(events).not.toContain('push');

    const { jobs } = await loadWorkflow('release.yml');
    expect(jobs.ci!.uses).toBe('./.github/workflows/ci.yml');
  });

  it('makes every release job depend on CI', async () => {
    const { jobs } = await loadWorkflow('release.yml');

    const dependsOnCi = (name: string): boolean =>
      (jobs[name]!.needs ?? []).some(
        (need) => need === 'ci' || dependsOnCi(need)
      );

    for (const name of Object.keys(jobs)) {
      if (name === 'ci') continue;
      expect(dependsOnCi(name), name).toBe(true);
      // A status function replaces the implicit success check on needs, so
      // such a job must require the CI result itself.
      const condition = jobs[name]!.if ?? '';
      if (/\b(always|failure|cancelled|success)\(\)/.test(condition)) {
        expect(jobs[name]!.needs, name).toContain('ci');
        expect(condition, name).toContain("needs.ci.result == 'success'");
      }
    }
  });

  it('requires CI success on both npm publish paths', async () => {
    const { jobs } = await loadWorkflow('release.yml');
    const condition = jobs.publish!.if!.replace(/\s+/g, ' ').trim();
    expect(condition).toBe(
      "always() && needs.ci.result == 'success' && " +
        "(needs.release.result == 'success' || needs.release.result == 'skipped') && " +
        "( (needs.release.outputs.should_publish == 'true' && needs.release-binaries.result == 'success') || " +
        "(github.event_name == 'workflow_dispatch' && inputs.publish_only == true) )"
    );
  });

  it('does not rerun the test suite outside CI', async () => {
    const { jobs } = await loadWorkflow('release.yml');
    for (const job of Object.values(jobs)) {
      for (const step of job.steps ?? []) {
        expect(step.run ?? '').not.toMatch(/\bbun (run )?test\b/);
      }
    }
  });
});

describe('release binaries', () => {
  it('builds one binary per compile target under its release asset name', async () => {
    const { jobs } = await loadWorkflow('release.yml');
    const legs = jobs.binaries!.strategy!.matrix.include!;

    expect(legs.map((leg) => leg.target)).toEqual([...COMPILE_TARGETS]);
    for (const leg of legs) {
      expect(leg.asset).toBe(assetName(leg.target as CompileTarget));
    }
  });

  it('packages, attests and uploads archives, manifests and installers', async () => {
    const { jobs } = await loadWorkflow('release.yml');
    const steps = jobs['release-binaries']!.steps!;
    const index = (match: (step: Step) => boolean) => {
      const i = steps.findIndex(match);
      expect(i).toBeGreaterThanOrEqual(0);
      return i;
    };

    const checkout = index((s) => !!s.uses?.startsWith('actions/checkout@'));
    const download = index(
      (s) => !!s.uses?.startsWith('actions/download-artifact@')
    );
    const pack = index(
      (s) =>
        s.run?.includes('bun scripts/package-release.ts --dir dist-bin') ??
        false
    );
    const attest = index(
      (s) => !!s.uses?.startsWith('actions/attest-build-provenance@')
    );
    const upload = index((s) => s.run?.includes('gh release upload') ?? false);

    expect(checkout).toBeLessThan(pack);
    expect(download).toBeLessThan(pack);
    expect(pack).toBeLessThan(attest);
    expect(attest).toBeLessThan(upload);
    expect(steps[attest]!.with?.['subject-checksums']).toBe(
      'dist-bin/SHA256SUMS'
    );
    expect(steps[upload]!.run).toContain(
      'gh release upload "$TAG" dist-bin/* scripts/install.sh scripts/install.ps1'
    );
  });
});
