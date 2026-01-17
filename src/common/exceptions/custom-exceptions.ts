/**
 * Custom Exception Classes
 *
 * This file defines custom exception classes for business logic errors.
 * These extend NestJS's HttpException to provide domain-specific error handling.
 *
 * Why custom exceptions?
 * - Domain clarity: Exceptions named after business concepts
 * - Consistent error codes: Machine-readable error identification
 * - Type safety: TypeScript ensures correct exception usage
 * - Testability: Easy to test specific error scenarios
 *
 * How to use:
 * ```typescript
 * // In a service
 * if (user.balance < amount) {
 *   throw new BusinessException(
 *     'INSUFFICIENT_BALANCE',
 *     'User does not have enough balance for this transaction'
 *   );
 * }
 *
 * if (!ride) {
 *   throw new ResourceNotFoundException('Ride', rideId);
 * }
 * ```
 *
 * These exceptions will be caught by HttpExceptionFilter and transformed
 * into standardized API responses.
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base Business Exception
 * Use this for domain-specific business rule violations
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        message,
        errorCode,
        statusCode,
      },
      statusCode,
    );
  }
}

/**
 * Resource Not Found Exception
 * Use when a requested resource doesn't exist
 *
 * Example: User not found, Ride not found, Driver not found
 */
export class ResourceNotFoundException extends HttpException {
  constructor(resourceName: string, identifier: string | number) {
    super(
      {
        message: `${resourceName} with identifier '${identifier}' not found`,
        errorCode: 'RESOURCE_NOT_FOUND',
        resource: resourceName,
        identifier,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Validation Exception
 * Use for custom validation errors beyond class-validator
 *
 * Example: Business rule validation, complex multi-field validation
 */
export class ValidationException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        errorCode: 'VALIDATION_ERROR',
        details,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * Unauthorized Exception
 * Use when user is not authenticated
 */
export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Authentication required') {
    super(
      {
        message,
        errorCode: 'UNAUTHORIZED',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

/**
 * Forbidden Exception
 * Use when user is authenticated but doesn't have permission
 */
export class ForbiddenException extends HttpException {
  constructor(message: string = 'Insufficient permissions') {
    super(
      {
        message,
        errorCode: 'FORBIDDEN',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * Conflict Exception
 * Use when there's a conflict with current state
 *
 * Example: Email already exists, Ride already accepted
 */
export class ConflictException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        errorCode: 'CONFLICT',
        details,
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Error Code Constants
 * Centralized error codes for consistency across the application
 *
 * Usage:
 * throw new BusinessException(ErrorCodes.INSUFFICIENT_BALANCE, 'Not enough credits');
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',

  // Business Logic (examples for ride-hailing)
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  RIDE_NOT_AVAILABLE: 'RIDE_NOT_AVAILABLE',
  DRIVER_NOT_AVAILABLE: 'DRIVER_NOT_AVAILABLE',
  INVALID_RIDE_STATUS: 'INVALID_RIDE_STATUS',

  // System
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
