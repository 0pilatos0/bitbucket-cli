/**
 * Extended Container tests
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Container, ServiceTokens } from '../../src/core/container.js';

describe('Container - Extended Tests', () => {
  let container: Container;

  beforeEach(() => {
    Container.reset();
    container = Container.getInstance();
  });

  describe('Dependency Injection Patterns', () => {
    it('should handle deep dependency chains', () => {
      // Level 1
      container.register('Database', () => ({ name: 'PostgreSQL' }));

      // Level 2 - depends on Level 1
      container.register('UserStore', () => ({
        db: container.resolve<{ name: string }>('Database'),
        getUser: () => 'user',
      }));

      // Level 3 - depends on Level 2
      container.register('AuthService', () => ({
        userStore: container.resolve<{ getUser: () => string }>('UserStore'),
        authenticate: () => true,
      }));

      // Level 4 - depends on Level 3
      container.register('Controller', () => ({
        auth: container.resolve<{ authenticate: () => boolean }>('AuthService'),
        handle: () => 'handled',
      }));

      const controller = container.resolve<{
        auth: { authenticate: () => boolean };
        handle: () => string;
      }>('Controller');

      expect(controller.handle()).toBe('handled');
      expect(controller.auth.authenticate()).toBe(true);
    });

    it('should handle circular dependencies through lazy resolution', () => {
      // This is allowed because resolution happens at runtime
      container.register('ServiceA', () => ({
        name: 'A',
        getB: () => container.resolve<{ name: string }>('ServiceB'),
      }));

      container.register('ServiceB', () => ({
        name: 'B',
        getA: () => container.resolve<{ name: string }>('ServiceA'),
      }));

      const serviceA = container.resolve<{
        name: string;
        getB: () => { name: string };
      }>('ServiceA');

      expect(serviceA.name).toBe('A');
      expect(serviceA.getB().name).toBe('B');
    });

    it('should support factory pattern with parameters', () => {
      container.register('LoggerFactory', () => ({
        create: (name: string) => ({
          log: (msg: string) => `[${name}] ${msg}`,
        }),
      }));

      const factory = container.resolve<{
        create: (name: string) => { log: (msg: string) => string };
      }>('LoggerFactory');

      const logger1 = factory.create('App');
      const logger2 = factory.create('Database');

      expect(logger1.log('test')).toBe('[App] test');
      expect(logger2.log('query')).toBe('[Database] query');
    });
  });

  describe('Singleton vs Transient', () => {
    it('should create exactly one instance for singleton', () => {
      let instanceCount = 0;

      container.register('SingletonService', () => {
        instanceCount++;
        return { id: instanceCount };
      });

      container.resolve('SingletonService');
      container.resolve('SingletonService');
      container.resolve('SingletonService');

      expect(instanceCount).toBe(1);
    });

    it('should create new instance each time for transient', () => {
      let instanceCount = 0;

      container.register(
        'TransientService',
        () => {
          instanceCount++;
          return { id: instanceCount };
        },
        { singleton: false }
      );

      const s1 = container.resolve<{ id: number }>('TransientService');
      const s2 = container.resolve<{ id: number }>('TransientService');
      const s3 = container.resolve<{ id: number }>('TransientService');

      expect(instanceCount).toBe(3);
      expect(s1.id).toBe(1);
      expect(s2.id).toBe(2);
      expect(s3.id).toBe(3);
    });

    it('should share singleton across different dependents', () => {
      let configCallCount = 0;

      container.register('Config', () => {
        configCallCount++;
        return { env: 'production' };
      });

      container.register('ServiceA', () => ({
        config: container.resolve('Config'),
      }));

      container.register('ServiceB', () => ({
        config: container.resolve('Config'),
      }));

      container.resolve('ServiceA');
      container.resolve('ServiceB');

      expect(configCallCount).toBe(1);
    });
  });

  describe('registerInstance', () => {
    it('should register a pre-existing instance', () => {
      const instance = { value: 42, created: new Date() };

      container.registerInstance('MyInstance', instance);

      const resolved = container.resolve('MyInstance');
      expect(resolved).toBe(instance);
    });

    it('should always return the same instance', () => {
      const instance = { count: 0 };
      container.registerInstance('Counter', instance);

      const resolved1 = container.resolve<{ count: number }>('Counter');
      resolved1.count++;

      const resolved2 = container.resolve<{ count: number }>('Counter');

      expect(resolved2.count).toBe(1);
      expect(resolved1).toBe(resolved2);
    });
  });

  describe('has', () => {
    it('should return true for registered service', () => {
      container.register('TestService', () => ({}));

      expect(container.has('TestService')).toBe(true);
    });

    it('should return false for unregistered service', () => {
      expect(container.has('NonExistent')).toBe(false);
    });

    it('should return true after registerInstance', () => {
      container.registerInstance('Instance', { value: 1 });

      expect(container.has('Instance')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all registered services', () => {
      container.register('Service1', () => ({}));
      container.register('Service2', () => ({}));
      container.register('Service3', () => ({}));

      container.clear();

      expect(container.has('Service1')).toBe(false);
      expect(container.has('Service2')).toBe(false);
      expect(container.has('Service3')).toBe(false);
    });

    it('should clear singleton instances', () => {
      let callCount = 0;
      container.register('Service', () => {
        callCount++;
        return {};
      });

      container.resolve('Service');
      expect(callCount).toBe(1);

      container.clear();

      // Re-register and resolve
      container.register('Service', () => {
        callCount++;
        return {};
      });
      container.resolve('Service');
      expect(callCount).toBe(2);
    });
  });

  describe('reset (static)', () => {
    it('should create a new container instance', () => {
      const instance1 = Container.getInstance();
      instance1.register('Test', () => ({}));

      Container.reset();
      const instance2 = Container.getInstance();

      expect(instance1).not.toBe(instance2);
      expect(instance2.has('Test')).toBe(false);
    });

    it('should not affect services registered after reset', () => {
      container.register('OldService', () => ({}));

      Container.reset();
      const newContainer = Container.getInstance();
      newContainer.register('NewService', () => ({}));

      expect(newContainer.has('OldService')).toBe(false);
      expect(newContainer.has('NewService')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive error for unregistered service', () => {
      expect(() => {
        container.resolve('UnknownService');
      }).toThrow('Service not registered: UnknownService');
    });

    it('should include service name in error message', () => {
      try {
        container.resolve('MySpecificService');
      } catch (e) {
        expect((e as Error).message).toContain('MySpecificService');
      }
    });
  });

  describe('ServiceTokens', () => {
    it('should have defined tokens for core services', () => {
      expect(ServiceTokens.ConfigService).toBe('ConfigService');
      expect(ServiceTokens.GitService).toBe('GitService');
      expect(ServiceTokens.OutputService).toBe('OutputService');
    });

    it('should have defined tokens for API clients', () => {
      expect(ServiceTokens.PullrequestsApi).toBe('PullrequestsApi');
      expect(ServiceTokens.RepositoriesApi).toBe('RepositoriesApi');
      expect(ServiceTokens.UsersApi).toBe('UsersApi');
    });

    it('should have defined tokens for commands', () => {
      expect(ServiceTokens.LoginCommand).toBe('LoginCommand');
      expect(ServiceTokens.LogoutCommand).toBe('LogoutCommand');
      expect(ServiceTokens.ListReposCommand).toBe('ListReposCommand');
    });
  });

  describe('Method Chaining', () => {
    it('should support chained registration', () => {
      container
        .register('Service1', () => ({ name: 'one' }))
        .register('Service2', () => ({ name: 'two' }))
        .register('Service3', () => ({ name: 'three' }));

      expect(container.has('Service1')).toBe(true);
      expect(container.has('Service2')).toBe(true);
      expect(container.has('Service3')).toBe(true);
    });
  });
});
