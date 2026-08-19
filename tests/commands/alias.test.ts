/**
 * Alias command tests (bb alias set/list/delete)
 */

import { describe, it, expect } from 'bun:test';
import { SetAliasCommand } from '../../src/commands/alias/set.command.js';
import { ListAliasesCommand } from '../../src/commands/alias/list.command.js';
import { DeleteAliasCommand } from '../../src/commands/alias/delete.command.js';
import { ErrorCode } from '../../src/types/errors.js';
import { createMockConfigService, createMockOutputService } from '../setup.js';

describe('SetAliasCommand', () => {
  it('adds a new alias', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new SetAliasCommand(configService, output);
    await command.execute(
      { name: 'co', expansion: 'pr checkout $1' },
      { globalOptions: {} }
    );

    expect(output.logs).toContain("success:Added alias 'co' = pr checkout $1");
    expect(await configService.getValue('aliases')).toEqual({
      co: 'pr checkout $1',
    });
  });

  it('notes the previous expansion when redefining', async () => {
    const configService = createMockConfigService({
      aliases: { co: 'pr checkout $1' },
    });
    const output = createMockOutputService();

    const command = new SetAliasCommand(configService, output);
    await command.execute(
      { name: 'co', expansion: 'pr view $1' },
      { globalOptions: {} }
    );

    expect(output.logs).toContain(
      "success:Changed alias 'co' = pr view $1 (was: pr checkout $1)"
    );
    expect(
      output.logs.filter((log) => log.startsWith('success:'))
    ).toHaveLength(1);
    expect(await configService.getValue('aliases')).toEqual({
      co: 'pr view $1',
    });
  });

  it('emits a JSON envelope with --json', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new SetAliasCommand(configService, output);
    await command.execute(
      { name: 'prs', expansion: 'pr list --all' },
      { globalOptions: { json: true } }
    );

    expect(output.logs).toContain(
      'json:{"success":true,"name":"prs","expansion":"pr list --all"}'
    );
  });

  it('rejects invalid alias names', async () => {
    const command = new SetAliasCommand(
      createMockConfigService(),
      createMockOutputService()
    );

    await expect(
      command.execute(
        { name: '--flag', expansion: 'pr list' },
        { globalOptions: {} }
      )
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_INVALID });
  });

  it('rejects reserved built-in command names', async () => {
    const command = new SetAliasCommand(
      createMockConfigService(),
      createMockOutputService()
    );

    await expect(
      command.execute(
        { name: 'pr', expansion: 'repo list' },
        { globalOptions: {} }
      )
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_INVALID });
  });

  it('rejects an empty expansion', async () => {
    const command = new SetAliasCommand(
      createMockConfigService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ name: 'co', expansion: '   ' }, { globalOptions: {} })
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_REQUIRED });
  });

  it('rejects a command alias with an unclosed quote', async () => {
    const command = new SetAliasCommand(
      createMockConfigService(),
      createMockOutputService()
    );

    await expect(
      command.execute(
        { name: 'bad', expansion: "pr view 'oops" },
        { globalOptions: {} }
      )
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_INVALID });
  });

  it('accepts shell aliases verbatim (no tokenization)', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new SetAliasCommand(configService, output);
    await command.execute(
      { name: 'greet', expansion: '!echo "unbalanced is fine: \'" ' },
      { globalOptions: {} }
    );

    expect(await configService.getValue('aliases')).toEqual({
      greet: '!echo "unbalanced is fine: \'" ',
    });
  });
});

describe('ListAliasesCommand', () => {
  it('renders a sorted table', async () => {
    const configService = createMockConfigService({
      aliases: { prs: 'pr list --all', co: 'pr checkout $1' },
    });
    const output = createMockOutputService();

    const command = new ListAliasesCommand(configService, output);
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs).toContain('table:Alias,Expansion');
    expect(output.logs).toContain(
      'table-rows:[["co","pr checkout $1"],["prs","pr list --all"]]'
    );
  });

  it('prints a hint when no aliases exist', async () => {
    const output = createMockOutputService();

    const command = new ListAliasesCommand(createMockConfigService(), output);
    await command.execute(undefined, { globalOptions: {} });

    expect(
      output.logs.some((log) => log.startsWith('info:No aliases configured'))
    ).toBe(true);
  });

  it('emits a JSON envelope with --json', async () => {
    const configService = createMockConfigService({
      aliases: { co: 'pr checkout $1' },
    });
    const output = createMockOutputService();

    const command = new ListAliasesCommand(configService, output);
    await command.execute(undefined, { globalOptions: { json: true } });

    expect(output.logs).toContain(
      'json:{"count":1,"aliases":{"co":"pr checkout $1"}}'
    );
  });
});

describe('DeleteAliasCommand', () => {
  it('deletes an existing alias', async () => {
    const configService = createMockConfigService({
      aliases: { co: 'pr checkout $1', prs: 'pr list --all' },
    });
    const output = createMockOutputService();

    const command = new DeleteAliasCommand(configService, output);
    await command.execute({ name: 'co' }, { globalOptions: {} });

    expect(output.logs).toContain(
      "success:Deleted alias 'co' (was: pr checkout $1)"
    );
    expect(await configService.getValue('aliases')).toEqual({
      prs: 'pr list --all',
    });
  });

  it('errors on an unknown alias', async () => {
    const command = new DeleteAliasCommand(
      createMockConfigService(),
      createMockOutputService()
    );

    await expect(
      command.execute({ name: 'nosuch' }, { globalOptions: {} })
    ).rejects.toMatchObject({ code: ErrorCode.CONFIG_INVALID_KEY });
  });

  it('emits a JSON envelope with --json', async () => {
    const configService = createMockConfigService({
      aliases: { co: 'pr checkout $1' },
    });
    const output = createMockOutputService();

    const command = new DeleteAliasCommand(configService, output);
    await command.execute({ name: 'co' }, { globalOptions: { json: true } });

    expect(output.logs).toContain(
      'json:{"success":true,"name":"co","expansion":"pr checkout $1"}'
    );
  });
});
