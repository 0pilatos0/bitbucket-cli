/**
 * Config command tests
 */

import { describe, it, expect } from 'bun:test';
import { GetConfigCommand } from '../../src/commands/config/get.command.js';
import { SetConfigCommand } from '../../src/commands/config/set.command.js';
import { ListConfigCommand } from '../../src/commands/config/list.command.js';
import type { BBConfig } from '../../src/types/config.js';
import { createMockConfigService, createMockOutputService } from '../setup.js';

describe('GetConfigCommand', () => {
  it('should get defaultWorkspace value', async () => {
    const configService = createMockConfigService({
      defaultWorkspace: 'my-workspace',
    });
    const output = createMockOutputService();

    const command = new GetConfigCommand(configService, output);
    await command.execute({ key: 'defaultWorkspace' }, { globalOptions: {} });

    expect(output.logs).toContain('text:my-workspace');
  });

  it('should output empty string for unset value', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new GetConfigCommand(configService, output);
    await command.execute({ key: 'defaultWorkspace' }, { globalOptions: {} });

    expect(output.logs).toContain('text:');
  });

  it('should output boolean false values correctly', async () => {
    const configService = createMockConfigService({
      skipVersionCheck: false,
    });
    const output = createMockOutputService();

    const command = new GetConfigCommand(configService, output);
    await command.execute({ key: 'skipVersionCheck' }, { globalOptions: {} });

    expect(output.logs).toContain('text:false');
  });

  it('should return typed values in JSON output', async () => {
    const configService = createMockConfigService({
      versionCheckInterval: 7,
    });
    const output = createMockOutputService();

    const command = new GetConfigCommand(configService, output);
    await command.execute(
      { key: 'versionCheckInterval' },
      { globalOptions: { json: true } }
    );

    expect(output.logs).toContain(
      'json:{"key":"versionCheckInterval","value":7}'
    );
  });

  it('should reject hidden keys like apiToken', async () => {
    const configService = createMockConfigService({
      apiToken: 'secret',
    });
    const output = createMockOutputService();

    const command = new GetConfigCommand(configService, output);

    await expect(
      command.run({ key: 'apiToken' }, { globalOptions: {} })
    ).rejects.toBeDefined();

    expect(output.logs.some((log) => log.includes('Cannot display'))).toBe(
      true
    );
  });

  it('should reject invalid keys', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new GetConfigCommand(configService, output);

    await expect(
      command.run({ key: 'invalidKey' }, { globalOptions: {} })
    ).rejects.toBeDefined();

    expect(output.logs.some((log) => log.includes('Unknown config key'))).toBe(
      true
    );
    expect(output.logs.some((log) => log.includes('skipVersionCheck'))).toBe(
      true
    );
    expect(
      output.logs.some((log) => log.includes('versionCheckInterval'))
    ).toBe(true);
  });

  it('should emit structured JSON error for invalid keys in json mode', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new GetConfigCommand(configService, output);

    await expect(
      command.run({ key: 'invalidKey' }, { globalOptions: { json: true } })
    ).rejects.toBeDefined();

    expect(output.logs).toContain(
      'jsonError:{"name":"BBError","code":4003,"message":"Unknown config key \'invalidKey\'. Valid keys: username, defaultWorkspace, skipVersionCheck, versionCheckInterval, prCreateIncludeDefaultReviewers","context":{"key":"invalidKey"}}'
    );
  });
});

