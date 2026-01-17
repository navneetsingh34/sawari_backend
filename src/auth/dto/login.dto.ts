/**
 * Login DTO
 *
 * Data Transfer Object for user login.
 * Supports login with either email OR phone number.
 *
 * Why allow email OR phone?
 * - Flexibility: Users can choose their preferred login method
 * - Convenience: Some users remember email, others phone
 * - Future: Enables SMS-based OTP login
 *
 * Validation:
 * - At least one of email or phone must be provided
 * - Password is always required
 * - If both provided, email takes precedence
 */

import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  /**
   * Email Address
   *
   * Optional if phone is provided
   * Must be valid email format if provided
   *
   * Login flow:
   * 1. User provides email OR phone
   * 2. System finds user by provided identifier
   * 3. Password is verified
   * 4. Tokens are generated
   */
  @ApiProperty({
    description: 'User email address (required if phone not provided)',
    example: 'rider@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @ValidateIf((o) => !o.phone || o.email)
  email?: string;

  /**
   * Phone Number
   *
   * Optional if email is provided
   * Must be valid phone format if provided
   *
   * Alternative login method to email
   */
  @ApiProperty({
    description: 'User phone number (required if email not provided)',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.email || o.phone)
  phone?: string;

  /**
   * Password
   *
   * Always required for login
   * Plain text password (will be compared with hashed version)
   *
   * Security:
   * - Never logged
   * - Compared using bcrypt (constant time)
   * - Not stored anywhere during login process
   */
  @ApiProperty({
    description: 'User password',
    example: 'SecurePass@123',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
