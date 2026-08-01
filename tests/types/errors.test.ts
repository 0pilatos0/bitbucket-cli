/**
 * Error types tests
 */

import { describe, it, expect } from 'bun:test';
import {
  BBError,
  AuthError,
  APIError,
  GitError,
  ValidationError,
  ErrorCode,
  rethrowWithNotFoundContext,
} from '../../src/types/errors.js';

describe('BBError', () => {
  describe('constructor', () => {
    it('should create error with code and message', () => {
      const error = new BBError({
        code: ErrorCode.AUTH_REQUIRED,
        message: 'Authentication required',
      });

      expect(error.code).toBe(ErrorCode.AUTH_REQUIRED);
      expect(error.message).toBe('Authentication required');
      expect(error.name).toBe('BBError');
    });

    it('should include context when provided', () => {
      const error = new BBError({
        code: ErrorCode.API_REQUEST_FAILED,
        message: 'Request failed',
        context: { url: '/api/test', method: 'GET' },
      });

      expect(error.context).toEqual({ url: '/api/test', method: 'GET' });
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original error');
      const error = new BBError({
        code: ErrorCode.CONFIG_READ_FAILED,
        message: 'Failed to read config',
        cause,
      });

      expect(error.cause).toBe(cause);
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON object', () => {
      const error = new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: 'Field required',
        context: { field: 'username' },
      });

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'BBError',
        code: ErrorCode.VALIDATION_REQUIRED,
        message: 'Field required',
        context: { field: 'username' },
      });
    });

    it('should handle missing context', () => {
      const error = new BBError({
        code: ErrorCode.UNKNOWN,
        message: 'Unknown error',
      });

      const json = error.toJSON();

      expect(json.context).toBeUndefined();
    });
  });
});

describe('AuthError', () => {
  it('should create with default error code', () => {
    const error = new AuthError('Not authenticated');

    expect(error.code).toBe(ErrorCode.AUTH_REQUIRED);
    expect(error.message).toBe('Not authenticated');
    expect(error.name).toBe('AuthError');
  });

  it('should allow custom error code', () => {
    const error = new AuthError('Token expired', ErrorCode.AUTH_EXPIRED);

    expect(error.code).toBe(ErrorCode.AUTH_EXPIRED);
  });

  it('should include context when provided', () => {
    const error = new AuthError('Invalid token', ErrorCode.AUTH_INVALID, {
      tokenType: 'Bearer',
    });

    expect(error.context).toEqual({ tokenType: 'Bearer' });
  });
});

describe('APIError', () => {
  describe('constructor', () => {
    it('should create with status code and response', () => {
      const error = new APIError('Not found', 404, {
        error: 'Resource not found',
      });

      expect(error.statusCode).toBe(404);
      expect(error.response).toEqual({ error: 'Resource not found' });
      expect(error.name).toBe('APIError');
    });

    it('should map 401 to AUTH_INVALID', () => {
      const error = new APIError('Unauthorized', 401);

      expect(error.code).toBe(ErrorCode.AUTH_INVALID);
    });

    it('should map 403 to API_FORBIDDEN', () => {
      const error = new APIError('Forbidden', 403);

      expect(error.code).toBe(ErrorCode.API_FORBIDDEN);
    });

    it('should map 404 to API_NOT_FOUND', () => {
      const error = new APIError('Not found', 404);

      expect(error.code).toBe(ErrorCode.API_NOT_FOUND);
    });

    it('should map 429 to API_RATE_LIMITED', () => {
      const error = new APIError('Too many requests', 429);

      expect(error.code).toBe(ErrorCode.API_RATE_LIMITED);
    });

    it('should map 5xx to API_SERVER_ERROR', () => {
      const error500 = new APIError('Internal server error', 500);
      const error502 = new APIError('Bad gateway', 502);
      const error503 = new APIError('Service unavailable', 503);

      expect(error500.code).toBe(ErrorCode.API_SERVER_ERROR);
      expect(error502.code).toBe(ErrorCode.API_SERVER_ERROR);
      expect(error503.code).toBe(ErrorCode.API_SERVER_ERROR);
    });

    it('should map other 4xx to API_REQUEST_FAILED', () => {
      const error = new APIError('Bad request', 400);

      expect(error.code).toBe(ErrorCode.API_REQUEST_FAILED);
    });

    it('should include context when provided', () => {
      const error = new APIError('Error', 400, null, { url: '/api/test' });

      expect(error.context).toEqual({ url: '/api/test' });
    });
  });
});

describe('GitError', () => {
  it('should create with command and exit code', () => {
    const error = new GitError('Failed to checkout', 'git checkout main', 1);

    expect(error.command).toBe('git checkout main');
    expect(error.exitCode).toBe(1);
    expect(error.code).toBe(ErrorCode.GIT_COMMAND_FAILED);
    expect(error.name).toBe('GitError');
  });

  it('should include command and exit code in context', () => {
    const error = new GitError('Clone failed', 'git clone url', 128);

    expect(error.context).toEqual({
      command: 'git clone url',
      exitCode: 128,
    });
  });
});

