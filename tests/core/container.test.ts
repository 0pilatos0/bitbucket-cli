/**
 * Container tests
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Container, token } from '../../src/core/container.js';

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    Container.reset();
    container = Container.getInstance();
  });

  describe('getInstance', () => {
    it('should return same instance', () => {
      const instance1 = Container.getInstance();
      const instance2 = Container.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should return new instance after reset', () => {
      const instance1 = Container.getInstance();
      Container.reset();
      const instance2 = Container.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('register', () => {
    it('should register and resolve a service', () => {
      container.register(token('TestService'), () => ({ value: 42 }));

      const service = container.resolve<{ value: number }>(
        token('TestService')
      );

      expect(service.value).toBe(42);
    });

    it('should return same instance for singleton (default)', () => {
      let callCount = 0;
      container.register(token('TestService'), () => {
        callCount++;
        return { id: callCount };
      });

      const service1 = container.resolve<{ id: number }>(token('TestService'));
      const service2 = container.resolve<{ id: number }>(token('TestService'));

      expect(service1).toBe(service2);
      expect(service1.id).toBe(1);
      expect(callCount).toBe(1);
    });

    it('should return new instance when singleton is false', () => {
      let callCount = 0;
      container.register(
        token('TestService'),
        () => {
          callCount++;
          return { id: callCount };
        },
        { singleton: false }
      );

      const service1 = container.resolve<{ id: number }>(token('TestService'));
      const service2 = container.resolve<{ id: number }>(token('TestService'));

      expect(service1).not.toBe(service2);
      expect(service1.id).toBe(1);
      expect(service2.id).toBe(2);
    });
  });

  describe('registerInstance', () => {
    it('should register an existing instance', () => {
      const instance = { value: 'test' };
      container.registerInstance(token('TestService'), instance);

      const resolved = container.resolve<{ value: string }>(
        token('TestService')
      );

      expect(resolved).toBe(instance);
    });
  });

  describe('resolveAll', () => {
    it('should resolve tokens positionally for constructor injection', () => {
      class Dependency {
        getValue() {
          return 42;
        }
      }

      class Service {
        constructor(
          public dep: Dependency,
          public label: string
        ) {}
      }

      const DependencyToken = token<Dependency>('Dependency');
      const LabelToken = token<string>('Label');
      container.register(DependencyToken, () => new Dependency());
      container.registerInstance(LabelToken, 'svc');

      const service = new Service(
        ...container.resolveAll<ConstructorParameters<typeof Service>>([
          DependencyToken,
          LabelToken,
        ])
      );

      expect(service.dep.getValue()).toBe(42);
      expect(service.label).toBe('svc');
    });
  });

  describe('resolve', () => {
    it('should throw for unregistered service', () => {
      expect(() => {
        container.resolve(token('NonExistent'));
      }).toThrow('Service not registered: NonExistent');
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
  });

  describe('clear', () => {
    it('should remove all services', () => {
      container.register(token('Service1'), () => ({}));
      container.register(token('Service2'), () => ({}));

      container.clear();

      expect(container.has(token('Service1'))).toBe(false);
      expect(container.has(token('Service2'))).toBe(false);
    });
  });
});
