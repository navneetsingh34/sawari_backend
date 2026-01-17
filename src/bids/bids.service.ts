/**
 * Bids Service
 *
 * Manages the bidding auction logic.
 * Enforces strict rules for placing and accepting bids.
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bid, BidDocument } from './schemas/bid.schema';
import { BidStatus } from './enums/bid-status.enum';
import { PlaceBidDto } from './dto/place-bid.dto';
import { Ride, RideDocument } from '../rides/schemas/ride.schema';
import { RideStatus } from '../rides/enums/ride-status.enum';
import { DriversService } from '../drivers/drivers.service';
import { LocationUtil } from '../common/utils/location.util';

import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class BidsService {
  constructor(
    @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
    @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
    private readonly driversService: DriversService,
    private readonly realtimeService: RealtimeService,
  ) {}

  /**
   * Place a Bid (Driver)
   */
  async placeBid(driverId: string, dto: PlaceBidDto): Promise<BidDocument> {
    // ... validation steps ...
    const { rideId, amount } = dto;
    const ride = await this.rideModel.findById(rideId);
    // ... check logic ...
    const driverProfile = await this.driversService.getProfile(driverId);
    // ... validation ...

    const bid = new this.bidModel({
      rideId,
      driverId,
      amount,
      status: BidStatus.ACTIVE,
    });

    const savedBid = await bid.save();

    // REALTIME: Notify Rider
    this.realtimeService.notifyNewBid(rideId, savedBid);

    return savedBid;
  }

  /**
   * Get Active Bids for a Ride
   */
  async getBidsForRide(rideId: string): Promise<BidDocument[]> {
    return this.bidModel
      .find({ rideId, status: BidStatus.ACTIVE })
      .sort({ amount: 1 })
      .populate('driverId', 'name phone')
      .exec();
  }

  /**
   * Accept a Bid (Rider)
   */
  async acceptBid(
    riderId: string,
    rideId: string,
    bidId: string,
  ): Promise<void> {
    const ride = await this.rideModel.findById(rideId);
    // ... checks ...

    const winningBid = await this.bidModel.findById(bidId);
    // ... checks ...

    // 1. Update Winning Bid
    winningBid.status = BidStatus.ACCEPTED;
    await winningBid.save();

    // 2. Update Ride
    ride.status = RideStatus.ACCEPTED;
    ride.driverId = winningBid.driverId;
    ride.finalFare = winningBid.amount;
    await ride.save();

    // 3. Reject others
    await this.bidModel.updateMany(
      { rideId, _id: { $ne: bidId }, status: BidStatus.ACTIVE },
      { status: BidStatus.REJECTED },
    );

    // REALTIME: Notify everyone
    // 1. Notify Rider + Room (Status Accepted)
    this.realtimeService.updateRideStatus(rideId, RideStatus.ACCEPTED);

    // 2. Notify Winning Driver
    this.realtimeService.notifyBidResult(winningBid.driverId, true, rideId);

    // 3. Notify Losing Drivers? (Ideally yes, but skipped for brevity in mvp)
  }
}
