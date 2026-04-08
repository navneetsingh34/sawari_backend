import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { Ride, RideSchema } from './schemas/ride.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { LocationModule } from '../location/location.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { RidesCleanupService } from './cron/rides-cleanup.service';
import { DriverProfile, DriverProfileSchema } from '../drivers/schemas/driver-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ride.name, schema: RideSchema },
      { name: User.name, schema: UserSchema },
      { name: DriverProfile.name, schema: DriverProfileSchema },
    ]),
    forwardRef(() => LocationModule), // Required for distance/eta
    forwardRef(() => RealtimeModule),
    CommissionsModule,
  ],
  controllers: [RidesController],
  providers: [RidesService, RidesCleanupService],
  exports: [RidesService],
})
export class RidesModule { }
