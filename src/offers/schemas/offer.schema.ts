import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OfferDocument = Offer & Document;

@Schema({ timestamps: true, collection: 'offers' })
export class Offer {
  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true, enum: ['FLAT', 'PERCENT'] })
  discountType: string;

  @Prop({ required: true })
  discountValue: number; // e.g. 50 flat, or 20 percent

  @Prop({ required: true, default: 0 })
  minRideAmount: number;

  @Prop({ required: false })
  maxDiscount?: number; // Cap for percentage discounts

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ required: true, default: 1 })
  usageLimit: number; // Max total usage across platform

  @Prop({ required: true, default: 0 })
  usedCount: number;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
