/**
 * Smoke test for the generated API client (issue #266).
 *
 * Only a subset of the generated *Api classes is wired into commands, so the
 * rest are never imported at runtime — a broken class (missing export, import
 * cycle, runtime error at module load) would go unnoticed by command tests.
 * This suite imports every class and asserts each one is constructible.
 */

import { describe, expect, it } from 'bun:test';
import * as api from '../src/generated/api.js';
import * as barrel from '../src/generated/index.js';

// Floor below the 23 classes generated today; guards against a spec update
// silently gutting the client without a hardcoded list that would then rot.
const MIN_API_CLASSES = 20;

function apiClassNames(): string[] {
  return Object.keys(api).filter((name) => name.endsWith('Api'));
}

describe('generated API client', () => {
  it('exports every *Api class as a constructible class', () => {
    const apiClasses = Object.entries(api).filter(([name]) =>
      name.endsWith('Api')
    ) as Array<[string, unknown]>;

    expect(apiClasses.length).toBeGreaterThanOrEqual(MIN_API_CLASSES);

    for (const [name, exported] of apiClasses) {
      const isClass = Function.prototype.toString
        .call(exported)
        .startsWith('class ');
      expect(isClass, `${name} should be a class`).toBe(true);
      expect(
        () => new (exported as new () => unknown)(),
        `${name} should construct with no arguments`
      ).not.toThrow();
    }
  });

  it('re-exports every *Api class from the barrel index', () => {
    for (const name of apiClassNames()) {
      const barrelBinding = barrel[name as keyof typeof barrel];
      expect(
        barrelBinding,
        `${name} missing from the barrel index`
      ).toBeDefined();
      const apiBinding = api[name as keyof typeof api];
      expect(barrelBinding).toBe(apiBinding);
    }
  });
});