describe('ValidationError', () => {
  it('should create with field and message', () => {
    const error = new ValidationError('username', 'Username is required');

    expect(error.field).toBe('username');
    expect(error.message).toBe('Username is required');
    expect(error.code).toBe(ErrorCode.VALIDATION_REQUIRED);
    expect(error.name).toBe('ValidationError');
  });

  it('should include field in context', () => {
    const error = new ValidationError('email', 'Invalid email format');

    expect(error.context).toEqual({ field: 'email' });
  });
});

describe('ErrorCode', () => {
  it('should have authentication errors in 1xxx range', () => {
    expect(ErrorCode.AUTH_REQUIRED).toBe(1001);
    expect(ErrorCode.AUTH_INVALID).toBe(1002);
    expect(ErrorCode.AUTH_EXPIRED).toBe(1003);
  });

  it('should have API errors in 2xxx range', () => {
    expect(ErrorCode.API_REQUEST_FAILED).toBe(2001);
    expect(ErrorCode.API_NOT_FOUND).toBe(2002);
    expect(ErrorCode.API_FORBIDDEN).toBe(2003);
    expect(ErrorCode.API_RATE_LIMITED).toBe(2004);
    expect(ErrorCode.API_SERVER_ERROR).toBe(2005);
  });

  it('should have Git errors in 3xxx range', () => {
    expect(ErrorCode.GIT_NOT_REPOSITORY).toBe(3001);
    expect(ErrorCode.GIT_COMMAND_FAILED).toBe(3002);
    expect(ErrorCode.GIT_REMOTE_NOT_FOUND).toBe(3003);
  });

  it('should have config errors in 4xxx range', () => {
    expect(ErrorCode.CONFIG_READ_FAILED).toBe(4001);
    expect(ErrorCode.CONFIG_WRITE_FAILED).toBe(4002);
    expect(ErrorCode.CONFIG_INVALID_KEY).toBe(4003);
  });

  it('should have validation errors in 5xxx range', () => {
    expect(ErrorCode.VALIDATION_REQUIRED).toBe(5001);
    expect(ErrorCode.VALIDATION_INVALID).toBe(5002);
    expect(ErrorCode.FILE_NOT_FOUND).toBe(5003);
  });

  it('should have context errors in 6xxx range', () => {
    expect(ErrorCode.CONTEXT_REPO_NOT_FOUND).toBe(6001);
    expect(ErrorCode.CONTEXT_WORKSPACE_NOT_FOUND).toBe(6002);
  });

  it('should have completion errors in 9xxx range', () => {
    expect(ErrorCode.COMPLETION_INSTALL_FAILED).toBe(9001);
    expect(ErrorCode.COMPLETION_UNINSTALL_FAILED).toBe(9002);
  });

  it('should have unknown error as 9999', () => {
    expect(ErrorCode.UNKNOWN).toBe(9999);
  });
});

