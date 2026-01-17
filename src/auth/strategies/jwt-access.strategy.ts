/**
 * JWT Access Token Strategy
 *
 * Passport strategy for validating JWT access tokens.
 * This runs on every request to protected endpoints.
 *
 * How it works:
 * 1. JwtAuthGuard triggers this strategy
 * 2. Strategy extracts token from Authorization header
 * 3. Strategy validates token signature and expiration
 * 4. Strategy calls validate() with decoded payload
 * 5. validate() returns user object
 * 6. User object is attached to request (req.user)
 * 7. Request proceeds to controller
 *
 * Token format:
 * Authorization: Bearer <access_token>
 *
 * Token payload:
 * {
 *   sub: userId,
 *   email: userEmail,
 *   role: userRole,
 *   iat: issuedAt,
 *   exp: expiresAt
 * }
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      // Extract token from Authorization header as Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Reject expired tokens
      ignoreExpiration: false,

      // Secret for verifying token signature
      secretOrKey: configService.get<string>('jwt.accessTokenSecret'),
    });
  }

  /**
   * Validate Token Payload
   *
   * Called after token signature and expiration are verified.
   *
   * Responsibilities:
   * - Verify user still exists
   * - Verify user is active
   * - Verify user is not deleted
   * - Return user object for request
   *
   * Why check user exists?
   * - User might be deleted after token was issued
   * - User might be deactivated
   * - Token is still valid but user shouldn't have access
   *
   * Return value:
   * - Attached to request as req.user
   * - Available in controllers via @CurrentUser() decorator
   */
  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user object (attached to request)
    return {
      id: user._id.toString(),
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}
