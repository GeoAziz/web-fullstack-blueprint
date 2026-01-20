/**
 * Logging Service
 * Winston-based centralized logging with structured output
 */

import winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { LogEntry } from '@types';

const LOG_DIR = process.env.LOG_DIR || './logs';

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

const logTransports: winston.transport[] = [
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    level: 'error',
    format: logFormat,
  }),
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'combined.log'),
    format: logFormat,
  }),
];

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logTransports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: logTransports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'exceptions.log'),
      format: logFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'rejections.log'),
      format: logFormat,
    }),
  ],
});

export class Logger {
  constructor(private component: string) {}

  private createEntry(
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal',
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      component: this.component,
      message,
      context,
    };
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createEntry('debug', message, context);
    winstonLogger.debug(`[${entry.component}] ${entry.message}`, { meta: entry.context });
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createEntry('info', message, context);
    winstonLogger.info(`[${entry.component}] ${entry.message}`, { meta: entry.context });
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createEntry('warn', message, context);
    winstonLogger.warn(`[${entry.component}] ${entry.message}`, { meta: entry.context });
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    const entry = this.createEntry('error', message, context);
    winstonLogger.error(`[${entry.component}] ${entry.message}`, {
      meta: entry.context,
      error: error?.stack,
    });
  }

  fatal(message: string, context?: Record<string, any>, error?: Error): void {
    const entry = this.createEntry('fatal', message, context);
    winstonLogger.error(`[${entry.component}] FATAL: ${entry.message}`, {
      meta: entry.context,
      error: error?.stack,
    });
    // In production, you might want to trigger alerts or restart
  }
}
