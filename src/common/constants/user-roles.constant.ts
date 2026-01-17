/**
 * User Roles Constants
 *
 * This file defines the user role system for the ride-hailing application.
 *
 * Why enum-based roles?
 * - Type safety: TypeScript ensures only valid roles are used
 * - Centralized: Single source of truth for all roles
 * - Easy to extend: Add new roles without changing existing code
 * - Database consistency: Same values stored in DB and used in code
 *
 * Role Hierarchy:
 * 1. RIDER - End users who request rides
 * 2. DRIVER - Service providers who fulfill ride requests
 * 3. ADMIN - System administrators with full access
 *
 * Why these specific roles?
 * - RIDER: Core user type, requests rides, makes payments
 * - DRIVER: Core service provider, accepts rides, earns money
 * - ADMIN: Manages platform, handles disputes, monitors system
 *
 * Future extensibility:
 * - SUPER_ADMIN: Higher level admin with additional permissions
 * - SUPPORT: Customer support staff with limited admin access
 * - PARTNER: Business partners with API access
 *
 * How roles are used:
 * 1. Stored in User schema as a field
 * 2. Checked by RolesGuard for authorization
 * 3. Used with @Roles() decorator on endpoints
 *
 * Example usage:
 * ```typescript
 * // In controller
 * @Roles(UserRole.ADMIN)
 * @Get('admin/users')
 * getAllUsers() {}
 *
 * // In service
 * if (user.role === UserRole.DRIVER) {
 *   // Driver-specific logic
 * }
 * ```
 */

/**
 * User Role Enum
 *
 * Defines all possible user roles in the system.
 * These values are stored in the database and used throughout the application.
 */
export enum UserRole {
  /**
   * RIDER - Regular users who request rides
   *
   * Permissions:
   * - Request rides
   * - View ride history
   * - Make payments
   * - Rate drivers
   * - Manage profile
   */
  RIDER = 'RIDER',

  /**
   * DRIVER - Service providers who fulfill ride requests
   *
   * Permissions:
   * - Accept ride requests
   * - View earnings
   * - Update availability
   * - Rate riders
   * - Manage vehicle info
   * - View ride history
   */
  DRIVER = 'DRIVER',

  /**
   * ADMIN - System administrators
   *
   * Permissions:
   * - Manage all users
   * - View all rides
   * - Handle disputes
   * - Access analytics
   * - Configure system settings
   * - Manage drivers (approve/suspend)
   */
  ADMIN = 'ADMIN',
}

/**
 * Role Descriptions
 *
 * Human-readable descriptions for each role.
 * Useful for UI displays and documentation.
 */
export const RoleDescriptions: Record<UserRole, string> = {
  [UserRole.RIDER]: 'Regular user who requests rides',
  [UserRole.DRIVER]: 'Service provider who fulfills ride requests',
  [UserRole.ADMIN]: 'System administrator with full access',
};

/**
 * Public Roles
 *
 * Roles that can be self-registered through public APIs.
 *
 * Why ADMIN is excluded:
 * - Security: Prevents unauthorized admin account creation
 * - Control: Admins should be created through controlled process
 * - Audit: Admin creation should be tracked and approved
 *
 * Admin accounts will be created through:
 * - Database seeding (initial setup)
 * - Admin-only endpoint (existing admin creates new admin)
 * - Manual database insertion (emergency)
 */
export const PUBLIC_ROLES = [UserRole.RIDER, UserRole.DRIVER] as const;

/**
 * Role Permissions Helper
 *
 * Check if a role has specific permissions.
 * This can be extended as the application grows.
 */
export const RolePermissions = {
  /**
   * Check if role can access admin features
   */
  isAdmin: (role: UserRole): boolean => role === UserRole.ADMIN,

  /**
   * Check if role can provide rides
   */
  canDrive: (role: UserRole): boolean =>
    role === UserRole.DRIVER || role === UserRole.ADMIN,

  /**
   * Check if role can request rides
   */
  canRequestRide: (role: UserRole): boolean =>
    role === UserRole.RIDER || role === UserRole.ADMIN,

  /**
   * Check if role can be publicly registered
   */
  isPublicRole: (role: UserRole): boolean => PUBLIC_ROLES.includes(role as any),
};
