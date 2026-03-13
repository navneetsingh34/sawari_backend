/**
 * Payment Schema
 *
 * Stores mock payment transactions for Razorpay simulation.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
  @Prop({ required: true, unique: true })
  orderId: string; // E.g. 'order_12345'

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Ride', required: false })
  rideId?: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['UPI', 'CARD', 'WALLET'] })
  method: string;

  @Prop({ required: true, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' })
  status: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
