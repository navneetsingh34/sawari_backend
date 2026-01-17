import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CommissionLog,
  CommissionLogDocument,
} from './schemas/commission.schema';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { RideDocument } from '../rides/schemas/ride.schema';
import { WalletService } from '../wallet/wallet.service';
import { TransactionReason } from '../wallet/schemas/transaction.schema';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);
  private readonly COMMISSION_RATE = 0.1; // 10% Standard

  constructor(
    @InjectModel(CommissionLog.name)
    private commissionModel: Model<CommissionLogDocument>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Process Commission for Compelted Ride
   *
   * Flow:
   * 1. Check Idempotency (Skip if already processed).
   * 2. Check Subscription Status (0% if active).
   * 3. Calculate & Persist.
   * 4. Update Wallet (Credit Ride Earning, Debit Commission).
   */
  async calculateAndLog(
    ride: RideDocument,
  ): Promise<CommissionLogDocument | null> {
    const rideIdStr = ride._id.toString();

    // 1. Idempotency Check
    const existing = await this.commissionModel.findOne({
      rideId: ride._id as any,
    });
    if (existing) {
      this.logger.warn(`Commission already applied for ride ${rideIdStr}`);
      return existing;
    }

    // 2. Determine Rate
    // If subscribed, rate is 0. Else 10%.
    const isSubscribed = await this.subscriptionsService.isSubscriptionActive(
      ride.driverId,
    );
    const rate = isSubscribed ? 0 : this.COMMISSION_RATE;

    const grossFare = ride.finalFare || ride.suggestedFare;
    const commissionAmount = Math.ceil(grossFare * rate); // Ceil for safety
    const netPayout = grossFare - commissionAmount;

    // 3. Save Log
    const log = new this.commissionModel({
      rideId: ride._id,
      driverId: ride.driverId,
      grossFare,
      commissionRate: rate,
      commissionAmount,
      netPayout,
      appliedAt: new Date(),
    });

    await log.save();

    // 4. WALLET INTEGRATION
    try {
      // A. Credit Gross Earning
      await this.walletService.creditWallet(
        ride.driverId,
        grossFare,
        TransactionReason.RIDE_EARNING,
        rideIdStr, // Reference Ride
        { commissionRate: rate, netPayout },
      );

      // B. Debit Commission (if applicable)
      if (commissionAmount > 0) {
        await this.walletService.debitWallet(
          ride.driverId,
          commissionAmount,
          TransactionReason.COMMISSION,
          rideIdStr, // Same Reference (Links credit & debit)
          { rate, grossFare },
          true, // Allow negative? Maybe not. But commission is mandatory.
        );
      }
    } catch (error) {
      this.logger.error(`Failed to update wallet for ride ${rideIdStr}`, error);
      // NOTE: In production, consider rolling back or using a saga pattern.
      // For now, we log the error. The commission log is saved, so we can reconcile later.
    }

    this.logger.log(
      `Commission applied for ride ${rideIdStr}: Rate ${rate}, Amount ${commissionAmount}`,
    );

    return log;
  }

  /**
   * Get Driver's Commission History
   */
  async getDriverLogs(driverId: string) {
    return this.commissionModel
      .find({ driverId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Admin Report
   */
  async getAllLogs() {
    return this.commissionModel
      .find()
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 })
      .exec();
  }
}
