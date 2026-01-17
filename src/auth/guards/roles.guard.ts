/**
 * Roles Guard
 *
 * Authorization guard that checks if user has required role(s).
 * Works in combination with @Roles() decorator.
 *
 * Execution order:
 * 1. JwtAuthGuard runs first (authentication)
 * 2. User is attached to request
 * 3. RolesGuard runs (authorization)
 * 4. Checks if user.role matches required roles
 *
 * How to use:
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(UserRole.ADMIN)
 * @Get('admin/users')
 * getAllUsers() {
 *   // Only admins can access
 * }
 * ```
 *
 * Examples:
 *
 * Admin-only route:
 * ```typescript
 * @Roles(UserRole.ADMIN)
 * @Delete('users/:id')
 * deleteUser() {}
 * ```
 *
 * Driver-only route:
 * ```typescript
 * @Roles(UserRole.DRIVER)
 * @Post('rides/:id/accept')
 * acceptRide() {}
 * ```
 *
 * Rider-only route:
 * ```typescript
 * @Roles(UserRole.RIDER)
 * @Post('rides/request')
 * requestRide() {}
 * ```
 *
 * Multiple roles (OR logic):
 * ```typescript
 * @Roles(UserRole.DRIVER, UserRole.ADMIN)
 * @Get('rides/active')
 * getActiveRides() {
 *   // Drivers OR admins can access
 * }
 * ```
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../common/constants/user-roles.constant';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Can Activate
   *
   * Determines if user has required role(s).
   *
   * Flow:
   * 1. Get required roles from @Roles() decorator
   * 2. If no roles specified, allow access
   * 3. Get user from request (set by JwtAuthGuard)
   * 4. Check if user.role is in required roles
   * 5. Allow if match, deny if not
   *
   * Error handling:
   * - 403 Forbidden if user doesn't have required role
   * - Clear message: "Insufficient permissions"
   * - Doesn't reveal what roles are required (security)
   */
  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles specified, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get user from request (set by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
