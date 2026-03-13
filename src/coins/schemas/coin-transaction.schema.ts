import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CoinTransactionDocument = CoinTransaction & Document;

@Schema({ timestamps: true, collection: 'coin_transactions' })
export class CoinTransaction {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['EARNED', 'REDEEMED', 'REVERTED'] })
  type: string;

  @Prop({ required: true })
  reason: string; // e.g. "Ride #12345 Completed", "Referral Bonus"

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Ride', required: false })
  rideId?: string;
}

export const CoinTransactionSchema = SchemaFactory.createForClass(CoinTransaction);
