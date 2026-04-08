import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ride, RideDocument } from '../schemas/ride.schema';
import { RideStatus } from '../enums/ride-status.enum';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class RidesCleanupService {
    private readonly logger = new Logger(RidesCleanupService.name);

    constructor(
        @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
        private readonly realtimeService: RealtimeService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        this.logger.debug('Checking for expired ride requests...');

        // Threshold: 10 minutes ago
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        // Find rides that are stuck in REQUESTED or BIDDING for > 10 mins
        const expiredRides = await this.rideModel.find({
            status: { $in: [RideStatus.REQUESTED, RideStatus.BIDDING] },
            createdAt: { $lt: tenMinutesAgo },
        });

        if (expiredRides.length === 0) {
            return;
        }

        this.logger.log(`Found ${expiredRides.length} expired rides. Cancelling...`);

        for (const ride of expiredRides) {
            ride.status = RideStatus.CANCELLED;
            ride.cancellationReason = 'No driver found (Auto-expired)';
            ride.cancelledBy = 'SYSTEM';
            await ride.save();

            // Notify Rider
            this.realtimeService.updateRideStatus(
                ride._id.toString(),
                RideStatus.CANCELLED,
                { reason: ride.cancellationReason },
            );
        }
    }
}
