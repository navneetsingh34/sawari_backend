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

  // Financials
  @Prop({ required: true })
  suggestedFare: number;

  @Prop({ required: false })
  finalFare?: number;

  // Route Info
  @Prop({ required: true })
  distanceMeters: number;

  @Prop({ required: true })
  durationSeconds: number;

  // Cancellation
  @Prop({ required: false })
  cancellationReason?: string;

  @Prop({ required: false })
  cancelledBy?: string; // User ID
}

export const RideSchema = SchemaFactory.createForClass(Ride);

// Indexes
RideSchema.index({ status: 1, createdAt: -1 }); // For feed/history
