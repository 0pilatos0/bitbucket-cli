/**
 * Structured help text builder for Commander.js commands.
 *
 * Produces consistently formatted help text from declarative config,
 * appended via Commander's `.addHelpText('after', ...)`.
 */

import { Chalk } from 'chalk';

export interface SeeAlsoEntry {
  label: string;
  url: string;
}

export interface HelpTextConfig {
  examples?: string[];
  validValues?: Record<string, string[]>;
  defaults?: Record<string, string>;
  envVars?: Record<string, string>;
  seeAlso?: SeeAlsoEntry[];
}

interface ColorFns {
  bold: (text: string) => string;
  dim: (text: string) => string;
  cyan: (text: string) => string;
}

export function createHelpTextBuilder(noColor: boolean) {
  const passthrough = (t: string) => t;
  const chalk = new Chalk({ level: noColor ? 0 : 1 });
  const c: ColorFns = noColor
    ? { bold: passthrough, dim: passthrough, cyan: passthrough }
    : { bold: chalk.bold, dim: chalk.dim, cyan: chalk.cyan };

  return function buildHelpText(config: HelpTextConfig): string {
    const sections: string[] = [];

    if (config.examples?.length) {
      sections.push(c.bold('Examples:'));
      for (const example of config.examples) {
        sections.push(`  ${c.dim('$')} ${example}`);
      }
    }

    if (config.validValues) {
      for (const [label, values] of Object.entries(config.validValues)) {
        if (sections.length) sections.push('');
        sections.push(c.bold(`${label}:`));
        sections.push(`  ${c.cyan(values.join(', '))}`);
      }
    }

    if (config.defaults) {
      if (sections.length) sections.push('');
      sections.push(c.bold('Defaults:'));
      for (const [key, value] of Object.entries(config.defaults)) {
        sections.push(`  ${c.bold(`--${key}`)}  ${c.cyan(value)}`);
      }
    }

    if (config.envVars) {
      if (sections.length) sections.push('');
      sections.push(c.bold('Environment variables:'));
      const maxLen = Math.max(
        ...Object.keys(config.envVars).map((k) => k.length)
      );
      for (const [name, desc] of Object.entries(config.envVars)) {
        sections.push(`  ${c.bold(name.padEnd(maxLen + 2))}${c.dim(desc)}`);
      }
    }

    if (config.seeAlso?.length) {
      if (sections.length) sections.push('');
      sections.push(c.bold('See also:'));
      const maxLen = Math.max(...config.seeAlso.map((e) => e.label.length));
      for (const { label, url } of config.seeAlso) {
        sections.push(`  ${c.bold(label.padEnd(maxLen + 2))}${c.cyan(url)}`);
      }
    }

    return '\n' + sections.join('\n') + '\n';
  };
}
