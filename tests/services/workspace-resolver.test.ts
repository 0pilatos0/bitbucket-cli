/**
 * Tests for the shared workspace resolver.
 */

import { describe, it, expect } from 'bun:test';
import { resolveWorkspace } from '../../src/services/workspace-resolver.js';
import { createMockConfigService } from '../setup.js';

describe('resolveWorkspace', () => {
  it('returns the explicit value when provided', async () => {
    const config = createMockConfigService({ defaultWorkspace: 'fallback' });
    const result = await resolveWorkspace(config, 'explicit');
    expect(result).toBe('explicit');
  });

  it('falls back to config.defaultWorkspace', async () => {
    const config = createMockConfigService({ defaultWorkspace: 'fallback' });
    const result = await resolveWorkspace(config);
    expect(result).toBe('fallback');
  });

  it('throws a BBError when neither is set', async () => {
    const config = createMockConfigService({});
    await expect(resolveWorkspace(config)).rejects.toThrow(
      'No workspace specified'
    );
  });

  it('ignores empty explicit value and falls back', async () => {
    const config = createMockConfigService({ defaultWorkspace: 'cfg' });
    const result = await resolveWorkspace(config, '');
    expect(result).toBe('cfg');
  });
});
