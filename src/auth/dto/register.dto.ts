/**
 * Register DTO
 *
 * Data Transfer Object for user registration.
 * Validates all input fields before creating a new user.
 *
 * Why separate DTOs for registration?
 * - Validation: Ensures data meets requirements before processing
 * - Type safety: TypeScript knows exact shape of registration data
 * - Documentation: Swagger auto-generates API docs from this
 * - Security: Only allowed fields can be submitted
 *
 * Validation rules explained:
 * - Email: Must be valid email format
 * - Phone: Must be valid phone number format
 * - Password: Must meet strength requirements
 * - Role: Must be RIDER or DRIVER (not ADMIN)
 */

import {
  IsEmail,
  IsString,
  IsEnum,
  IsNotEmpty,
  MinLength,
  Matches,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  UserRole,
  PUBLIC_ROLES,
} from '../../common/constants/user-roles.constant';

export class RegisterDto {
  /**
   * Email Address
   *
   * Validation:
   * - Must be valid email format
   * - Required field
   * - Will be stored in lowercase
   *
   * Example: user@example.com
   */
  @ApiProperty({
    description: 'User email address',
    example: 'rider@example.com',
    required: true,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  /**
   * Phone Number
   *
   * Validation:
   * - Must be valid phone number format
   * - Required field
   * - Should include country code
   *
   * Example: +1234567890
   */
  @ApiProperty({
    description: 'User phone number with country code',
    example: '+1234567890',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number with country code',
  })
  phone: string;

  /**
   * Password
   *
   * Security requirements:
   * - Minimum 8 characters
   * - At least 1 uppercase letter
   * - At least 1 lowercase letter
   * - At least 1 number
   * - At least 1 special character
   *
   * Why these requirements?
   * - Prevents weak passwords
   * - Makes brute force attacks harder
   * - Industry standard for password strength
   *
   * The password will be hashed before storage (User schema pre-save hook)
   */
  @ApiProperty({
    description:
      'User password (min 8 chars, must include uppercase, lowercase, number, special char)',
    example: 'SecurePass@123',
    required: true,
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  /**
   * User Role
   *
   * Allowed values: RIDER, DRIVER
   * NOT allowed: ADMIN (security measure)
   *
   * Why restrict ADMIN?
   * - Prevents unauthorized admin account creation
   * - Admins should be created through controlled process
   * - Security best practice
   *
   * Default: RIDER (most common user type)
   */
  @ApiProperty({
    description: 'User role (RIDER or DRIVER)',
    enum: PUBLIC_ROLES,
    example: UserRole.RIDER,
    required: true,
  })
  @IsEnum(PUBLIC_ROLES, {
    message: 'Role must be either RIDER or DRIVER',
  })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole;

  /**
   * Full Name
   * 
   * Example: John Doe
   */
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;
}
