/**
 * Driver Profile Schema
 *
 * Defines the structure for driver-specific data.
 * Separate from User collection to maintain separation of concerns.
 *
 * Key Features:
 * - Linked to User via userId
 * - GeoJSON location storage for geospatial queries
 * - 2dsphere index for "find nearby drivers"
 * - Separate vehicle info structure
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type DriverProfileDocument = DriverProfile & Document;

@Schema({ _id: false })
export class VehicleInfo {
  @Prop({ required: true })
  vehicleType: string; // e.g., 'CAR', 'BIKE', 'AUTO'

  @Prop({ required: true })
  vehicleModel: string; // e.g., 'Toyota Prius'

  @Prop({ required: true })
  vehicleNumber: string; // e.g., 'KA-01-HH-1234'

  @Prop({ required: true })
  vehicleColor: string;

  @Prop({
    type: {
      hasAc: { type: Boolean, default: false },
      allowsSharing: { type: Boolean, default: false }
    },
    default: { hasAc: true, allowsSharing: false } // Default CAR has AC
  })
  features: {
    hasAc: boolean;
    allowsSharing: boolean;
  };
}

@Schema({ _id: false })
export class DriverDocument {
  @Prop({ required: false })
  url: string; // File URL or base64 encoded data

  @Prop({ required: false })
  fileName: string;

  @Prop({ required: false })
  mimeType: string;

  @Prop({ default: Date.now })
  uploadedAt: Date;

  @Prop({ default: false })
  isVerified: boolean;
}

@Schema({ _id: false })
export class DriverDocuments {
  @Prop({ type: DriverDocument })
  driverLicense: DriverDocument;

  @Prop({ type: DriverDocument })
  insurancePolicy: DriverDocument;

  @Prop({ type: DriverDocument })
  vehicleRegistration: DriverDocument;

  @Prop({ type: DriverDocument })
  profilePhoto: DriverDocument;
}

@Schema({ _id: false })
export class Location {
  @Prop({ required: true, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ required: true, type: [Number] })
  coordinates: number[]; // [longitude, latitude]
}

@Schema({ timestamps: true, collection: 'driver_profiles' })
export class DriverProfile {
  // Reference to the base User entity
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
  })
  userId: string;

  // Nested vehicle information
  @Prop({ type: VehicleInfo, required: true })
  vehicleInfo: VehicleInfo;

  // Driver documents (license, insurance, etc.)
  @Prop({ type: DriverDocuments })
  documents: DriverDocuments;

  // Driver verification status (admin verification)
  @Prop({ default: false })
  isVerified: boolean;

  // Driver online/offline status (for receiving rides)
  @Prop({ default: false })
  isOnline: boolean;

  // Current location for geospatial search
  // Default to null until driver comes online
  @Prop({ type: Location, index: '2dsphere' })
  currentLocation: Location;

  // Aggregate rating (0-5)
  @Prop({ default: 5.0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  totalRides: number;

  @Prop({ default: 0 })
  totalReviews: number;
}

export const DriverProfileSchema = SchemaFactory.createForClass(DriverProfile);

// Ensure 2dsphere index is created for geospatial queries
// This is required for $geoNear aggregation to work

