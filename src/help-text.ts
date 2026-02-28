/**
 * Structured help text builder for Commander.js commands.
 *
 * Produces consistently formatted help text from declarative config,
 * appended via Commander's `.addHelpText('after', ...)`.
 */

export interface HelpTextConfig {
  examples?: string[];
  validValues?: Record<string, string[]>;
  defaults?: Record<string, string>;
  envVars?: Record<string, string>;
}

export function buildHelpText(config: HelpTextConfig): string {
  const sections: string[] = [];

  if (config.examples?.length) {
    sections.push('Examples:');
    for (const example of config.examples) {
      sections.push(`  $ ${example}`);
    }
  }

  if (config.validValues) {
    for (const [label, values] of Object.entries(config.validValues)) {
      if (sections.length) sections.push('');
      sections.push(`${label}:`);
      sections.push(`  ${values.join(', ')}`);
    }
  }

  if (config.defaults) {
    if (sections.length) sections.push('');
    sections.push('Defaults:');
    for (const [key, value] of Object.entries(config.defaults)) {
      sections.push(`  --${key}  ${value}`);
    }
  }

  if (config.envVars) {
    if (sections.length) sections.push('');
    sections.push('Environment variables:');
    const maxLen = Math.max(
      ...Object.keys(config.envVars).map((k) => k.length)
    );
    for (const [name, desc] of Object.entries(config.envVars)) {
      sections.push(`  ${name.padEnd(maxLen + 2)}${desc}`);
    }
  }

  return '\n' + sections.join('\n') + '\n';
}
