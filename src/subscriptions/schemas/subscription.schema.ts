/**
 * Subscription Schema
 *
 * Manages Driver Subscriptions (Power Pass).
 *
 * Rules:
 * - Driver can have multiple records (history), but only one ACTIVE.
 * - Expiry is determined by `endDate`.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type SubscriptionDocument = Subscription & Document;

export const PLANS = {
  DRIVER_7_DAYS: {
    id: 'DRIVER_7_DAYS',
    price: 300,
    days: 7,
    name: '7 Day Power Pass',
  },
};

@Schema({ timestamps: true, collection: 'subscriptions' })
export class Subscription {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  driverId: string;

  @Prop({ required: true, enum: Object.keys(PLANS) })
  planId: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true, index: true }) // Index for expiry checks
  endDate: Date;

  @Prop({ required: true, default: true, index: true })
  isActive: boolean;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Compound index to quickly find active sub for a driver
SubscriptionSchema.index({ driverId: 1, isActive: 1 });
