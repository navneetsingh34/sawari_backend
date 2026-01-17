/**
 * Logger Service
 *
 * This service provides structured logging throughout the application using Winston.
 * It's designed for production use with proper log levels, formatting, and transports.
 *
 * Why Winston?
 * - Production-ready: Battle-tested in enterprise applications
 * - Multiple transports: Console, file, external services (e.g., CloudWatch, Datadog)
 * - Structured logging: JSON format for easy parsing and analysis
 * - Log levels: Granular control over what gets logged
 * - Performance: Async logging doesn't block application
 *
 * Log Levels (from highest to lowest priority):
 * - error: Application errors that need immediate attention
 * - warn: Warning messages for potentially harmful situations
 * - info: General informational messages about app flow
 * - http: HTTP request/response logs
 * - debug: Detailed debugging information
 *
 * How it works:
 * 1. Logger is configured based on NODE_ENV
 * 2. Development: Pretty console output with colors
 * 3. Production: JSON format for log aggregation services
 * 4. Each log includes timestamp, level, context, and message
 *
 * Usage in other services:
 * ```typescript
 * constructor(private logger: LoggerService) {}
 *
 * someMethod() {
 *   this.logger.log('User created', 'UserService');
 *   this.logger.error('Failed to create user', 'UserService');
 *   this.logger.debug('Processing payment', 'PaymentService');
 * }
 * ```
 *
 * Future enhancements:
 * - Add file transport for persistent logs
 * - Integrate with external logging services (CloudWatch, Datadog, Sentry)
 * - Add request ID tracking for distributed tracing
 * - Add performance metrics logging
 */

import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(private configService: ConfigService) {
    this.initializeLogger();
  }

  /**
   * Initialize Winston logger with environment-specific configuration
   */
  private initializeLogger(): void {
    const env = this.configService.get<string>('app.env');
    const logLevel = this.configService.get<string>('logging.level');

    // Define log format based on environment
    const logFormat =
      env === 'production'
        ? // Production: JSON format for log aggregation
          winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          )
        : // Development: Pretty print with colors
          winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, context, ...meta }) => {
                const contextStr = context ? `[${context}]` : '';
                const metaStr = Object.keys(meta).length
                  ? JSON.stringify(meta, null, 2)
                  : '';
                return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
              },
            ),
          );

    // Create Winston logger instance
    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports: [
        // Console transport (always enabled)
        new winston.transports.Console({
          handleExceptions: true,
        }),

        // Future: Add file transport for production
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
      exitOnError: false,
    });
  }

  /**
   * Set context for subsequent log messages
   * Useful for identifying which service/module is logging
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Log informational messages
   * Use for general application flow (e.g., "User logged in", "Order created")
   */
  log(message: string, context?: string): void {
    this.logger.info(message, { context: context || this.context });
  }

  /**
   * Log error messages
   * Use for application errors that need attention
   */
  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, {
      context: context || this.context,
      trace,
    });
  }

  /**
   * Log warning messages
   * Use for potentially harmful situations that aren't errors yet
   */
  warn(message: string, context?: string): void {
    this.logger.warn(message, { context: context || this.context });
  }

  /**
   * Log debug messages
   * Use for detailed debugging information during development
   */
  debug(message: string, context?: string): void {
    this.logger.debug(message, { context: context || this.context });
  }

  /**
   * Log verbose messages
   * Use for very detailed information (rarely used)
   */
  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context: context || this.context });
  }

  /**
   * Log HTTP requests
   * Used by request logger middleware
   */
  http(message: string, meta?: any): void {
    this.logger.http(message, meta);
  }
}
