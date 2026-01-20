"use strict";
/**
 * Custom Error Classes
 * Standardized error handling throughout the system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileNotFoundError = exports.ExternalServiceError = exports.DatabaseError = exports.TimeoutError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, isOperational = true) {
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
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details = {}) {
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
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource, id) {
        super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(message, 'CONFLICT', 409);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(retryAfterSeconds) {
        super('Rate limit exceeded', 'RATE_LIMIT', 429);
        Object.setPrototypeOf(this, RateLimitError.prototype);
        this.details = { retryAfterSeconds };
    }
}
exports.RateLimitError = RateLimitError;
class TimeoutError extends AppError {
    constructor(operation, timeoutMs) {
        super(`${operation} timed out after ${timeoutMs}ms`, 'TIMEOUT', 408);
        Object.setPrototypeOf(this, TimeoutError.prototype);
    }
}
exports.TimeoutError = TimeoutError;
class DatabaseError extends AppError {
    constructor(message, originalError) {
        super(message, 'DATABASE_ERROR', 500, false);
        Object.setPrototypeOf(this, DatabaseError.prototype);
        if (originalError) {
            this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
        }
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends AppError {
    constructor(serviceName, message) {
        super(`External service error [${serviceName}]: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, false);
        Object.setPrototypeOf(this, ExternalServiceError.prototype);
    }
}
exports.ExternalServiceError = ExternalServiceError;
class FileNotFoundError extends AppError {
    constructor(filePath) {
        super(`File not found: ${filePath}`, 'FILE_NOT_FOUND', 404);
        Object.setPrototypeOf(this, FileNotFoundError.prototype);
    }
}
exports.FileNotFoundError = FileNotFoundError;
//# sourceMappingURL=errors.js.map