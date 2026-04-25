/**
 * UrlBuilderService tests
 */

import { describe, it, expect } from 'bun:test';
import {
  UrlBuilderService,
  BITBUCKET_WEB_BASE,
} from '../../src/services/url-builder.service.js';

const ctx = { workspace: 'acme', repoSlug: 'widgets' };

describe('UrlBuilderService', () => {
  describe('repo()', () => {
    it('returns the canonical repo home URL', () => {
      const builder = new UrlBuilderService();
      expect(builder.repo(ctx)).toBe('https://bitbucket.org/acme/widgets');
    });

    it('strips trailing slashes from a custom base URL', () => {
      const builder = new UrlBuilderService('https://bitbucket.example.com///');
      expect(builder.repo(ctx)).toBe(
        'https://bitbucket.example.com/acme/widgets'
      );
    });

    it('uses the BITBUCKET_WEB_BASE constant by default', () => {
      const builder = new UrlBuilderService();
      expect(builder.repo(ctx).startsWith(BITBUCKET_WEB_BASE)).toBe(true);
    });

    it('URL-encodes workspace and repo slugs with special chars', () => {
      const builder = new UrlBuilderService();
      const result = builder.repo({
        workspace: 'team space',
        repoSlug: 'cool repo',
      });
      expect(result).toBe('https://bitbucket.org/team%20space/cool%20repo');
    });
  });

  describe('src()', () => {
    const builder = new UrlBuilderService();

    it('builds branch tree URL when no path is given', () => {
      expect(builder.src(ctx, 'main')).toBe(
        'https://bitbucket.org/acme/widgets/src/main/'
      );
    });

    it('builds file URL at a branch', () => {
      expect(builder.src(ctx, 'main', 'src/cli.ts')).toBe(
        'https://bitbucket.org/acme/widgets/src/main/src/cli.ts'
      );
    });

    it('builds file URL with a line anchor', () => {
      expect(builder.src(ctx, 'main', 'src/cli.ts', 42)).toBe(
        'https://bitbucket.org/acme/widgets/src/main/src/cli.ts#lines-42'
      );
    });

    it('omits the line anchor when line is zero or negative', () => {
      expect(builder.src(ctx, 'main', 'src/cli.ts', 0)).toBe(
        'https://bitbucket.org/acme/widgets/src/main/src/cli.ts'
      );
      expect(builder.src(ctx, 'main', 'src/cli.ts', -5)).toBe(
        'https://bitbucket.org/acme/widgets/src/main/src/cli.ts'
      );
    });

    it('encodes branch names containing slashes', () => {
      expect(builder.src(ctx, 'feature/foo')).toBe(
        'https://bitbucket.org/acme/widgets/src/feature%2Ffoo/'
      );
    });

    it('encodes branch names containing spaces and unicode', () => {
      expect(builder.src(ctx, 'release 2.0', 'README.md')).toBe(
        'https://bitbucket.org/acme/widgets/src/release%202.0/README.md'
      );
    });

    it('encodes path segments individually but preserves /', () => {
      expect(builder.src(ctx, 'main', 'src/has space/file name.ts')).toBe(
        'https://bitbucket.org/acme/widgets/src/main/src/has%20space/file%20name.ts'
      );
    });

    it('strips leading and trailing slashes from the path', () => {
      expect(builder.src(ctx, 'main', '/src/cli.ts/')).toBe(
        'https://bitbucket.org/acme/widgets/src/main/src/cli.ts'
      );
    });

    it('treats an empty path the same as no path', () => {
      expect(builder.src(ctx, 'main', '')).toBe(
        'https://bitbucket.org/acme/widgets/src/main/'
      );
    });
  });

  describe('branchList()', () => {
    it('returns the branches list URL with trailing slash', () => {
      const builder = new UrlBuilderService();
      expect(builder.branchList(ctx)).toBe(
        'https://bitbucket.org/acme/widgets/branches/'
      );
    });
  });

  describe('commit() and commitList()', () => {
    const builder = new UrlBuilderService();

    it('builds a commit URL', () => {
      expect(builder.commit(ctx, 'abc1234')).toBe(
        'https://bitbucket.org/acme/widgets/commits/abc1234'
      );
    });

    it('returns the commits list URL', () => {
      expect(builder.commitList(ctx)).toBe(
        'https://bitbucket.org/acme/widgets/commits/'
      );
    });
  });

  describe('pullRequest() and pullRequestList()', () => {
    const builder = new UrlBuilderService();

    it('builds a PR detail URL', () => {
      expect(builder.pullRequest(ctx, 217)).toBe(
        'https://bitbucket.org/acme/widgets/pull-requests/217'
      );
    });

    it('returns the PR list URL', () => {
      expect(builder.pullRequestList(ctx)).toBe(
        'https://bitbucket.org/acme/widgets/pull-requests/'
      );
    });
  });

  describe('pipelines', () => {
    const builder = new UrlBuilderService();

    it('returns the pipelines home URL (no trailing slash)', () => {
      expect(builder.pipelinesHome(ctx)).toBe(
        'https://bitbucket.org/acme/widgets/pipelines'
      );
    });

    it('builds a pipeline run URL with numeric id', () => {
      expect(builder.pipelineRun(ctx, '123')).toBe(
        'https://bitbucket.org/acme/widgets/pipelines/results/123'
      );
    });

    it('encodes pipeline UUIDs', () => {
      expect(builder.pipelineRun(ctx, '{abc-123}')).toBe(
        'https://bitbucket.org/acme/widgets/pipelines/results/%7Babc-123%7D'
      );
    });
  });

  describe('downloads(), issues, wiki, settings', () => {
    const builder = new UrlBuilderService();

    it('returns downloads URL with trailing slash', () => {
      expect(builder.downloads(ctx)).toBe(
        'https://bitbucket.org/acme/widgets/downloads/'
      );
    });

    it('returns issue list URL (no trailing slash)', () => {
      expect(builder.issueList(ctx)).toBe(
        'https://bitbucket.org/acme/widgets/issues'
      );
    });

    it('builds an issue detail URL', () => {
      expect(builder.issue(ctx, 12)).toBe(
        'https://bitbucket.org/acme/widgets/issues/12'
      );
    });

    it('returns wiki URL', () => {
      expect(builder.wiki(ctx)).toBe('https://bitbucket.org/acme/widgets/wiki');
    });

    it('returns settings/admin URL', () => {
      expect(builder.settings(ctx)).toBe(
        'https://bitbucket.org/acme/widgets/admin'
      );
    });
  });
});
