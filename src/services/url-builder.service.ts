/**
 * Builder for Bitbucket Cloud web URLs.
 *
 * Centralizing URL construction lets `bb browse` and any future `--web`
 * flags share one source of truth for path schemes and encoding rules.
 */

import type { RepoContext } from '../types/config.js';

export const BITBUCKET_WEB_BASE = 'https://bitbucket.org';

export interface IUrlBuilderService {
  repo(ctx: RepoContext): string;
  src(ctx: RepoContext, branch: string, path?: string, line?: number): string;
  branchList(ctx: RepoContext): string;
  commit(ctx: RepoContext, sha: string): string;
  commitList(ctx: RepoContext): string;
  pullRequest(ctx: RepoContext, id: number): string;
  pullRequestList(ctx: RepoContext): string;
  pipelinesHome(ctx: RepoContext): string;
  pipelineRun(ctx: RepoContext, idOrUuid: string): string;
  downloads(ctx: RepoContext): string;
  issue(ctx: RepoContext, id: number): string;
  issueList(ctx: RepoContext): string;
  wiki(ctx: RepoContext): string;
  settings(ctx: RepoContext): string;
}

function encodePathSegments(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export class UrlBuilderService implements IUrlBuilderService {
  private readonly base: string;

  constructor(base: string = BITBUCKET_WEB_BASE) {
    this.base = base.replace(/\/+$/, '');
  }

  public repo(ctx: RepoContext): string {
    return this.repoBase(ctx);
  }

  public src(
    ctx: RepoContext,
    branch: string,
    path?: string,
    line?: number
  ): string {
    const encodedBranch = encodeURIComponent(branch);
    const trimmedPath = path?.replace(/^\/+/, '').replace(/\/+$/, '') ?? '';
    const pathPart = trimmedPath ? `/${encodePathSegments(trimmedPath)}` : '/';
    const lineFragment =
      typeof line === 'number' && Number.isFinite(line) && line > 0
        ? `#lines-${line}`
        : '';
    return `${this.repoBase(ctx)}/src/${encodedBranch}${pathPart}${lineFragment}`;
  }

  public branchList(ctx: RepoContext): string {
    return `${this.repoBase(ctx)}/branches/`;
  }

  public commit(ctx: RepoContext, sha: string): string {
    return `${this.repoBase(ctx)}/commits/${encodeURIComponent(sha)}`;
  }

  public commitList(ctx: RepoContext): string {
    return `${this.repoBase(ctx)}/commits/`;
  }

  public pullRequest(ctx: RepoContext, id: number): string {
    return `${this.repoBase(ctx)}/pull-requests/${id}`;
  }

  public pullRequestList(ctx: RepoContext): string {
    return `${this.repoBase(ctx)}/pull-requests/`;
  }

  public pipelinesHome(ctx: RepoContext): string {
    return `${this.repoBase(ctx)}/pipelines`;
  }

  public pipelineRun(ctx: RepoContext, idOrUuid: string): string {
    return `${this.repoBase(ctx)}/pipelines/results/${encodeURIComponent(idOrUuid)}`;
  }

  public downloads(ctx: RepoContext): string {
    return `${this.repoBase(ctx)}/downloads/`;
  }

  public issue(ctx: RepoContext, id: number): string {
    return `${this.repoBase(ctx)}/issues/${id}`;
  }

  public issueList(ctx: RepoContext): string {
    return `${this.repoBase(ctx)}/issues`;
  }

  public wiki(ctx: RepoContext): string {
    return `${this.repoBase(ctx)}/wiki`;
  }

  public settings(ctx: RepoContext): string {
    return `${this.repoBase(ctx)}/admin`;
  }

  private repoBase(ctx: RepoContext): string {
    return `${this.base}/${encodeURIComponent(ctx.workspace)}/${encodeURIComponent(ctx.repoSlug)}`;
  }
}
