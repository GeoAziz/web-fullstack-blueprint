/**
 * Custom Error Classes
 * Standardized error handling throughout the system
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);

    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

export class ValidationError extends AppError {
  public readonly details: Record<string, any>;

  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
    this.details = details;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds: number) {
    super('Rate limit exceeded', 'RATE_LIMIT', 429);
    Object.setPrototypeOf(this, RateLimitError.prototype);
    this.details = { retryAfterSeconds };
  }

  details: Record<string, any>;
}

export class TimeoutError extends AppError {
  constructor(operation: string, timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms`, 'TIMEOUT', 408);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500, false);
    Object.setPrototypeOf(this, DatabaseError.prototype);
    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

export class ExternalServiceError extends AppError {
  constructor(serviceName: string, message: string) {
    super(`External service error [${serviceName}]: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, false);
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

export class FileNotFoundError extends AppError {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`, 'FILE_NOT_FOUND', 404);
    Object.setPrototypeOf(this, FileNotFoundError.prototype);
  }
}
