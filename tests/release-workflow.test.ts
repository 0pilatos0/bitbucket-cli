import { describe, it, expect } from 'bun:test';

interface Step {
  id?: string;
  if?: string;
  run?: string;
  uses?: string;
}

interface Workflow {
  on: Record<string, unknown>;
  jobs: Record<string, { permissions?: Record<string, string>; steps: Step[] }>;
}

const workflowsDir = `${import.meta.dir}/../.github/workflows`;

async function loadWorkflow(name: string): Promise<Workflow> {
  return Bun.YAML.parse(
    await Bun.file(`${workflowsDir}/${name}`).text()
  ) as Workflow;
}

describe('release PR checks', () => {
  it('dispatches every pull_request workflow after opening the release PR', async () => {
    const job = (await loadWorkflow('release.yml')).jobs.release!;
    const openPr = job.steps.find((step) =>
      step.uses?.startsWith('changesets/action@')
    );
    const dispatch = job.steps.find((step) =>
      step.run?.includes('gh workflow run')
    );

    expect(openPr?.id).toBeDefined();
    expect(dispatch?.if).toContain(
      `steps.${openPr!.id}.outputs.pullRequestNumber`
    );
    expect(job.steps.indexOf(dispatch!)).toBeGreaterThan(
      job.steps.indexOf(openPr!)
    );
    expect(job.permissions?.actions).toBe('write');

    const prWorkflows: string[] = [];
    for (const file of new Bun.Glob('*.yml').scanSync(workflowsDir)) {
      const workflow = await loadWorkflow(file);
      if (!('pull_request' in workflow.on)) continue;
      prWorkflows.push(file);
      expect(Object.keys(workflow.on)).toContain('workflow_dispatch');
      expect(dispatch!.run).toContain(
        `gh workflow run ${file} --ref "changeset-release/`
      );
    }
    expect(prWorkflows.length).toBeGreaterThan(0);
  });
});
