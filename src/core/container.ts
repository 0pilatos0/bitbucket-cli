/**
 * Dependency Injection Container
 * Simple IoC container for managing service dependencies
 */

import type { DependencyTokens, Token } from './token.js';

type Factory<T> = () => T;

interface ServiceRegistration<T> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}

export class Container {
  private readonly services = new Map<string, ServiceRegistration<unknown>>();
  private static instance: Container | null = null;

  /**
   * Get the singleton container instance
   */
  public static getInstance(): Container {
    Container.instance ??= new Container();
    return Container.instance;
  }

  /**
   * Reset the container (useful for testing)
   */
  public static reset(): void {
    Container.instance = null;
  }

  /**
   * Register a service with a factory function
   */
  public register<T>(
    token: Token<T>,
    factory: Factory<T>,
    options: { singleton?: boolean } = {}
  ): this {
    this.services.set(token, {
      factory,
      singleton: options.singleton ?? true,
    });
    return this;
  }

  /**
   * Register a service instance directly
   */
  public registerInstance<T>(token: Token<T>, instance: T): this {
    this.services.set(token, {
      factory: () => instance,
      singleton: true,
      instance,
    });
    return this;
  }

  /**
   * Resolve a service by token
   */
  public resolve<T>(token: Token<T>): T {
    const registration = this.services.get(token);

    if (!registration) {
      throw new Error(`Service not registered: ${token}`);
    }

    if (registration.singleton) {
      if (!registration.instance) {
        registration.instance = registration.factory();
      }
      return registration.instance as T;
    }

    return registration.factory() as T;
  }

  /**
   * Resolve a list of tokens, keeping each position's type
   */
  public resolveAll<TArgs extends readonly unknown[]>(
    tokens: DependencyTokens<TArgs>
  ): TArgs {
    return tokens.map((dep) => this.resolve(dep)) as unknown as TArgs;
  }

  /**
   * Check if a service is registered
   */
  public has(token: Token<unknown>): boolean {
    return this.services.has(token);
  }

  /**
   * Clear all registrations
   */
  public clear(): void {
    this.services.clear();
  }
}

export * from './token.js';
export * from './service-tokens.js';
