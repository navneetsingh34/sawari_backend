/**
 * Request Logger Middleware
 *
 * This middleware logs all incoming HTTP requests and their responses.
 * It's essential for monitoring, debugging, and auditing in production.
 *
 * Why request logging?
 * - Monitoring: Track API usage patterns and performance
 * - Debugging: Trace request flow when investigating issues
 * - Auditing: Maintain audit trail for compliance
 * - Performance: Identify slow endpoints
 * - Security: Detect suspicious activity patterns
 *
 * What gets logged:
 * - Request method (GET, POST, etc.)
 * - Request URL and query parameters
 * - Response status code
 * - Response time (in milliseconds)
 * - User agent (client information)
 * - IP address
 * - Request ID (for distributed tracing - future enhancement)
 *
 * How it works:
 * 1. Middleware is called before request reaches controller
 * 2. Start time is recorded
 * 3. Request proceeds to controller
 * 4. Response is intercepted on the way back
 * 5. End time is recorded and log is written
 *
 * Log format:
 * "GET /api/v1/users 200 45ms"
 *
 * Future enhancements:
 * - Add request ID generation for distributed tracing
 * - Filter sensitive data from logs (passwords, tokens)
 * - Add request/response body logging (configurable)
 * - Add correlation ID for tracking requests across services
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Record start time for performance measurement
    const startTime = Date.now();

    // Get request details
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'Unknown';

    // Log when response is finished
    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      // Create log message
      const message = `${method} ${originalUrl} ${statusCode} ${responseTime}ms`;

      // Additional metadata for structured logging
      const meta = {
        method,
        url: originalUrl,
        statusCode,
        responseTime,
        userAgent,
        ip,
      };

      // Log with appropriate level based on status code
      if (statusCode >= 500) {
        // Server errors - log as error
        this.logger.error(message, undefined, 'HTTP');
      } else if (statusCode >= 400) {
        // Client errors - log as warning
        this.logger.warn(message, 'HTTP');
      } else {
        // Success - log as http/info
        this.logger.http(message, meta);
      }
    });

    // Continue to next middleware/controller
    next();
  }
}