describe('SetConfigCommand', () => {
  it('should set defaultWorkspace value', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new SetConfigCommand(configService, output);
    await command.execute(
      { key: 'defaultWorkspace', value: 'new-workspace' },
      { globalOptions: {} }
    );

    // Verify value was set
    const config = await configService.getConfig();
    expect(config.defaultWorkspace).toBe('new-workspace');

    expect(output.logs).toContain(
      'success:Set defaultWorkspace = new-workspace'
    );
  });

  it('should reject protected keys like username', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new SetConfigCommand(configService, output);

    await expect(
      command.run({ key: 'username', value: 'newuser' }, { globalOptions: {} })
    ).rejects.toBeDefined();

    expect(output.logs.some((log) => log.includes('Cannot set'))).toBe(true);
  });

  it('should reject protected keys like apiToken', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new SetConfigCommand(configService, output);

    await expect(
      command.run({ key: 'apiToken', value: 'newpass' }, { globalOptions: {} })
    ).rejects.toBeDefined();

    expect(output.logs.some((log) => log.includes('Cannot set'))).toBe(true);
  });

  it('should parse and set skipVersionCheck as boolean', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new SetConfigCommand(configService, output);
    await command.execute(
      { key: 'skipVersionCheck', value: 'true' },
      { globalOptions: {} }
    );

    const config = await configService.getConfig();
    expect(config.skipVersionCheck).toBe(true);
    expect(typeof config.skipVersionCheck).toBe('boolean');
    expect(output.logs).toContain('success:Set skipVersionCheck = true');
  });

  it('should parse and set versionCheckInterval as number', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new SetConfigCommand(configService, output);
    await command.execute(
      { key: 'versionCheckInterval', value: '7' },
      { globalOptions: {} }
    );

    const config = await configService.getConfig();
    expect(config.versionCheckInterval).toBe(7);
    expect(typeof config.versionCheckInterval).toBe('number');
    expect(output.logs).toContain('success:Set versionCheckInterval = 7');
  });

  it('should return typed values in JSON output', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new SetConfigCommand(configService, output);
    await command.execute(
      { key: 'skipVersionCheck', value: 'false' },
      { globalOptions: { json: true } }
    );

    expect(output.logs).toContain(
      'json:{"success":true,"key":"skipVersionCheck","value":false}'
    );
  });

  it('should reject invalid boolean values', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new SetConfigCommand(configService, output);

    await expect(
      command.run(
        { key: 'skipVersionCheck', value: 'maybe' },
        { globalOptions: {} }
      )
    ).rejects.toBeDefined();

    expect(
      output.logs.some((log) =>
        log.includes("Invalid value for 'skipVersionCheck'")
      )
    ).toBe(true);
  });

  it('should reject invalid versionCheckInterval values', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new SetConfigCommand(configService, output);

    await expect(
      command.run(
        { key: 'versionCheckInterval', value: '0' },
        { globalOptions: {} }
      )
    ).rejects.toBeDefined();

    expect(
      output.logs.some((log) =>
        log.includes("Invalid value for 'versionCheckInterval'")
      )
    ).toBe(true);
  });

  it('should reject invalid keys', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new SetConfigCommand(configService, output);

    await expect(
      command.run({ key: 'invalidKey', value: 'value' }, { globalOptions: {} })
    ).rejects.toBeDefined();

    expect(output.logs.some((log) => log.includes('Unknown config key'))).toBe(
      true
    );
    expect(output.logs.some((log) => log.includes('skipVersionCheck'))).toBe(
      true
    );
    expect(
      output.logs.some((log) => log.includes('versionCheckInterval'))
    ).toBe(true);
  });
});

describe('ListConfigCommand', () => {
  it('should list all config values', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      apiToken: 'testpass',
      defaultWorkspace: 'myworkspace',
      skipVersionCheck: true,
      versionCheckInterval: 7,
    });
    const output = createMockOutputService();

    const command = new ListConfigCommand(configService, output);
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('testuser'))).toBe(true);
    expect(output.logs.some((log) => log.includes('myworkspace'))).toBe(true);
    expect(output.logs.some((log) => log.includes('********'))).toBe(true);
    expect(output.logs.some((log) => log.includes('skipVersionCheck'))).toBe(
      true
    );
    expect(
      output.logs.some((log) => log.includes('versionCheckInterval'))
    ).toBe(true);
    expect(output.logs.some((log) => log.includes('true'))).toBe(true);
    expect(output.logs.some((log) => log.includes('7'))).toBe(true);
  });

  it('should output table format', async () => {
    const configService = createMockConfigService({
      username: 'testuser',
      defaultWorkspace: 'myworkspace',
    });
    const output = createMockOutputService();

    const command = new ListConfigCommand(configService, output);
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs.some((log) => log.startsWith('table:'))).toBe(true);
  });

  it('should include false boolean values', async () => {
    const configService = createMockConfigService({
      skipVersionCheck: false,
    });
    const output = createMockOutputService();

    const command = new ListConfigCommand(configService, output);
    await command.execute(undefined, { globalOptions: {} });

    expect(output.logs.some((log) => log.includes('skipVersionCheck'))).toBe(
      true
    );
    expect(output.logs.some((log) => log.includes('false'))).toBe(true);
  });

  it('should return typed values in JSON output', async () => {
    const configService = createMockConfigService({
      apiToken: 'testpass',
      skipVersionCheck: false,
      versionCheckInterval: 3,
    });
    const output = createMockOutputService();

    const command = new ListConfigCommand(configService, output);
    await command.execute(undefined, { globalOptions: { json: true } });

    expect(output.logs).toContain(
      'json:{"configPath":"/tmp/test-config/config.json","config":{"apiToken":"********","skipVersionCheck":false,"versionCheckInterval":3}}'
    );
  });

  it('should coerce legacy string typed values for display', async () => {
    const legacyConfig = {
      skipVersionCheck: 'true',
      versionCheckInterval: '9',
    } as unknown as BBConfig;
    const configService = createMockConfigService(legacyConfig);
    const output = createMockOutputService();

    const command = new ListConfigCommand(configService, output);
    await command.execute(undefined, { globalOptions: { json: true } });

    expect(output.logs).toContain(
      'json:{"configPath":"/tmp/test-config/config.json","config":{"skipVersionCheck":true,"versionCheckInterval":9}}'
    );
  });

  it('should show message when no config is set', async () => {
    const configService = createMockConfigService();
    const output = createMockOutputService();

    const command = new ListConfigCommand(configService, output);
    await command.execute(undefined, { globalOptions: {} });

    expect(
      output.logs.some((log) => log.includes('No configuration set'))
    ).toBe(true);
  });
});
