import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSettings, UserSettingsDocument } from './schemas/user-settings.schema';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(UserSettings.name) private settingsModel: Model<UserSettingsDocument>,
  ) {}

  async getSettings(userId: string): Promise<UserSettingsDocument> {
    let settings = await this.settingsModel.findOne({ userId }).exec();
    
    // Auto-create default settings if none exist
    if (!settings) {
      settings = new this.settingsModel({ userId });
      await settings.save();
    }
    
    return settings;
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto): Promise<UserSettingsDocument> {
    const settings = await this.settingsModel.findOneAndUpdate(
      { userId },
      { $set: dto },
      { new: true, upsert: true } // Create if doesn't exist
    ).exec();

    return settings;
  }
}
