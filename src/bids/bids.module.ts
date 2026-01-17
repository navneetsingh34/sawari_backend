import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { Bid, BidSchema } from './schemas/bid.schema';
import { Ride, RideSchema } from '../rides/schemas/ride.schema';
import { DriversModule } from '../drivers/drivers.module';
import { RidesModule } from '../rides/rides.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bid.name, schema: BidSchema },
      { name: Ride.name, schema: RideSchema }, // Direct access for transactional updates
    ]),
    DriversModule, // For driver online check
    RidesModule, // For ride state definitions (and potential future circular use)
    RealtimeModule,
  ],
  controllers: [BidsController],
  providers: [BidsService],
  exports: [BidsService],
})
export class BidsModule {}
