"use strict";
/**
 * Logging Service
 * Winston-based centralized logging with structured output
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const LOG_DIR = process.env.LOG_DIR || './logs';
// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.metadata(), winston_1.default.format.json());
const logTransports = [
    new winston_1.default.transports.File({
        filename: path.join(LOG_DIR, 'error.log'),
        level: 'error',
        format: logFormat,
    }),
    new winston_1.default.transports.File({
        filename: path.join(LOG_DIR, 'combined.log'),
        format: logFormat,
    }),
];
// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logTransports.push(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
    }));
}
const winstonLogger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: logTransports,
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path.join(LOG_DIR, 'exceptions.log'),
            format: logFormat,
        }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path.join(LOG_DIR, 'rejections.log'),
            format: logFormat,
        }),
    ],
});
class Logger {
    constructor(component) {
        this.component = component;
    }
    createEntry(level, message, context) {
        return {
            timestamp: new Date(),
            level,
            component: this.component,
            message,
            context,
        };
    }
    debug(message, context) {
        const entry = this.createEntry('debug', message, context);
        winstonLogger.debug(`[${entry.component}] ${entry.message}`, { meta: entry.context });
    }
    info(message, context) {
        const entry = this.createEntry('info', message, context);
        winstonLogger.info(`[${entry.component}] ${entry.message}`, { meta: entry.context });
    }
    warn(message, context) {
        const entry = this.createEntry('warn', message, context);
        winstonLogger.warn(`[${entry.component}] ${entry.message}`, { meta: entry.context });
    }
    error(message, context, error) {
        const entry = this.createEntry('error', message, context);
        winstonLogger.error(`[${entry.component}] ${entry.message}`, {
            meta: entry.context,
            error: error?.stack,
        });
    }
    fatal(message, context, error) {
        const entry = this.createEntry('fatal', message, context);
        winstonLogger.error(`[${entry.component}] FATAL: ${entry.message}`, {
            meta: entry.context,
            error: error?.stack,
        });
        // In production, you might want to trigger alerts or restart
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map