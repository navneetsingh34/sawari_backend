/**
 * Bid Schema
 *
 * Represents a driver's offer for a specific ride.
 *
 * Relationships:
 * - rideId: The ride being bid on
 * - driverId: The driver placing the bid
 *
 * Rules:
 * - One active bid per driver per ride (Enforced via business, potential index)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BidStatus } from '../enums/bid-status.enum';
import { Ride } from '../../rides/schemas/ride.schema';
import { User } from '../../users/schemas/user.schema';

export type BidDocument = Bid & Document;

@Schema({ timestamps: true, collection: 'bids' })
export class Bid {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Ride.name,
    required: true,
    index: true,
  })
  rideId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  driverId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: 'DRIVER', enum: ['DRIVER', 'RIDER'] })
  lastBidder: string;

  @Prop({
    required: true,
    enum: BidStatus,
    default: BidStatus.ACTIVE,
    index: true,
  })
  status: BidStatus;
}

export const BidSchema = SchemaFactory.createForClass(Bid);

// Indexes
// Optimize "Get bids for ride"
BidSchema.index({ rideId: 1, amount: 1 });
// Optimize "Check if driver already bid"
BidSchema.index({ rideId: 1, driverId: 1 });
