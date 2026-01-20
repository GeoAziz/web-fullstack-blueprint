/**
 * Custom Error Classes
 * Standardized error handling throughout the system
 */
export declare class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly timestamp: Date;
    constructor(message: string, code?: string, statusCode?: number, isOperational?: boolean);
    toJSON(): {
        message: string;
        code: string;
        statusCode: number;
        timestamp: Date;
    };
}
export declare class ValidationError extends AppError {
    readonly details: Record<string, any>;
    constructor(message: string, details?: Record<string, any>);
    toJSON(): {
        details: Record<string, any>;
        message: string;
        code: string;
        statusCode: number;
        timestamp: Date;
    };
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, id: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class RateLimitError extends AppError {
    constructor(retryAfterSeconds: number);
    details: Record<string, any>;
}
export declare class TimeoutError extends AppError {
    constructor(operation: string, timeoutMs: number);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, originalError?: Error);
}
export declare class ExternalServiceError extends AppError {
    constructor(serviceName: string, message: string);
}
export declare class FileNotFoundError extends AppError {
    constructor(filePath: string);
}
//# sourceMappingURL=errors.d.ts.map