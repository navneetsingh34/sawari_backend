/**
 * HTTP Exception Filter
 *
 * This is a global exception filter that catches all exceptions thrown in the application
 * and transforms them into a standardized API response format.
 *
 * Why global exception handling?
 * - Consistency: All API errors have the same response structure
 * - Client-friendly: Clients can reliably parse error responses
 * - Security: Prevents leaking sensitive error details in production
 * - Logging: Centralized error logging for monitoring and debugging
 * - Maintainability: Error handling logic in one place
 *
 * Standard Error Response Format:
 * {
 *   "success": false,
 *   "message": "Human-readable error message",
 *   "errorCode": "MACHINE_READABLE_ERROR_CODE",
 *   "timestamp": "2024-01-17T00:00:00.000Z"
 * }
 *
 * How it works:
 * 1. Any exception thrown anywhere in the app is caught here
 * 2. Exception is analyzed to determine status code and message
 * 3. Error is logged with full details (stack trace in development)
 * 4. Standardized response is sent to client
 * 5. Sensitive details are hidden in production
 *
 * Exception Types Handled:
 * - HttpException: NestJS built-in HTTP exceptions (400, 401, 404, etc.)
 * - ValidationException: class-validator validation errors
 * - MongoError: Database errors
 * - Custom exceptions: Business logic errors
 * - Unknown errors: Unexpected errors (500 Internal Server Error)
 *
 * Usage in controllers/services:
 * ```typescript
 * // Throw built-in exceptions
 * throw new NotFoundException('User not found');
 * throw new BadRequestException('Invalid input');
 *
 * // Throw custom exceptions (defined in custom-exceptions.ts)
 * throw new BusinessException('INSUFFICIENT_BALANCE', 'Not enough credits');
 * ```
 *
 * Future enhancements:
 * - Add error tracking integration (Sentry, Rollbar)
 * - Add request ID for distributed tracing
 * - Add rate limit headers
 * - Add localization support for error messages
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

/**
 * Standard API error response interface
 * All error responses will conform to this structure
 */
export interface ErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  timestamp: string;
  path?: string; // Optional: Include request path for debugging
  details?: any; // Optional: Additional error details (only in development)
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HttpExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine HTTP status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract error message and code
    const errorResponse = this.getErrorResponse(exception, status);

    // Log the error with appropriate level
    this.logError(exception, request, status);

    // Send standardized error response
    const apiErrorResponse: ErrorResponse = {
      success: false,
      message: errorResponse.message,
      errorCode: errorResponse.errorCode,
      timestamp: new Date().toISOString(),

      // Include request path for debugging
      path: request.url,

      // Include additional details only in development
      ...(process.env.NODE_ENV === 'development' && {
        details: errorResponse.details,
      }),
    };

    response.status(status).json(apiErrorResponse);
  }

  /**
   * Extract error message and code from exception
   */
  private getErrorResponse(
    exception: unknown,
    status: number,
  ): { message: string; errorCode: string; details?: any } {
    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          message: exceptionResponse,
          errorCode: this.getErrorCodeFromStatus(status),
        };
      }

      if (typeof exceptionResponse === 'object') {
        const response = exceptionResponse as any;
        return {
          message: response.message || response.error || 'An error occurred',
          errorCode: response.errorCode || this.getErrorCodeFromStatus(status),
          details: response.details,
        };
      }
    }

    // Handle validation errors (class-validator)
    if (exception instanceof Error && exception.name === 'ValidationError') {
      return {
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: exception.message,
      };
    }

    // Handle MongoDB errors
    if (exception instanceof Error && exception.name === 'MongoError') {
      return {
        message: 'Database error occurred',
        errorCode: 'DATABASE_ERROR',
        // Don't expose database details in production
        ...(process.env.NODE_ENV === 'development' && {
          details: exception.message,
        }),
      };
    }

    // Handle unknown errors
    if (exception instanceof Error) {
      return {
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : exception.message,
        errorCode: 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          details: exception.stack,
        }),
      };
    }

    // Fallback for non-Error exceptions
    return {
      message: 'An unexpected error occurred',
      errorCode: 'UNKNOWN_ERROR',
    };
  }

  /**
   * Generate error code from HTTP status
   */
  private getErrorCodeFromStatus(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return errorCodes[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Log error with appropriate level and context
   */
  private logError(exception: unknown, request: Request, status: number): void {
    const message =
      exception instanceof Error ? exception.message : 'Unknown error';
    const stack = exception instanceof Error ? exception.stack : undefined;

    const logContext = {
      method: request.method,
      url: request.url,
      statusCode: status,
      userAgent: request.get('user-agent'),
      ip: request.ip,
    };

    // Log as error for 5xx, warn for 4xx
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${message}`,
        stack,
        'HttpExceptionFilter',
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${message}`,
        'HttpExceptionFilter',
      );
    }
  }
}
