/**
 * JWT Refresh Token Strategy
 *
 * Passport strategy for validating JWT refresh tokens.
 * Used only for the token refresh endpoint.
 *
 * Difference from Access Token Strategy:
 * - Uses different secret (refresh token secret)
 * - Extracts token from request body (not header)
 * - Returns userId and token (for rotation validation)
 * - Only used on /auth/refresh endpoint
 *
 * Why separate strategy?
 * - Different secret for security
 * - Different validation logic
 * - Different token location
 * - Clearer separation of concerns
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService) {
    super({
      // Extract token from request body
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),

      // Reject expired tokens
      ignoreExpiration: false,

      // Secret for verifying refresh token signature
      secretOrKey: configService.get<string>('jwt.refreshTokenSecret'),

      // Pass request to validate() method
      passReqToCallback: true,
    });
  }

  /**
   * Validate Refresh Token
   *
   * Called after token signature and expiration are verified.
   *
   * Returns:
   * - userId: For finding user in database
   * - refreshToken: For comparing with stored hash
   *
   * The actual validation happens in AuthService.refreshTokens()
   * This just extracts the necessary data from the token
   */
  async validate(req: Request, payload: any) {
    const refreshToken = req.body.refreshToken;

    return {
      userId: payload.sub,
      refreshToken,
    };
  }
}
