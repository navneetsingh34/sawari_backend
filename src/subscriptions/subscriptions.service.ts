/**
 * Subscriptions Service
 *
 * Manages driver plans, expiry, and priority status.
 */

import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
  PLANS,
} from './schemas/subscription.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

import { WalletService } from '../wallet/wallet.service';
import {
  TransactionType,
  TransactionReason,
} from '../wallet/schemas/transaction.schema';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Purchase a Plan
   * Mock payment logic -> Direct activation
   */
  async purchasePlan(
    driverId: string,
    dto: CreateSubscriptionDto,
  ): Promise<SubscriptionDocument> {
    const { planId } = dto;
    const plan = PLANS[planId];

    // 1. Check for existing active subscription
    const activeSub = await this.isSubscriptionActive(driverId);
    if (activeSub) {
      throw new ConflictException('You already have an active subscription');
    }

    // 2. PAYMENT: Debit Wallet
    //
    // GATEWAY ABSTRACTION EXPLANATION:
    // In a real production system, this step would involve:
    // a. Initiating a payment intent with Stripe/Razorpay
    // b. Identifying if the user wants to use Wallet Balance OR External Card
    // c. If External Card: Charge card -> Credit Wallet -> Debit Wallet (for consistency)
    // d. If Wallet Balance: Directly debit (as done here)
    //
    // For now, we assume the wallet is pre-funded or this is a direct debit.
    await this.walletService.debitWallet(
      driverId,
      plan.price,
      TransactionReason.SUBSCRIPTION,
      planId, // Use planId as reference
      { planDays: plan.days },
      false, // Do not allow overdraft for subscriptions
    );

    // 3. Calculate Validity
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.days);

    // 4. Create Record
    const subscription = new this.subscriptionModel({
      driverId,
      planId,
      price: plan.price,
      startDate,
      endDate,
      isActive: true,
    });

    this.logger.log(`Driver ${driverId} purchased ${planId}`);
    return subscription.save();
  }

  /**
   * Check Active Status (Lazy Expiry)
   * If found but expired, deactivate it and return false.
   */
  async isSubscriptionActive(driverId: string): Promise<boolean> {
    const sub = await this.subscriptionModel.findOne({
      driverId,
      isActive: true,
    });

    if (!sub) return false;

    // Check expiry
    if (sub.endDate < new Date()) {
      this.logger.debug(
        `Subscription for ${driverId} expired on ${sub.endDate}. Deactivating...`,
      );
      sub.isActive = false;
      await sub.save();
      return false;
    }

    return true;
  }

  /**
   * Get Current Subscription Details
   */
  async getMySubscription(
    driverId: string,
  ): Promise<SubscriptionDocument | null> {
    // Trigger lazy check first to ensure data accuracy
    await this.isSubscriptionActive(driverId);

    return this.subscriptionModel.findOne({
      driverId,
      isActive: true,
    });
  }

  /**
   * Helper: Is Driver Eligible for Priority?
   * Used by Bidding / Commission modules
   */
  async isDriverPriority(driverId: string): Promise<boolean> {
    return this.isSubscriptionActive(driverId);
  }
}
