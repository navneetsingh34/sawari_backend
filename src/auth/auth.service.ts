/**
 * Auth Service
 *
 * Core authentication service handling all auth-related business logic.
 * This is the heart of the authentication system.
 *
 * Responsibilities:
 * - User registration (riders and drivers)
 * - User login (email or phone + password)
 * - Token generation (access + refresh)
 * - Token refresh (rotation)
 * - Logout (token invalidation)
 *
 * Security principles implemented:
 * - Passwords hashed with bcrypt (User schema)
 * - Refresh tokens hashed before storage
 * - Token rotation on refresh
 * - Generic error messages (prevent user enumeration)
 * - No sensitive data in logs
 */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  /**
   * Register New User
   *
   * Creates a new user account (rider or driver).
   *
   * Flow:
   * 1. Validate input (done by RegisterDto)
   * 2. Check if email/phone already exists (UsersService)
   * 3. Create user (password auto-hashed by User schema)
   * 4. Generate access + refresh tokens
   * 5. Store hashed refresh token
   * 6. Return tokens + user info
   *
   * Why return tokens immediately?
   * - Better UX: User is logged in after registration
   * - No need for separate login step
   * - Industry standard practice
   */
  async register(registerDto: RegisterDto) {
    // Generate unique OTP for riders
    let riderOtp: string | undefined;
    if (registerDto.role === 'RIDER') {
      riderOtp = await this.generateUniqueOtp();
    }

    // Create user (UsersService handles duplicate checking)
    const user = await this.usersService.create({
      ...registerDto,
      riderOtp,
    });

    // Generate tokens for immediate login
    const tokens = await this.generateTokens(user);

    // Store hashed refresh token
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        phone: user.phone,
        role: user.role,
        ...(user.riderOtp && { riderOtp: user.riderOtp }), // Include OTP for riders
      },
      ...tokens,
    };
  }

  /**
   * Login User
   *
   * Authenticates user with email/phone + password.
   *
   * Flow:
   * 1. Find user by email or phone
   * 2. Verify password
   * 3. Generate new tokens
   * 4. Store hashed refresh token
   * 5. Return tokens + user info
   *
   * Security considerations:
   * - Generic error message: "Invalid credentials"
   * - Don't reveal if email exists or password is wrong
   * - Prevents user enumeration attacks
   * - Constant time password comparison (bcrypt)
   */
  async login(loginDto: LoginDto) {
    // Validate that at least email or phone is provided
    if (!loginDto.email && !loginDto.phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    // Find user by email or phone
    const user = await this.usersService.findByEmailOrPhone(
      loginDto.email,
      loginDto.phone,
    );

    // Generic error if user not found
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(loginDto.password);

    // Generic error if password wrong
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Store hashed refresh token
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Refresh Tokens
   *
   * Issues new access + refresh tokens using valid refresh token.
   * Implements token rotation for security.
   *
   * Token Rotation Explained:
   * 1. Client sends old refresh token
   * 2. Server validates old token
   * 3. Server issues NEW access + refresh tokens
   * 4. Server stores NEW refresh token (hashed)
   * 5. Old refresh token is now invalid
   *
   * Why rotation?
   * - If token is stolen, attacker can only use it once
   * - Legitimate user's next refresh will fail (alert!)
   * - Limits damage from token theft
   * - Industry best practice
   *
   * Flow:
   * 1. Decode refresh token to get user ID
   * 2. Find user in database
   * 3. Verify stored refresh token matches
   * 4. Generate new tokens
   * 5. Update stored refresh token
   * 6. Return new tokens
   */
  async refreshTokens(userId: string, refreshToken: string) {
    // Find user with refresh token
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Access denied');
    }

    // Verify refresh token matches stored token
    // Both are hashed, so we compare hashes
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken || '',
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access denied');
    }

    // Generate new tokens (rotation)
    const tokens = await this.generateTokens(user);

    // Update stored refresh token
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  /**
   * Logout User
   *
   * Invalidates refresh token to prevent further use.
   *
   * How logout works:
   * 1. Remove refresh token from database
   * 2. Client discards access + refresh tokens
   * 3. User must login again to get new tokens
   *
   * Note about access tokens:
   * - Access tokens can't be invalidated (stateless JWT)
   * - They expire after 15 minutes anyway
   * - For immediate logout, implement token blacklist (future)
   *
   * Future: Logout from all devices
   * - Store multiple refresh tokens per user
   * - Logout can clear all tokens
   * - Requires schema change (refreshTokens: string[])
   */
  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }

  /**
   * Generate Access + Refresh Tokens
   *
   * Creates JWT tokens for authentication.
   *
   * Access Token:
   * - Short-lived (15 minutes)
   * - Used for API requests
   * - Contains user ID and role
   * - Verified by JwtAuthGuard
   *
   * Refresh Token:
   * - Long-lived (7 days)
   * - Used to get new access tokens
   * - Contains only user ID
   * - Verified by JwtRefreshGuard
   *
   * Why two tokens?
   * - Security: Short access token limits exposure
   * - UX: Long refresh token prevents frequent logins
   * - Best of both worlds
   */
  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      // Access token (short-lived)
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessTokenSecret'),
        expiresIn: (this.configService.get<string>('jwt.accessTokenExpiry') ||
          '15m') as any,
      }),

      // Refresh token (long-lived)
      this.jwtService.signAsync(
        { sub: user._id.toString() },
        {
          secret: this.configService.get<string>('jwt.refreshTokenSecret'),
          expiresIn: (this.configService.get<string>(
            'jwt.refreshTokenExpiry',
          ) || '7d') as any,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Update Refresh Token
   *
   * Hashes and stores refresh token in database.
   *
   * Why hash refresh token?
   * - Same reason as passwords
   * - If database is compromised, tokens can't be used
   * - Defense in depth
   *
   * How it works:
   * 1. Hash refresh token with bcrypt
   * 2. Store hash in user document
   * 3. When validating, hash incoming token and compare
   */
  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }

  /**
   * Generate Unique 4-Digit OTP
   *
   * Creates a unique 4-digit OTP for riders.
   * Ensures uniqueness by checking against existing OTPs.
   *
   * Flow:
   * 1. Generate random 4-digit number
   * 2. Check if it already exists
   * 3. If exists, generate new one (recursive)
   * 4. Return unique OTP
   */
  private async generateUniqueOtp(): Promise<string> {
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 1000-9999

    // Check if OTP already exists
    const existingUser = await this.usersService.findByOtp(otp);

    if (existingUser) {
      // OTP collision, generate new one
      return this.generateUniqueOtp();
    }

    return otp;
  }
}
