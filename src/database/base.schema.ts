/**
 * Base Schema Configuration
 *
 * This file provides common schema options and utilities that all Mongoose schemas
 * should extend. This ensures consistency across all database models.
 *
 * Why base schema options?
 * - Consistency: All schemas have the same base configuration
 * - DRY principle: Don't repeat timestamp and versioning config in every schema
 * - Maintainability: Change base options in one place
 * - Best practices: Enforces good schema design patterns
 *
 * Schema Options Explained:
 * - timestamps: Automatically adds createdAt and updatedAt fields
 * - versionKey: false: Disables __v field (Mongoose's internal versioning)
 *   We disable it because we handle versioning at application level if needed
 * - toJSON: Controls how documents are serialized to JSON
 *   - virtuals: true: Include virtual properties in JSON output
 *   - transform: Custom transformation function for JSON serialization
 *
 * How to use in your schemas:
 * ```typescript
 * import { Schema } from 'mongoose';
 * import { baseSchemaOptions } from './base.schema';
 *
 * export const UserSchema = new Schema({
 *   name: String,
 *   email: String,
 * }, baseSchemaOptions);
 * ```
 *
 * Future extensibility:
 * - Add common virtual properties (e.g., id instead of _id)
 * - Add common instance methods (e.g., toJSON transformation)
 * - Add common static methods (e.g., findByIdOrFail)
 * - Add common pre/post hooks (e.g., soft delete)
 */

import { SchemaOptions } from 'mongoose';

/**
 * Base schema options that should be used by all Mongoose schemas
 * Ensures consistent behavior across all models
 */
export const baseSchemaOptions: SchemaOptions = {
  // Automatically manage createdAt and updatedAt timestamps
  // MongoDB will handle these fields automatically
  timestamps: true,

  // Disable Mongoose's internal version key (__v)
  // We handle versioning at the application level if needed
  versionKey: false,

  // Configure JSON serialization
  toJSON: {
    // Include virtual properties when converting to JSON
    virtuals: true,

    // Transform function to clean up the JSON output
    // This runs every time a document is converted to JSON
    transform: function (doc: any, ret: any) {
      // Convert _id to id for cleaner API responses
      ret.id = ret._id;
      delete ret._id;

      // Remove internal Mongoose fields from API responses
      // These are implementation details that clients don't need
      delete ret.__v;

      return ret;
    },
  },

  // Configure object serialization (similar to toJSON)
  toObject: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
};

/**
 * Common schema type definitions
 * Use these for consistent field types across schemas
 */
export const commonSchemaTypes = {
  // Email field with validation
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  // Phone number field
  phone: {
    type: String,
    required: true,
    trim: true,
  },

  // Soft delete field (for future use)
  // Instead of deleting records, set this to true
  isDeleted: {
    type: Boolean,
    default: false,
    index: true, // Index for faster queries
  },

  // Active/inactive status
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
};
