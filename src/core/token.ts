/**
 * Typed service tokens for the DI container
 */

declare const tokenType: unique symbol;

/**
 * A service token: the registration key string, branded with the type it
 * resolves to so `register`/`resolve` and constructor wiring are type-checked.
 */
export type Token<T> = string & { readonly [tokenType]: T };

/** The type a token resolves to. */
export type TokenType<K extends Token<unknown>> = K[typeof tokenType];

/** Maps a constructor's parameter list to the tokens that supply it. */
export type DependencyTokens<TArgs extends readonly unknown[]> = {
  readonly [I in keyof TArgs]: Token<TArgs[I]>;
};

export function token<T>(name: string): Token<T> {
  return name as Token<T>;
}
