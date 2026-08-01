import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLlmsTxt from "starlight-llms-txt";
import { readFileSync, existsSync } from "node:fs";

const rootPkg = new URL("../package.json", import.meta.url);
const cliVersion = existsSync(rootPkg)
  ? JSON.parse(readFileSync(rootPkg, "utf-8")).version
  : "latest";

export default defineConfig({
  vite: {
    define: {
      __CLI_VERSION__: JSON.stringify(cliVersion),
    },
  },
  site: "https://bitbucket-cli.paulvanderlei.com",
  integrations: [
    starlight({
      title: "Bitbucket CLI",
      description: "A powerful command-line interface for Bitbucket Cloud. Clone repos, manage PRs, and automate workflows — all from your terminal.",
      logo: {
        src: './src/assets/logo.svg',
        alt: 'Bitbucket CLI',
      },
      editLink: {
        baseUrl:
          'https://github.com/0pilatos0/bitbucket-cli/edit/main/docs/',
      },
      lastUpdated: true,
      customCss: ['/src/styles/docs.css'],
      plugins: [
        starlightLlmsTxt({
          projectName: "Bitbucket CLI",
          description:
            "Fast, scriptable CLI for Bitbucket Cloud. Clone repos, manage PRs, and automate workflows from the terminal.",
          details:
            "Unofficial, community-maintained CLI inspired by GitHub's gh CLI. Built on Bun, written in TypeScript. Distributed on npm as @pilatos/bitbucket-cli.",
          // Keep llms-small.txt focused on actionable docs by dropping the
          // troubleshooting / FAQ / changelog pages.
          exclude: ["help/**"],
          // Strip site chrome from the page content so the generated files
          // don't include nav/header/footer noise.
          minify: {
            customSelectors: ["header", "nav", "footer", "aside.sidebar"],
          },
        }),
      ],
      pagefind: {
        ranking: {
          pageLength: 0.05,
          termFrequency: 0.2,
          termSaturation: 1.6,
          termSimilarity: 8,
        },
      },
      components: {
        Head: './src/components/Head.astro',
      },
      head: [
        {
          tag: "script",
          attrs: {
            defer: true,
            src: "https://analytics.paulvanderlei.com/script.js",
            "data-website-id": "9a3d0f17-6294-466a-839e-9adc73e78393",
          },
        },
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/0pilatos0/bitbucket-cli',
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Quick Start", slug: "getting-started/quickstart" },
            { label: "Installation", slug: "getting-started/installation" },
            { label: "Authentication", slug: "getting-started/authentication" },
          ],
        },
        {
          label: "Command Reference",
          items: [
            { label: "Auth Commands", slug: "commands/auth" },
            { label: "Repo Commands", slug: "commands/repo" },
            {
              label: 'PR Commands',
              items: [{ autogenerate: { directory: 'commands/pr' } }],
            },
            { label: "Snippet Commands", slug: "commands/snippet" },
            {
              label: "Pipeline Commands",
              slug: "commands/pipeline",
            },
            {
              label: "Commit Commands",
              slug: "commands/commit",
            },
            {
              label: "Status Commands",
              slug: "commands/status",
            },
            {
              label: "Issue Commands",
              slug: "commands/issue",
            },
            {
              label: "Workspace Commands",
              slug: "commands/workspace",
            },
            {
              label: "Project Commands",
              slug: "commands/project",
            },
            {
              label: "Browse",
              slug: "commands/browse",
            },
            {
              label: "API",
              slug: "commands/api",
            },
            { label: "Config Commands", slug: "commands/config" },
            { label: "Completion", slug: "commands/completion" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Repository Context", slug: "guides/repository-context" },
            { label: "Scripting & Automation", slug: "guides/scripting" },
            { label: "CI/CD Integration", slug: "guides/cicd" },
            {
              label: 'AI Agent Integration',
              slug: 'guides/ai-agents',
              badge: {
                text: 'New',
                variant: 'tip',
              },
            },
          ],
        },
        {
          label: "Recipes",
          badge: { text: 'New', variant: 'tip' },
          items: [
            { label: "Overview", slug: "recipes" },
            { label: "Auto-merge on green CI", slug: "recipes/auto-merge-on-ci-green" },
            { label: "Bulk reviewer assignment", slug: "recipes/bulk-reviewer-assignment" },
            { label: "Fork synchronization", slug: "recipes/fork-synchronization" },
            { label: "Reporting & analytics", slug: "recipes/reporting-analytics" },
            { label: "Retry wrapper", slug: "recipes/retry-wrapper" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Global Flags", slug: "reference/global-flags" },
            { label: "Environment Variables", slug: "reference/environment-variables" },
            { label: "JSON Output", slug: "reference/json-output" },
            { label: "Error Codes", slug: "reference/error-codes" },
            { label: "Configuration File", slug: "reference/configuration" },
            { label: "Token Scopes", slug: "reference/token-scopes" },
          ],
        },
        {
          label: "Help",
          items: [
            { label: "Troubleshooting", slug: "help/troubleshooting" },
            { label: "FAQ", slug: "help/faq" },
            { label: "Changelog", slug: "help/changelog" },
          ],
        },
      ],
    }),
  ],
});
