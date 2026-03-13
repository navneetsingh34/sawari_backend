import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type HelpTicketDocument = HelpTicket & Document;

@Schema({ timestamps: true, collection: 'help_tickets' })
export class HelpTicket {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Ride', required: false })
  rideId?: string;

  @Prop({ required: true })
  category: string; // e.g., 'Payment Issue', 'Lost Item', 'Driver Behavior'

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN' })
  status: string;
}

export const HelpTicketSchema = SchemaFactory.createForClass(HelpTicket);
