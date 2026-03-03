/**
 * Update User Profile DTO
 *
 * Data Transfer Object for updating user profile information.
 *
 * Strict Rules:
 * - ONLY 'name' can be updated via this DTO.
 * - 'email' and 'phone' are immutable here (require separate verification flow).
 * - 'role' is immutable (requires admin action).
 *
 * Validation:
 * - name: string, min 2, max 50 chars, optional.
 */

import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    description: 'Expo Push Token for notifications',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsOptional()
  @IsString()
  pushToken?: string;

  @ApiPropertyOptional({
    description: 'Toggle to enable/disable push notifications',
    example: true,
  })
  @IsOptional()
  pushEnabled?: boolean;
}
