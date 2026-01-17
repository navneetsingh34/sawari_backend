/**
 * Current User Decorator
 *
 * Custom parameter decorator to extract authenticated user from request.
 * Provides type-safe access to user data in controllers.
 *
 * How to use:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: any) {
 *   return user; // { id, email, phone, role }
 * }
 * ```
 *
 * Extract specific field:
 * ```typescript
 * @Get('email')
 * getEmail(@CurrentUser('email') email: string) {
 *   return { email };
 * }
 * ```
 *
 * How it works:
 * 1. JwtAuthGuard validates token
 * 2. JwtAccessStrategy.validate() returns user object
 * 3. User object is attached to request (req.user)
 * 4. This decorator extracts req.user
 * 5. Controller receives user data
 *
 * What's in user object?
 * - id: User ID
 * - email: User email
 * - phone: User phone
 * - role: User role (RIDER/DRIVER/ADMIN)
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If specific field requested, return that field
    // Otherwise return entire user object
    return data ? user?.[data] : user;
  },
);
