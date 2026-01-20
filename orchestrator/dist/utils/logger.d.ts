/**
 * Logging Service
 * Winston-based centralized logging with structured output
 */
export declare class Logger {
    private component;
    constructor(component: string);
    private createEntry;
    debug(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, context?: Record<string, any>, error?: Error): void;
    fatal(message: string, context?: Record<string, any>, error?: Error): void;
}
//# sourceMappingURL=logger.d.ts.map