describe('APIError.statusToErrorCode mapping', () => {
  // Exhaustive mapping table. A regression here means user-visible error
  // codes (and therefore machine-readable behavior of `--json`) shifted,
  // so we pin every documented status we care about.
  const MAP: Array<[number, ErrorCode, string]> = [
    [401, ErrorCode.AUTH_INVALID, '401 → AUTH_INVALID'],
    [403, ErrorCode.API_FORBIDDEN, '403 → API_FORBIDDEN'],
    [404, ErrorCode.API_NOT_FOUND, '404 → API_NOT_FOUND'],
    [429, ErrorCode.API_RATE_LIMITED, '429 → API_RATE_LIMITED'],
    [400, ErrorCode.API_REQUEST_FAILED, '400 → API_REQUEST_FAILED'],
    [402, ErrorCode.API_REQUEST_FAILED, '402 → API_REQUEST_FAILED'],
    [409, ErrorCode.API_REQUEST_FAILED, '409 → API_REQUEST_FAILED'],
    [418, ErrorCode.API_REQUEST_FAILED, '418 → API_REQUEST_FAILED (teapot)'],
    [500, ErrorCode.API_SERVER_ERROR, '500 → API_SERVER_ERROR'],
    [502, ErrorCode.API_SERVER_ERROR, '502 → API_SERVER_ERROR'],
    [503, ErrorCode.API_SERVER_ERROR, '503 → API_SERVER_ERROR'],
    [504, ErrorCode.API_SERVER_ERROR, '504 → API_SERVER_ERROR'],
    [599, ErrorCode.API_SERVER_ERROR, '599 → API_SERVER_ERROR'],
  ];

  it.each(MAP)('status %i maps to %i (%s)', (status, expected) => {
    const error = new APIError('test', status);
    expect(error.code).toBe(expected);
    expect(error.statusCode).toBe(status);
  });

  it('preserves the response payload on the error', () => {
    const payload = { error: { message: 'Not found', fields: ['id'] } };
    const error = new APIError('Not found', 404, payload);
    expect(error.response).toBe(payload);
  });

  it('is serializable via BBError.toJSON', () => {
    const error = new APIError('boom', 500, null, { url: '/x' });
    const json = error.toJSON();
    expect(json.code).toBe(ErrorCode.API_SERVER_ERROR);
    expect(json.message).toBe('boom');
    expect(json.context).toEqual({ url: '/x' });
    // toJSON() includes statusCode so `--json` error output (notably from
    // `bb api`) carries the HTTP status. A null response is omitted.
    expect(json.statusCode).toBe(500);
    expect(json).not.toHaveProperty('response');
  });

  it('includes the response payload in toJSON when present', () => {
    const payload = { error: { message: 'Not found' } };
    const json = new APIError('Not found', 404, payload).toJSON();
    expect(json.statusCode).toBe(404);
    expect(json.response).toEqual(payload);
  });

  describe('contextualized flag', () => {
    it('defaults to false', () => {
      expect(new APIError('boom', 404).contextualized).toBe(false);
    });

    it('is set by rethrowWithNotFoundContext', () => {
      expect(() =>
        rethrowWithNotFoundContext(new APIError('boom', 404), 'PR not found')
      ).toThrow('PR not found');

      try {
        rethrowWithNotFoundContext(new APIError('boom', 404), 'PR not found');
      } catch (error) {
        expect((error as APIError).contextualized).toBe(true);
      }
    });

    it('is NOT serialized — it is internal rendering state', () => {
      const json = new APIError('boom', 404, null, undefined, {
        contextualized: true,
      }).toJSON();

      expect(json).not.toHaveProperty('contextualized');
      expect(Object.keys(json).sort()).toEqual([
        'code',
        'context',
        'message',
        'name',
        'statusCode',
      ]);
    });
  });
});

describe('BBError serialization shape', () => {
  it('toJSON returns exactly {name, code, message, context}', () => {
    const error = new BBError({
      code: ErrorCode.UNKNOWN,
      message: 'msg',
      context: { k: 'v' },
    });
    const json = error.toJSON();
    expect(Object.keys(json).sort()).toEqual([
      'code',
      'context',
      'message',
      'name',
    ]);
  });

  it('is an instance of Error for try/catch interop', () => {
    const error = new BBError({
      code: ErrorCode.UNKNOWN,
      message: 'msg',
    });
    expect(error).toBeInstanceOf(Error);
    // Error.cause must be preserved when provided.
    const rootCause = new Error('root');
    const wrapped = new BBError({
      code: ErrorCode.NETWORK_ERROR,
      message: 'wrapped',
      cause: rootCause,
    });
    expect(wrapped.cause).toBe(rootCause);
  });

  it('JSON.stringify uses toJSON() for BBError instances', () => {
    const error = new BBError({
      code: ErrorCode.AUTH_INVALID,
      message: 'nope',
    });
    const serialized = JSON.parse(JSON.stringify(error));
    expect(serialized).toMatchObject({
      name: 'BBError',
      code: ErrorCode.AUTH_INVALID,
      message: 'nope',
    });
  });
});

describe('Subclass identity', () => {
  it('every subclass is also a BBError', () => {
    expect(new AuthError('x')).toBeInstanceOf(BBError);
    expect(new APIError('x', 500)).toBeInstanceOf(BBError);
    expect(new GitError('x', 'git status', 1)).toBeInstanceOf(BBError);
    expect(new ValidationError('field', 'required')).toBeInstanceOf(BBError);
  });

  it('every subclass is an Error (JS built-in)', () => {
    expect(new AuthError('x')).toBeInstanceOf(Error);
    expect(new APIError('x', 500)).toBeInstanceOf(Error);
    expect(new GitError('x', 'git status', 1)).toBeInstanceOf(Error);
    expect(new ValidationError('field', 'required')).toBeInstanceOf(Error);
  });

  it('preserves its class name after JSON round-trip', () => {
    const cases: Array<{ instance: BBError; name: string }> = [
      { instance: new AuthError('x'), name: 'AuthError' },
      { instance: new APIError('x', 500), name: 'APIError' },
      { instance: new GitError('x', 'git status', 1), name: 'GitError' },
      {
        instance: new ValidationError('field', 'required'),
        name: 'ValidationError',
      },
    ];
    for (const { instance, name } of cases) {
      expect(instance.name).toBe(name);
      expect(instance.toJSON().name).toBe(name);
    }
  });
});
