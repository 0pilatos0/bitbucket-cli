import { describe, it, expect } from 'bun:test';

interface Step {
  id?: string;
  if?: string;
  run?: string;
  uses?: string;
  env?: Record<string, string>;
}

interface Job {
  needs?: string[];
  if?: string;
  uses?: string;
  permissions?: Record<string, string>;
  outputs?: Record<string, string>;
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
  it('dispatches every pull_request workflow after opening the release PR', async () => {
    const { jobs } = await loadWorkflow('release.yml');
    const release = jobs.release!;
    const checks = jobs['release-pr-checks']!;

    const openPr = release.steps!.find((step) =>
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
