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
 *
 * Validation:
 * - name: string, min 2, max 50 chars, optional.
 * - email: optional, valid email
 * - phone: optional, numeric string
 */

import { IsString, IsOptional, MinLength, MaxLength, IsEmail, Matches, IsDateString, IsEnum } from 'class-validator';
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
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @Matches(/^[0-9]{10,15}$/, { message: 'Phone number must be between 10 and 15 digits' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Profile Photo URL or Base64' })
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @ApiPropertyOptional({ description: 'Gender: MALE, FEMALE, OTHER' })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @ApiPropertyOptional({ description: 'Date of Birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

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
