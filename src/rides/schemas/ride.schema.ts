/**
 * Ride Schema
 *
 * Core entity for the ride-hailing business logic.
 * Stores route, status, pricing, and participant details.
 *
 * Relationships:
 * - riderId: Link to User (Role: Rider)
 * - driverId: Link to User (Role: Driver)
 *
 * Geospatial:
 * - pickupLocation: GeoJSON Point
 * - dropLocation: GeoJSON Point
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { RideStatus } from '../enums/ride-status.enum';
import { RideType } from '../enums/ride-type.enum';

export type RideDocument = Ride & Document;

@Schema({ _id: false })
export class RideLocation {
  @Prop({ required: true, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ required: true, type: [Number] }) // [lng, lat]
  coordinates: number[];

  @Prop({ required: false })
  address?: string; // Human readable
}

@Schema({ timestamps: true, collection: 'rides' })
export class Ride {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  riderId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: false,
    index: true,
  })
  driverId?: string;

  @Prop({ type: RideLocation, required: true })
  pickupLocation: RideLocation;

  @Prop({ type: RideLocation, required: true })
  dropLocation: RideLocation;

  @Prop({
    required: true,
    enum: RideStatus,
    default: RideStatus.REQUESTED,
    index: true,
  })
  status: RideStatus;

  // Vehicle Requirements
  @Prop({ required: true, default: 'CAR' })
  vehicleType: string; // MOTO, AUTO, CAR, CAB_XL, PREMIER

  @Prop({
    required: true,
    enum: RideType,
    default: RideType.CITY,
    index: true,
  })
  rideType: RideType;

  @Prop({
    type: {
      hasAc: { type: Boolean, default: false },
      isShared: { type: Boolean, default: false }
    },
    default: { hasAc: false, isShared: false }
  })
  rideOptions: {
    hasAc: boolean;
    isShared: boolean;
  };

  // Parcel Fields
  @Prop({ required: false })
  senderName?: string;

  @Prop({ required: false })
  senderPhone?: string;

  @Prop({ required: false })
  receiverName?: string;

  @Prop({ required: false })
  receiverPhone?: string;

  @Prop({ required: false })
  parcelCategory?: string;

  @Prop({ required: false })
  parcelWeight?: number;

  @Prop({ required: false, default: false })
  fragile?: boolean;

  @Prop({ required: false })
  pickupOtp?: string;

  @Prop({ required: false })
  dropOtp?: string;

  // Financials
  @Prop({ required: true })
  suggestedFare: number;

  @Prop({ required: false })
  customFare?: number; // Rider's offered amount

  @Prop({ required: false })
  finalFare?: number;

  // Route Info
  @Prop({ required: true })
  distanceMeters: number;

  @Prop({ required: true })
  durationSeconds: number;

  @Prop({ required: false })
  remainingDistanceMeters?: number; // Updated when driver arrives/starts

  @Prop({ required: false })
  remainingDurationSeconds?: number;

  // Scheduling
  @Prop({ default: false })
  isScheduled: boolean;

  @Prop({ required: false })
  scheduledAt?: Date;

  // Cancellation
  @Prop({ required: false })
  cancellationReason?: string;

  @Prop({ required: false })
  cancelledBy?: string; // User ID

  // Payment
  @Prop({
    required: false,
    enum: ['CASH', 'UPI', 'PENDING'],
    default: 'PENDING',
  })
  paymentMethod?: string;

  @Prop({ required: false, default: false })
  paymentCollected?: boolean;

  // Review
  @Prop({ required: false, min: 1, max: 5 })
  driverRating?: number;

  @Prop({ required: false })
  riderReview?: string;

  @Prop({ required: false })
  reviewedAt?: Date;

  // SOS Emergency Alerts
  @Prop({
    type: [{
      triggeredBy: { type: String, enum: ['RIDER', 'DRIVER'], required: true },
      triggeredAt: { type: Date, default: Date.now },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
      },
      status: { type: String, enum: ['ACTIVE', 'RESOLVED'], default: 'ACTIVE' },
    }],
    default: [],
  })
  sosAlerts: {
    triggeredBy: string;
    triggeredAt: Date;
    location: { type: string; coordinates: number[] };
    status: string;
  }[];

  // SOS Live Tracking Session
  @Prop({ required: false, index: true, sparse: true })
  sosSessionId?: string; // Unique UUID for public tracking link

  @Prop({ default: false })
  sosActive?: boolean;

  @Prop({
    type: [{
      coordinates: { type: [Number], required: true }, // [lng, lat]
      timestamp: { type: Date, default: Date.now },
    }],
    default: [],
  })
  sosLocationHistory: {
    coordinates: number[];
    timestamp: Date;
  }[];

  @Prop({ required: false })
  sosActivatedAt?: Date;
}

export const RideSchema = SchemaFactory.createForClass(Ride);

// Indexes
RideSchema.index({ status: 1, createdAt: -1 }); // For feed/history
