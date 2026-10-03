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
  permissions?: Record<string, string>;
  outputs?: Record<string, string>;
  strategy?: { matrix: { include?: Record<string, string>[] } };
  steps: Step[];
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
  it('dispatches every pull_request workflow after opening the release PR', async () => {
    const { jobs } = await loadWorkflow('release.yml');
    const release = jobs.release!;
    const checks = jobs['release-pr-checks']!;

    const openPr = release.steps.find((step) =>
      step.uses?.startsWith('changesets/action@')
    );
    expect(openPr?.id).toBeDefined();
    expect(release.outputs?.release_pr_number).toBe(
      `\${{ steps.${openPr!.id}.outputs.pullRequestNumber }}`
    );
    expect(release.permissions?.actions).toBeUndefined();

    expect(checks.needs).toEqual(['release']);
    expect(checks.if).toBe("needs.release.outputs.release_pr_number != ''");
    expect(checks.permissions).toEqual({ actions: 'write' });

    const dispatch = checks.steps.find((step) =>
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
    const steps = jobs['release-binaries']!.steps;
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
