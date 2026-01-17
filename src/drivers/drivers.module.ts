import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import {
  DriverProfile,
  DriverProfileSchema,
} from './schemas/driver-profile.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DriverProfile.name, schema: DriverProfileSchema },
      { name: User.name, schema: UserSchema }, // Need User model for role checking
    ]),
  ],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
