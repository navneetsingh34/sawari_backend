/**
 * Roles Decorator
 *
 * Custom decorator to specify required roles for a route.
 * Works with RolesGuard to enforce role-based access control.
 *
 * How to use:
 * ```typescript
 * @Roles(UserRole.ADMIN)
 * @Get('admin/dashboard')
 * getAdminDashboard() {}
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
 *
 * How it works:
 * 1. Decorator sets metadata on route handler
 * 2. RolesGuard reads this metadata
 * 3. RolesGuard checks if user has required role
 * 4. Access granted or denied based on role
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../common/constants/user-roles.constant';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
