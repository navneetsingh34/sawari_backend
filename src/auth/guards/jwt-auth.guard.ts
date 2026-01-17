/**
 * JWT Auth Guard
 *
 * Guard that protects routes requiring authentication.
 * Extends Passport's JWT guard with custom logic.
 *
 * How to use:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 * ```
 *
 * What it does:
 * 1. Checks for JWT token in Authorization header
 * 2. Validates token signature and expiration
 * 3. Calls JwtAccessStrategy.validate()
 * 4. Attaches user to request
 * 5. Allows request to proceed
 *
 * If token is missing/invalid:
 * - Throws UnauthorizedException (401)
 * - Request is rejected
 * - Controller is never reached
 *
 * Public routes:
 * - Use @Public() decorator to skip this guard
 * - See public.decorator.ts
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Can Activate
   *
   * Determines if request should be allowed.
   *
   * Flow:
   * 1. Check if route is marked as @Public()
   * 2. If public, allow without authentication
   * 3. If not public, run JWT validation
   * 4. Return true (allow) or throw error (deny)
   */
  canActivate(context: ExecutionContext) {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Run JWT validation
    return super.canActivate(context);
  }
}
