import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { Ride, RideSchema } from './schemas/ride.schema';
import { LocationModule } from '../location/location.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CommissionsModule } from '../commissions/commissions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ride.name, schema: RideSchema }]),
    LocationModule, // Required for distance/eta
    RealtimeModule,
    CommissionsModule,
  ],
  controllers: [RidesController],
  providers: [RidesService],
  exports: [RidesService],
})
export class RidesModule {}
