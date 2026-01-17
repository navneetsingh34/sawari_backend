/**
 * Users Service
 *
 * This service handles all user-related database operations.
 * It provides methods for creating, finding, and updating users.
 *
 * Why a separate Users service?
 * - Separation of concerns: User data access logic in one place
 * - Reusability: Auth service and other modules can use these methods
 * - Testability: Easy to mock for testing
 * - Maintainability: Changes to user queries happen in one place
 *
 * This service does NOT handle:
 * - Authentication logic (that's in AuthService)
 * - Password hashing (that's in User schema pre-save hook)
 * - Token generation (that's in AuthService)
 *
 * This service DOES handle:
 * - Creating new users
 * - Finding users by email/phone/ID
 * - Updating refresh tokens
 * - Soft delete operations (future)
 */

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from '../common/constants/user-roles.constant';

/**
 * CreateUserDto
 * Internal DTO for creating users
 * Used by AuthService during registration
 */
export interface CreateUserDto {
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  name: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * Create New User
   *
   * Creates a new user in the database.
   *
   * Flow:
   * 1. Check if email or phone already exists
   * 2. If exists, throw ConflictException
   * 3. Create new user document
   * 4. Password is automatically hashed by pre-save hook
   * 5. Save and return user (without password)
   *
   * Why check for duplicates here?
   * - Database unique constraint will catch it anyway
   * - But we want a clear, user-friendly error message
   * - "Email already exists" vs generic database error
   *
   * Security note:
   * - Password is plain text in input
   * - Hashed automatically before saving (pre-save hook)
   * - Never returned in response (toJSON transform)
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Check if user with email already exists
    const existingEmail = await this.userModel.findOne({
      email: createUserDto.email,
      isDeleted: false,
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if user with phone already exists
    const existingPhone = await this.userModel.findOne({
      phone: createUserDto.phone,
      isDeleted: false,
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // Create new user
    const user = new this.userModel(createUserDto);
    return user.save() as Promise<UserDocument>;
  }

  /**
   * Find User by Email
   *
   * Used during login to find user by email.
   *
   * Important:
   * - select('+password'): Include password field (normally excluded)
   * - This is needed to verify password during login
   * - Password is still not returned to client (toJSON transform)
   *
   * Returns null if:
   * - User not found
   * - User is deleted (isDeleted: true)
   * - User is inactive (isActive: false)
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        email: email.toLowerCase(),
        isDeleted: false,
        isActive: true,
      })
      .select('+password +refreshToken')
      .exec();
  }

  /**
   * Find User by Phone
   *
   * Alternative login method using phone number.
   * Same logic as findByEmail.
   */
  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        phone,
        isDeleted: false,
        isActive: true,
      })
      .select('+password +refreshToken')
      .exec();
  }

  /**
   * Find User by ID
   *
   * Used by JWT strategy to get user from token payload.
   *
   * Why not include password?
   * - Not needed for authentication (already verified)
   * - Reduces data transfer
   * - Extra security layer
   *
   * Returns null if:
   * - User not found
   * - User is deleted
   * - User is inactive
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        _id: id,
        isDeleted: false,
        isActive: true,
      })
      .exec();
  }

  /**
   * Update Refresh Token
   *
   * Stores hashed refresh token in user document.
   *
   * Why store refresh token?
   * - Token rotation: Validate old token before issuing new one
   * - Logout: Invalidate token by removing from database
   * - Security: Detect if stolen token is used
   *
   * Why hash refresh token?
   * - Same reason as passwords
   * - If database is compromised, tokens can't be used
   * - Hashed using same method as passwords (bcrypt)
   *
   * Flow:
   * 1. Hash the refresh token
   * 2. Store hash in user document
   * 3. When validating, hash incoming token and compare
   */
  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { refreshToken });
  }

  /**
   * Remove Refresh Token
   *
   * Called during logout to invalidate refresh token.
   *
   * Why set to null instead of deleting field?
   * - Consistent data structure
   * - Easier to query
   * - Clear intent (token was removed, not never existed)
   *
   * After this:
   * - User's refresh token is null
   * - Any attempt to use old token will fail
   * - User must login again to get new tokens
   */
  async removeRefreshToken(userId: string): Promise<void> {
    await this.updateRefreshToken(userId, null);
  }

  /**
   * Find User by Email or Phone
   *
   * Convenience method for login (supports both email and phone).
   *
   * Used when:
   * - User can login with either email or phone
   * - We don't know which one they're using
   *
   * Returns first match (email or phone)
   */
  async findByEmailOrPhone(
    email?: string,
    phone?: string,
  ): Promise<UserDocument | null> {
    if (email) {
      return this.findByEmail(email);
    }
    if (phone) {
      return this.findByPhone(phone);
    }
    return null;
  }

  /**
   * Update User Profile
   *
   * Updates allowed fields in the user profile.
   *
   * Security:
   * - Only updates fields in `updateData` (name)
   * - Doesn't touch sensitive fields (password, email, phone, role)
   * - Uses `new: true` to return updated document
   */
  async updateProfile(
    userId: string,
    updateData: Partial<User>,
  ): Promise<UserDocument> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .exec();
  }

  /**
   * Soft Delete User
   *
   * Deactivates the user account without removing data.
   *
   * Effect:
   * - isDeleted: true
   * - isActive: false
   *
   * Why soft delete?
   * - Regulatory compliance (audit trails)
   * - Data integrity (rides/payments need user reference)
   * - Security (prevents accidental data loss)
   *
   * Reversible: Admin can potentially reactivate (future)
   */
  async softDelete(userId: string): Promise<UserDocument> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          isDeleted: true,
          isActive: false,
          refreshToken: null, // Force logout
        },
        { new: true },
      )
      .exec();
  }
}
