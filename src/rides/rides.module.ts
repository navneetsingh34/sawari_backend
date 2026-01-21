import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { Ride, RideSchema } from './schemas/ride.schema';
import { LocationModule } from '../location/location.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { RidesCleanupService } from './cron/rides-cleanup.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ride.name, schema: RideSchema }]),
    forwardRef(() => LocationModule), // Required for distance/eta
    forwardRef(() => RealtimeModule),
    CommissionsModule,
  ],
  controllers: [RidesController],
  providers: [RidesService, RidesCleanupService],
  exports: [RidesService],
})
export class RidesModule { }
