import { describe, it, expect } from 'bun:test';

interface TsConfig {
  include: string[];
}

describe('tsconfig.json', () => {
  it('type-checks src, tests and scripts in `bun run lint`', async () => {
    const config = (await Bun.file(
      `${import.meta.dir}/../tsconfig.json`
    ).json()) as TsConfig;

    expect(config.include).toEqual(
      expect.arrayContaining(['src/**/*', 'tests/**/*', 'scripts/**/*'])
    );
  });
});
