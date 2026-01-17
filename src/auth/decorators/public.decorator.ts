/**
 * Public Decorator
 *
 * Marks a route as public (no authentication required).
 * Bypasses JwtAuthGuard for specific endpoints.
 *
 * How to use:
 * ```typescript
 * @Public()
 * @Post('register')
 * register(@Body() dto: RegisterDto) {
 *   // No authentication required
 * }
 * ```
 *
 * When to use:
 * - Registration endpoints
 * - Login endpoints
 * - Public health checks
 * - Public documentation
 * - Password reset request
 *
 * How it works:
 * 1. Decorator sets IS_PUBLIC_KEY metadata to true
 * 2. JwtAuthGuard checks for this metadata
 * 3. If true, guard allows request without token
 * 4. If false/missing, guard requires valid token
 *
 * Security note:
 * - Use sparingly
 * - Only for truly public endpoints
 * - Don't expose sensitive data on public routes
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
