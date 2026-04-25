/**
 * Typed error system with error codes for better error handling
 */

export enum ErrorCode {
  // Authentication errors (1xxx)
  AUTH_REQUIRED = 1001,
  AUTH_INVALID = 1002,
  AUTH_EXPIRED = 1003,

  // API errors (2xxx)
  API_REQUEST_FAILED = 2001,
  API_NOT_FOUND = 2002,
  API_FORBIDDEN = 2003,
  API_RATE_LIMITED = 2004,
  API_SERVER_ERROR = 2005,

  // Git errors (3xxx)
  GIT_NOT_REPOSITORY = 3001,
  GIT_COMMAND_FAILED = 3002,
  GIT_REMOTE_NOT_FOUND = 3003,

  // Config errors (4xxx)
  CONFIG_READ_FAILED = 4001,
  CONFIG_WRITE_FAILED = 4002,
  CONFIG_INVALID_KEY = 4003,

  // Validation errors (5xxx)
  VALIDATION_REQUIRED = 5001,
  VALIDATION_INVALID = 5002,
  FILE_NOT_FOUND = 5003,

  // Context errors (6xxx)
  CONTEXT_REPO_NOT_FOUND = 6001,
  CONTEXT_WORKSPACE_NOT_FOUND = 6002,

  // Network errors (7xxx)
  NETWORK_ERROR = 7001,

  // Output formatting errors (8xxx)
  JQ_FAILED = 8001,
  JSON_FORMAT_INVALID = 8002,

  // Completion errors (9xxx, before UNKNOWN)
  COMPLETION_INSTALL_FAILED = 9001,
  COMPLETION_UNINSTALL_FAILED = 9002,

  // Unknown
  UNKNOWN = 9999,
}

export interface BBErrorDetails {
  code: ErrorCode;
  message: string;
  cause?: Error;
  context?: Record<string, unknown>;
}

export class BBError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: Record<string, unknown>;

  constructor(details: BBErrorDetails) {
    super(details.message);
    this.name = 'BBError';
    this.code = details.code;
    this.context = details.context;
    if (details.cause) {
      this.cause = details.cause;
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    };
  }
}

export class AuthError extends BBError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.AUTH_REQUIRED,
    context?: Record<string, unknown>
  ) {
    super({ code, message, context });
    this.name = 'AuthError';
  }
}

export class APIError extends BBError {
  public readonly statusCode: number;
  public readonly response?: unknown;

  constructor(
    message: string,
    statusCode: number,
    response?: unknown,
    context?: Record<string, unknown>
  ) {
    const code = APIError.statusToErrorCode(statusCode);
    super({ code, message, context });
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.response = response;
  }

  private static statusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 401:
        return ErrorCode.AUTH_INVALID;
      case 403:
        return ErrorCode.API_FORBIDDEN;
      case 404:
        return ErrorCode.API_NOT_FOUND;
      case 429:
        return ErrorCode.API_RATE_LIMITED;
      default:
        return status >= 500
          ? ErrorCode.API_SERVER_ERROR
          : ErrorCode.API_REQUEST_FAILED;
    }
  }
}

/**
 * If `error` is a 404 APIError, replace its message with a contextual one
 * that names the missing resource. Other errors are rethrown unchanged.
 */
export function rethrowWithNotFoundContext(
  error: unknown,
  notFoundMessage: string
): never {
  if (error instanceof APIError && error.statusCode === 404) {
    throw new APIError(notFoundMessage, 404, error.response, error.context);
  }
  throw error;
}

export class GitError extends BBError {
  public readonly command: string;
  public readonly exitCode: number;

  constructor(message: string, command: string, exitCode: number) {
    super({
      code: ErrorCode.GIT_COMMAND_FAILED,
      message,
      context: { command, exitCode },
    });
    this.name = 'GitError';
    this.command = command;
    this.exitCode = exitCode;
  }
}

export class ValidationError extends BBError {
  public readonly field: string;

  constructor(field: string, message: string) {
    super({
      code: ErrorCode.VALIDATION_REQUIRED,
      message,
      context: { field },
    });
    this.name = 'ValidationError';
    this.field = field;
  }
}
