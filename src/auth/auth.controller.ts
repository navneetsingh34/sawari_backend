/**
 * Auth Controller
 *
 * Handles all authentication-related HTTP endpoints.
 *
 * Endpoints:
 * - POST /auth/register/rider - Register new rider
 * - POST /auth/register/driver - Register new driver
 * - POST /auth/login - Login with email/phone + password
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout and invalidate tokens
 *
 * All endpoints are documented with Swagger for API documentation.
 */

import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { UserRole } from '../common/constants/user-roles.constant';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Register Rider
   *
   * Creates a new rider account.
   * Returns access + refresh tokens for immediate login.
   *
   * Request flow:
   * 1. Validate input (RegisterDto)
   * 2. Check email/phone uniqueness
   * 3. Create user with RIDER role
   * 4. Hash password (User schema)
   * 5. Generate tokens
   * 6. Return user + tokens
   */
  @Public()
  @Post('register/rider')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new rider account' })
  @ApiResponse({
    status: 201,
    description: 'Rider registered successfully',
    schema: {
      example: {
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'rider@example.com',
          phone: '+1234567890',
          role: 'RIDER',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  async registerRider(@Body() registerDto: RegisterDto) {
    // Force role to RIDER (security measure)
    registerDto.role = UserRole.RIDER;
    return this.authService.register(registerDto);
  }

  /**
   * Register Driver
   *
   * Creates a new driver account.
   * Returns access + refresh tokens for immediate login.
   *
   * Note: Driver-specific data (vehicle, license) will be added later
   * in a separate Driver module. This just creates the user account.
   */
  @Public()
  @Post('register/driver')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new driver account' })
  @ApiResponse({
    status: 201,
    description: 'Driver registered successfully',
    schema: {
      example: {
        user: {
          id: '507f1f77bcf86cd799439012',
          email: 'driver@example.com',
          phone: '+1234567891',
          role: 'DRIVER',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  async registerDriver(@Body() registerDto: RegisterDto) {
    // Force role to DRIVER (security measure)
    registerDto.role = UserRole.DRIVER;
    return this.authService.register(registerDto);
  }

  /**
   * Login
   *
   * Authenticates user with email/phone + password.
   * Returns access + refresh tokens.
   *
   * Supports:
   * - Login with email + password
   * - Login with phone + password
   *
   * Security:
   * - Generic error message ("Invalid credentials")
   * - Doesn't reveal if email exists or password is wrong
   * - Prevents user enumeration
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/phone and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          phone: '+1234567890',
          role: 'RIDER',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Email or phone is required' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Refresh Tokens
   *
   * Issues new access + refresh tokens using valid refresh token.
   * Implements token rotation for security.
   *
   * Flow:
   * 1. Validate refresh token (JwtRefreshGuard)
   * 2. Verify token matches database
   * 3. Generate new tokens
   * 4. Invalidate old refresh token
   * 5. Return new tokens
   *
   * Token rotation:
   * - Old refresh token becomes invalid
   * - New refresh token must be used next time
   * - Prevents token theft/replay attacks
   */
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @CurrentUser() user: any,
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.refreshTokens(user.userId, user.refreshToken);
  }

  /**
   * Logout
   *
   * Invalidates refresh token to prevent further use.
   *
   * Flow:
   * 1. Verify access token (JwtAuthGuard - automatic)
   * 2. Remove refresh token from database
   * 3. Client discards both tokens
   *
   * Note:
   * - Access token can't be invalidated (stateless JWT)
   * - It expires after 15 minutes anyway
   * - For immediate logout, implement token blacklist (future)
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }
}
