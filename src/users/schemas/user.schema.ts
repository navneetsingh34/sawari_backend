/**
 * User Schema
 *
 * This schema defines the User model for the ride-hailing application.
 * It serves as the foundation for authentication and authorization.
 *
 * Why a single User table for all roles?
 * - Simplicity: Easier to manage authentication in one place
 * - Flexibility: Users can potentially have multiple roles in the future
 * - Efficiency: Single query to authenticate any user type
 * - Consistency: Same authentication flow for riders, drivers, and admins
 *
 * Role-specific data storage:
 * - User table: Core authentication data (email, password, role)
 * - Driver table: Driver-specific data (vehicle, license, documents) - Future
 * - Rider table: Rider preferences, payment methods - Future
 * - This keeps the User table lean and focused on authentication
 *
 * Soft Delete Strategy:
 * - Why soft delete?
 *   - Audit trail: Keep record of deleted users for compliance
 *   - Data integrity: Preserve historical ride data references
 *   - Recovery: Ability to restore accidentally deleted accounts
 *   - Analytics: Include deleted users in historical reports
 * - How it works:
 *   - isDeleted flag marks user as deleted
 *   - Queries filter out deleted users by default
 *   - Actual data remains in database
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/constants/user-roles.constant';
import { baseSchemaOptions } from '../../database/base.schema';

export type UserDocument = User &
  Document & {
    comparePassword(candidatePassword: string): Promise<boolean>;
  };

@Schema(baseSchemaOptions)
export class User {
  @Prop({
    required: false,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ default: 0 })
  ridexaCoins: number; // Ridexa loyalty coins balance

  @Prop({ required: false })
  profilePhoto?: string; // Optional user profile photo

  @Prop({ required: false, enum: ['MALE', 'FEMALE', 'OTHER'] })
  gender?: string;

  @Prop({ required: false })
  dateOfBirth?: Date;

  @Prop({
    type: [{
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      searchedAt: { type: Date, default: Date.now }
    }],
    default: []
  })
  recentSearches: { address: string; latitude: number; longitude: number; searchedAt: Date }[];

  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  phone: string;

  @Prop({
    required: true,
    select: false,
  })
  password: string;

  @Prop({
    required: true,
    enum: UserRole,
    default: UserRole.RIDER,
    index: true,
  })
  role: UserRole;

  @Prop({
    required: false,
    select: false,
  })
  refreshToken?: string;

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;

  @Prop({
    required: false,
    unique: true,
    sparse: true, // Only enforce uniqueness for non-null values
    length: 4,
  })
  riderOtp?: string; // 4-digit OTP for riders only

  @Prop({
    type: [{
      name: { type: String, required: true },
      phone: { type: String, required: true },
      relation: { type: String, required: false },
    }],
    default: [],
  })
  emergencyContacts: {
    name: string;
    phone: string;
    relation?: string;
  }[];

  @Prop({
    required: false,
    type: String,
  })
  pushToken?: string;

  @Prop({
    default: true,
  })
  pushEnabled: boolean;

  @Prop({
    default: false,
    index: true,
  })
  isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook for password hashing
UserSchema.pre('save', async function () {
  const user = this as unknown as UserDocument;
  if (!user.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  const user = this as UserDocument;
  return bcrypt.compare(candidatePassword, user.password);
};

// Remove sensitive fields from JSON
UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.refreshToken;
    return ret;
  },
});

// Indexes for common queries
UserSchema.index({ email: 1, isDeleted: 1, isActive: 1 });
UserSchema.index({ phone: 1, isDeleted: 1, isActive: 1 });
UserSchema.index({ role: 1, isDeleted: 1, isActive: 1 });
