import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserSettingsDocument = UserSettings & Document;

@Schema({ timestamps: true, collection: 'user_settings' })
export class UserSettings {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: string;

  @Prop({ default: 'en' })
  language: string;

  @Prop({ type: Object, default: { rides: true, promos: true, sos: true } })
  notificationPrefs: { rides: boolean; promos: boolean; sos: boolean };

  @Prop({ default: 'light', enum: ['light', 'dark', 'system'] })
  theme: string;

  @Prop({ type: Object, default: { showProfilePhoto: true, shareRideStatus: true } })
  privacy: { showProfilePhoto: boolean; shareRideStatus: boolean };
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettings);
