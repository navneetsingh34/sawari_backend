/**
 * Commission Log Schema
 *
 * Immutable ledger of platform revenue.
 *
 * Rules:
 * - One log per ride (Unique rideId).
 * - Records the exact inputs used for calculation (Rate, Fare) for audit.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Ride } from '../../rides/schemas/ride.schema';
import { User } from '../../users/schemas/user.schema';

export type CommissionLogDocument = CommissionLog & Document;

@Schema({ timestamps: true, collection: 'commissions' })
export class CommissionLog {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Ride.name,
    required: true,
    unique: true,
  })
  rideId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  driverId: string;

  @Prop({ required: true })
  grossFare: number;

  @Prop({ required: true })
  commissionRate: number; // e.g., 0.1 for 10%

  @Prop({ required: true })
  commissionAmount: number;

  @Prop({ required: true })
  netPayout: number; // grossFare - commissionAmount

  @Prop({ default: Date.now })
  appliedAt: Date;
}

export const CommissionLogSchema = SchemaFactory.createForClass(CommissionLog);
