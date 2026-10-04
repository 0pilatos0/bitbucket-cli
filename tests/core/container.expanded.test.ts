/**
 * Extended Container tests
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Container, ServiceTokens, token } from '../../src/core/container.js';

describe('Container - Extended Tests', () => {
  let container: Container;

  beforeEach(() => {
    Container.reset();
    container = Container.getInstance();
  });

  describe('Dependency Injection Patterns', () => {
    it('should handle deep dependency chains', () => {
      // Level 1
      container.register(token('Database'), () => ({ name: 'PostgreSQL' }));

      // Level 2 - depends on Level 1
      container.register(token('UserStore'), () => ({
        db: container.resolve<{ name: string }>(token('Database')),
        getUser: () => 'user',
      }));

      // Level 3 - depends on Level 2
      container.register(token('AuthService'), () => ({
        userStore: container.resolve<{ getUser: () => string }>(
          token('UserStore')
        ),
        authenticate: () => true,
      }));

      // Level 4 - depends on Level 3
      container.register(token('Controller'), () => ({
        auth: container.resolve<{ authenticate: () => boolean }>(
          token('AuthService')
        ),
        handle: () => 'handled',
      }));

      const controller = container.resolve<{
        auth: { authenticate: () => boolean };
        handle: () => string;
      }>(token('Controller'));

      expect(controller.handle()).toBe('handled');
      expect(controller.auth.authenticate()).toBe(true);
    });

    it('should handle circular dependencies through lazy resolution', () => {
      // This is allowed because resolution happens at runtime
      container.register(token('ServiceA'), () => ({
        name: 'A',
        getB: () => container.resolve<{ name: string }>(token('ServiceB')),
      }));

      container.register(token('ServiceB'), () => ({
        name: 'B',
        getA: () => container.resolve<{ name: string }>(token('ServiceA')),
      }));

      const serviceA = container.resolve<{
        name: string;
        getB: () => { name: string };
      }>(token('ServiceA'));

      expect(serviceA.name).toBe('A');
      expect(serviceA.getB().name).toBe('B');
    });

    it('should support factory pattern with parameters', () => {
      container.register(token('LoggerFactory'), () => ({
        create: (name: string) => ({
          log: (msg: string) => `[${name}] ${msg}`,
        }),
      }));

      const factory = container.resolve<{
        create: (name: string) => { log: (msg: string) => string };
      }>(token('LoggerFactory'));

      const logger1 = factory.create('App');
      const logger2 = factory.create('Database');

      expect(logger1.log('test')).toBe('[App] test');
      expect(logger2.log('query')).toBe('[Database] query');
    });
  });

  describe('Singleton vs Transient', () => {
    it('should create exactly one instance for singleton', () => {
      let instanceCount = 0;

      container.register(token('SingletonService'), () => {
        instanceCount++;
        return { id: instanceCount };
      });

      container.resolve(token('SingletonService'));
      container.resolve(token('SingletonService'));
      container.resolve(token('SingletonService'));

      expect(instanceCount).toBe(1);
    });

    it('should create new instance each time for transient', () => {
      let instanceCount = 0;

      container.register(
        token('TransientService'),
        () => {
          instanceCount++;
          return { id: instanceCount };
        },
        { singleton: false }
      );

      const s1 = container.resolve<{ id: number }>(token('TransientService'));
      const s2 = container.resolve<{ id: number }>(token('TransientService'));
      const s3 = container.resolve<{ id: number }>(token('TransientService'));

      expect(instanceCount).toBe(3);
      expect(s1.id).toBe(1);
      expect(s2.id).toBe(2);
      expect(s3.id).toBe(3);
    });

    it('should share singleton across different dependents', () => {
      let configCallCount = 0;

      container.register(token('Config'), () => {
        configCallCount++;
        return { env: 'production' };
      });

      container.register(token('ServiceA'), () => ({
        config: container.resolve(token('Config')),
      }));

      container.register(token('ServiceB'), () => ({
        config: container.resolve(token('Config')),
      }));

      container.resolve(token('ServiceA'));
      container.resolve(token('ServiceB'));

      expect(configCallCount).toBe(1);
    });
  });

  describe('registerInstance', () => {
    it('should register a pre-existing instance', () => {
      const instance = { value: 42, created: new Date() };

      container.registerInstance(token('MyInstance'), instance);

      const resolved = container.resolve(token('MyInstance'));
      expect(resolved).toBe(instance);
    });

    it('should always return the same instance', () => {
      const instance = { count: 0 };
      container.registerInstance(token('Counter'), instance);

      const resolved1 = container.resolve<{ count: number }>(token('Counter'));
      resolved1.count++;

      const resolved2 = container.resolve<{ count: number }>(token('Counter'));

      expect(resolved2.count).toBe(1);
      expect(resolved1).toBe(resolved2);
    });
  });

  describe('has', () => {
    it('should return true for registered service', () => {
      container.register(token('TestService'), () => ({}));

      expect(container.has(token('TestService'))).toBe(true);
    });

    it('should return false for unregistered service', () => {
      expect(container.has(token('NonExistent'))).toBe(false);
    });

    it('should return true after registerInstance', () => {
      container.registerInstance(token('Instance'), { value: 1 });

      expect(container.has(token('Instance'))).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all registered services', () => {
      container.register(token('Service1'), () => ({}));
      container.register(token('Service2'), () => ({}));
      container.register(token('Service3'), () => ({}));

      container.clear();

      expect(container.has(token('Service1'))).toBe(false);
      expect(container.has(token('Service2'))).toBe(false);
      expect(container.has(token('Service3'))).toBe(false);
    });

    it('should clear singleton instances', () => {
      let callCount = 0;
      container.register(token('Service'), () => {
        callCount++;
        return {};
      });

      container.resolve(token('Service'));
      expect(callCount).toBe(1);

      container.clear();

      // Re-register and resolve
      container.register(token('Service'), () => {
        callCount++;
        return {};
      });
      container.resolve(token('Service'));
      expect(callCount).toBe(2);
    });
  });

  describe('reset (static)', () => {
    it('should create a new container instance', () => {
      const instance1 = Container.getInstance();
      instance1.register(token('Test'), () => ({}));

      Container.reset();
      const instance2 = Container.getInstance();

      expect(instance1).not.toBe(instance2);
      expect(instance2.has(token('Test'))).toBe(false);
    });

    it('should not affect services registered after reset', () => {
      container.register(token('OldService'), () => ({}));

      Container.reset();
      const newContainer = Container.getInstance();
      newContainer.register(token('NewService'), () => ({}));

      expect(newContainer.has(token('OldService'))).toBe(false);
      expect(newContainer.has(token('NewService'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive error for unregistered service', () => {
      expect(() => {
        container.resolve(token('UnknownService'));
      }).toThrow('Service not registered: UnknownService');
    });

    it('should include service name in error message', () => {
      try {
        container.resolve(token('MySpecificService'));
      } catch (e) {
        expect((e as Error).message).toContain('MySpecificService');
      }
    });
  });

  describe('ServiceTokens', () => {
    it('should have defined tokens for core services', () => {
      expect<string>(ServiceTokens.ConfigService).toBe('ConfigService');
      expect<string>(ServiceTokens.GitService).toBe('GitService');
      expect<string>(ServiceTokens.OutputService).toBe('OutputService');
    });

    it('should have defined tokens for API clients', () => {
      expect<string>(ServiceTokens.PullrequestsApi).toBe('PullrequestsApi');
      expect<string>(ServiceTokens.RepositoriesApi).toBe('RepositoriesApi');
      expect<string>(ServiceTokens.UsersApi).toBe('UsersApi');
    });

    it('should have defined tokens for commands', () => {
      expect<string>(ServiceTokens.LoginCommand).toBe('LoginCommand');
      expect<string>(ServiceTokens.LogoutCommand).toBe('LogoutCommand');
      expect<string>(ServiceTokens.ListReposCommand).toBe('ListReposCommand');
    });
  });

  describe('Method Chaining', () => {
    it('should support chained registration', () => {
      container
        .register(token('Service1'), () => ({ name: 'one' }))
        .register(token('Service2'), () => ({ name: 'two' }))
        .register(token('Service3'), () => ({ name: 'three' }));

      expect(container.has(token('Service1'))).toBe(true);
      expect(container.has(token('Service2'))).toBe(true);
      expect(container.has(token('Service3'))).toBe(true);
    });
  });
});
