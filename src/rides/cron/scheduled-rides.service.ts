import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ride, RideDocument } from '../schemas/ride.schema';
import { RideStatus } from '../enums/ride-status.enum';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class ScheduledRidesService {
    private readonly logger = new Logger(ScheduledRidesService.name);

    constructor(
        @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
        private readonly realtimeService: RealtimeService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        this.logger.debug('Checking for upcoming scheduled rides to dispatch...');

        // We dispatch 30 minutes prior to scheduled time
        const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000);

        // Find scheduled rides that:
        // - are still REQUESTED
        // - haven't been dispatched yet (isDispatched !== true)
        // - are scheduled to happen within the next 30 minutes
        const upcomingRides = await this.rideModel.find({
            status: RideStatus.REQUESTED,
            isScheduled: true,
            isDispatched: { $ne: true },
            scheduledAt: { $lte: thirtyMinutesFromNow, $gt: new Date() } // Sanity check: must be in the future
        });

        if (upcomingRides.length === 0) {
            return;
        }

        this.logger.log(`Found ${upcomingRides.length} upcoming scheduled rides. Dispatching to drivers...`);

        for (const ride of upcomingRides) {
            // Alert nearby drivers via the real-time service
            this.realtimeService.alertDrivers(ride);

            // Mark as dispatched so we don't alert them again on the next minute
            ride.isDispatched = true;
            await ride.save();
            
            this.logger.log(`Dispatched scheduled ride ${ride._id}.`);
        }
    }
}
