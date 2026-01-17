/**
 * Refresh Token DTO
 *
 * Data Transfer Object for refreshing access tokens.
 *
 * Why refresh tokens?
 * - Security: Access tokens are short-lived (15 min)
 * - UX: Users don't need to login frequently
 * - Balance: Short access token + long refresh token = secure + convenient
 *
 * How refresh works:
 * 1. Access token expires after 15 minutes
 * 2. Client sends refresh token to get new access token
 * 3. Server validates refresh token
 * 4. Server issues new access token + new refresh token
 * 5. Old refresh token is invalidated (token rotation)
 *
 * Token rotation prevents:
 * - Token theft: If stolen token is used, legitimate user's token stops working
 * - Replay attacks: Old tokens can't be reused
 */

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  /**
   * Refresh Token
   *
   * Long-lived JWT token used to get new access tokens
   *
   * Validation:
   * - Must be provided
   * - Must be valid JWT format (checked by JWT strategy)
   * - Must match hashed token in database
   * - Must not be expired (7 days)
   *
   * Security:
   * - Stored hashed in database
   * - Rotated on each use
   * - Invalidated on logout
   */
  @ApiProperty({
    description: 'Refresh token received during login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}
