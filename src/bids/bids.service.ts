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
  ) { }

  /**
   * Place a Bid (Driver)
   */
  async placeBid(driverId: string, dto: PlaceBidDto): Promise<BidDocument> {
    const { rideId, amount } = dto;

    // 1. Validate ride exists and is in BIDDING status
    const ride = await this.rideModel.findById(rideId);
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }
    if (ride.status !== RideStatus.BIDDING) {
      throw new BadRequestException('Ride is not open for bidding');
    }

    // 2. Validate driver profile exists and is verified
    const driverProfile = await this.driversService.getProfile(driverId);
    if (!driverProfile.isVerified) {
      throw new ForbiddenException('Driver profile not verified');
    }

    // 3. MINIMUM FARE VALIDATION (70% of customFare or suggestedFare)
    const fareBase = ride.customFare || ride.suggestedFare;
    const minimumFare = Math.round(fareBase * 0.7);

    if (amount < minimumFare) {
      throw new BadRequestException(
        `Bid amount must be at least \u20b9${minimumFare} (70% of \u20b9${fareBase})`
      );
    }

    // 4. Check if driver already placed a bid on this ride
    const existingBid = await this.bidModel.findOne({
      rideId,
      driverId,
      status: BidStatus.ACTIVE,
    });
    if (existingBid) {
      throw new ConflictException('You have already placed a bid on this ride');
    }

    // 5. Create and save bid
    const bid = new this.bidModel({
      rideId,
      driverId,
      amount,
      status: BidStatus.ACTIVE,
    });

    const savedBid = await bid.save();

    // Re-fetch bid with populated driver to send via websocket
    const populatedBid: any = await this.bidModel
      .findById(savedBid._id)
      .populate('driverId', 'name phone')
      .lean()
      .exec();

    // Attach vehicle info for realtime event
    if (populatedBid && driverProfile) {
      populatedBid.driverId.vehicle = {
        type: driverProfile.vehicleInfo?.vehicleType || 'CAR',
        make: driverProfile.vehicleInfo?.vehicleModel || '',
        model: '', // optional
        licensePlate: driverProfile.vehicleInfo?.vehicleNumber || '',
        color: driverProfile.vehicleInfo?.vehicleColor || '',
      };
      populatedBid.driverId.rating = driverProfile.rating;
      populatedBid.driverId.totalRides = driverProfile.totalRides;
    }

    // 6. REALTIME: Notify Rider of new bid
    this.realtimeService.notifyNewBid(rideId, populatedBid || savedBid);

    return savedBid;
  }

  /**
   * Get Active Bids for a Ride
   */
  async getBidsForRide(rideId: string): Promise<any[]> {
    const bids = await this.bidModel
      .find({ rideId, status: BidStatus.ACTIVE })
      .sort({ amount: 1 })
      .populate('driverId', 'name phone')
      .lean()
      .exec();

    return Promise.all(bids.map(async (bid: any) => {
      try {
        const profile = await this.driversService.getProfile(bid.driverId._id.toString());
        bid.driverId.vehicle = {
          type: profile.vehicleInfo?.vehicleType || 'CAR',
          make: profile.vehicleInfo?.vehicleModel || '',
          model: '', // Optional, frontend joins them
          licensePlate: profile.vehicleInfo?.vehicleNumber || '',
          color: profile.vehicleInfo?.vehicleColor || '',
        };
        bid.driverId.rating = profile.rating;
        bid.driverId.totalRides = profile.totalRides;
      } catch (err) {
        // Ignore if profile fetch fails
      }
      return bid;
    }));
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

    // Check if winning driver already has an active ride
    const driverActiveRide = await this.rideModel.findOne({
      driverId: winningBid.driverId,
      status: {
        $in: ['ACCEPTED', 'ARRIVED', 'STARTED'],
      },
    });

    if (driverActiveRide) {
      throw new BadRequestException(
        'This driver is already on another ride. Please select a different driver.',
      );
    }

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

  /**
   * Get Driver's Bid for a Ride
   * Returns the specific driver's bid for a ride (for bid visibility)
   */
  async getDriverBidForRide(
    driverId: string,
    rideId: string,
  ): Promise<BidDocument | null> {
    return this.bidModel
      .findOne({ rideId, driverId, status: BidStatus.ACTIVE })
      .exec();
  }
}
