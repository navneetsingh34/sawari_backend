/**
 * Rides Service (Core Engine)
 *
 * Manages the entire lifecycle of a ride.
 * Enforces strict state transitions and business rules.
 *
 * Integrations:
 * - LocationService: For route calculation (Distance/ETA)
 * - Users/Drivers: For participant validation
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ride, RideDocument } from './schemas/ride.schema';
import { CreateRideDto } from './dto/create-ride.dto';
import { RideHistoryQueryDto } from './dto/ride-history-query.dto';
import { RideStatus } from './enums/ride-status.enum';
import { User } from '../users/schemas/user.schema';
import { UserRole } from '../common/constants/user-roles.constant';
import { LocationService } from '../location/location.service';
import { LocationUtil } from '../common/utils/location.util';
import { RealtimeService } from '../realtime/realtime.service';
import { CommissionsService } from '../commissions/commissions.service';

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
    private readonly locationService: LocationService,
    private readonly realtimeService: RealtimeService,
    private readonly commissionsService: CommissionsService,
  ) { }

  /**
   * Estimate Ride Fare
   */
  async estimateRide(estimateDto: any) {
    const { pickup, drop } = estimateDto;
    const route = await this.locationService.calculateRoute(
      pickup.latitude,
      pickup.longitude,
      drop.latitude,
      drop.longitude,
    );

    const estimatedFare = this.calculateFare(route.distanceMeters);

    return {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      estimatedFare,
    };
  }

  /**
   * Calculate Fare
   * Base Fare: 30
   * Per Km: 12
   */
  private calculateFare(distanceMeters: number): number {
    const distanceKm = distanceMeters / 1000;
    return Math.round(30 + distanceKm * 12);
  }

  /**
   * Create Ride Request (Rider)
   */
  async createRequest(
    riderId: string,
    createDto: CreateRideDto,
  ): Promise<RideDocument> {
    // Check if rider already has an active ride
    const existingActiveRide = await this.findActiveRide(riderId, UserRole.RIDER);
    if (existingActiveRide) {
      throw new BadRequestException(
        'You already have an active ride. Please complete or cancel it before creating a new one.',
      );
    }

    // ... existing logic ...
    const { pickup, drop } = createDto;
    const route = await this.locationService.calculateRoute(
      pickup.latitude,
      pickup.longitude,
      drop.latitude,
      drop.longitude,
    );
    const estimatedFare = this.calculateFare(route.distanceMeters);

    const ride = new this.rideModel({
      riderId,
      status: RideStatus.REQUESTED,
      pickupLocation: {
        type: 'Point',
        coordinates: [pickup.longitude, pickup.latitude],
        address: pickup.address,
      },
      dropLocation: {
        type: 'Point',
        coordinates: [drop.longitude, drop.latitude],
        address: drop.address,
      },
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      suggestedFare: estimatedFare,
      customFare: createDto.customFare, // Store rider's offered amount
    });

    const savedRide = await ride.save();
    return savedRide;
  }

  // ... skip to requestBidding ...

  async requestBidding(rideId: string, userId: string): Promise<RideDocument> {
    const ride = await this.findById(rideId);

    if (ride.riderId.toString() !== userId) {
      throw new ForbiddenException('Not your ride');
    }

    this.validateTransition(ride.status, RideStatus.BIDDING);

    ride.status = RideStatus.BIDDING;
    const updatedRide = await ride.save();

    // REALTIME: Alert Drivers
    this.realtimeService.alertDrivers(updatedRide);
    this.realtimeService.updateRideStatus(rideId, RideStatus.BIDDING);

    return updatedRide;
  }

  /**
   * Accept Ride (Driver)
   * Transitions: REQUESTED | BIDDING -> ACCEPTED
   */
  async acceptRide(rideId: string, driverId: string): Promise<RideDocument> {
    // Check if driver already has an active ride
    const existingActiveRide = await this.findActiveRide(driverId, UserRole.DRIVER);
    if (existingActiveRide) {
      throw new BadRequestException(
        'You already have an active ride. Please complete or cancel it before accepting a new one.',
      );
    }

    const ride = await this.findById(rideId);
    this.validateTransition(ride.status, RideStatus.ACCEPTED);

    ride.driverId = driverId;
    ride.status = RideStatus.ACCEPTED;
    const savedRide = await ride.save();

    // REALTIME: Notify Rider
    this.realtimeService.updateRideStatus(rideId, RideStatus.ACCEPTED, {
      driverId,
    });

    return savedRide;
  }

  /**
   * Driver Arrived (Driver)
   * Transitions: ACCEPTED -> ARRIVED
   */
  async driverArrived(
    rideId: string,
    driverId: string,
    location?: { lat: number; lng: number },
  ): Promise<RideDocument> {
    const ride = await this.findById(rideId);
    this.verifyDriver(ride, driverId);
    this.validateTransition(ride.status, RideStatus.ARRIVED);

    ride.status = RideStatus.ARRIVED;
    const saved = await ride.save();

    // REALTIME: Notify Rider with driver location
    this.realtimeService.updateRideStatus(rideId, RideStatus.ARRIVED);
    if (location) {
      this.realtimeService.notifyDriverArrived(rideId, location);
    }
    return saved;
  }

  /**
   * Cancel Ride (Rider/Driver)
   * Transitions: REQUESTED | BIDDING | ACCEPTED -> CANCELLED
   * Blocked if STARTED
   */
  async cancelRide(
    rideId: string,
    userId: string,
    role: string,
    reason?: string,
  ): Promise<RideDocument> {
    const ride = await this.findById(rideId);

    // Permission Check
    if (role === UserRole.RIDER && ride.riderId.toString() !== userId) {
      throw new ForbiddenException('Not your ride');
    }
    if (
      role === UserRole.DRIVER &&
      ride.driverId &&
      ride.driverId.toString() !== userId
    ) {
      throw new ForbiddenException('Not your ride assignment');
    }

    this.validateTransition(ride.status, RideStatus.CANCELLED);

    ride.status = RideStatus.CANCELLED;
    ride.cancelledBy = userId;
    ride.cancellationReason = reason || 'Cancelled by user';

    const saved = await ride.save();

    // REALTIME
    this.realtimeService.updateRideStatus(rideId, RideStatus.CANCELLED);
    return saved;
  }

  /**
   * Verify OTP and Start Ride (Driver)
   * Transitions: ARRIVED -> STARTED
   * Requires correct rider OTP
   */
  async verifyOtpAndStart(
    rideId: string,
    driverId: string,
    otp: string,
  ): Promise<RideDocument> {
    const ride = await this.rideModel
      .findById(rideId)
      .populate('riderId', 'riderOtp')
      .exec();

    if (!ride) throw new NotFoundException('Ride not found');

    // Idempotency: If already started, return without error
    if (ride.status === RideStatus.STARTED) {
      return ride;
    }

    this.verifyDriver(ride, driverId);
    this.validateTransition(ride.status, RideStatus.STARTED);

    // Verify OTP
    const rider = ride.riderId as any;
    if (!rider.riderOtp) {
      throw new BadRequestException('Rider OTP not found');
    }

    if (rider.riderOtp !== otp) {
      // Notify failure
      this.realtimeService.notifyOtpResult(
        rideId,
        false,
        'Incorrect OTP. Please try again.',
      );
      throw new BadRequestException('Incorrect OTP');
    }

    // OTP verified, start ride
    ride.status = RideStatus.STARTED;
    const saved = await ride.save();

    // REALTIME: Notify success
    this.realtimeService.notifyOtpResult(rideId, true, 'Ride started successfully');
    this.realtimeService.updateRideStatus(rideId, RideStatus.STARTED);

    return saved;
  }

  /**
   * Start Ride (Legacy - for backward compatibility)
   * Use verifyOtpAndStart instead
   */
  private async startRide(rideId: string, driverId: string): Promise<RideDocument> {
    const ride = await this.findById(rideId);
    this.verifyDriver(ride, driverId);
    this.validateTransition(ride.status, RideStatus.STARTED);

    ride.status = RideStatus.STARTED;
    const saved = await ride.save();

    // REALTIME
    this.realtimeService.updateRideStatus(rideId, RideStatus.STARTED);
    return saved;
  }

  async completeRide(rideId: string, driverId: string): Promise<RideDocument> {
    const ride = await this.rideModel
      .findById(rideId)
      .populate('riderId', '_id')
      .exec();

    if (!ride) throw new NotFoundException('Ride not found');
    this.verifyDriver(ride, driverId);
    this.validateTransition(ride.status, RideStatus.COMPLETED);

    // Check if payment was collected
    if (!ride.paymentCollected) {
      throw new BadRequestException('Payment must be collected before completing ride');
    }

    ride.status = RideStatus.COMPLETED;
    if (!ride.finalFare) {
      ride.finalFare = ride.suggestedFare;
    }
    const saved = await ride.save();

    // REALTIME
    this.realtimeService.updateRideStatus(rideId, RideStatus.COMPLETED);

    // FINANCIALS: Calculate Commission & Driver Earnings
    await this.commissionsService.calculateAndLog(saved);

    // Request review from rider
    const riderId = (ride.riderId as any)._id.toString();
    this.realtimeService.requestReview(riderId, rideId, driverId);

    return saved;
  }


  async findAll(userId: string, role: string, query: RideHistoryQueryDto) {
    const { page = 1, limit = 10 } = query;
    const filter =
      role === UserRole.RIDER ? { riderId: userId } : { driverId: userId };

    const rides = await this.rideModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.rideModel.countDocuments(filter);

    return {
      data: rides,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find Available Rides (For Drivers)
   * Returns rides with REQUESTED or BIDDING status
   */
  async findAvailableRides(): Promise<RideDocument[]> {
    return this.rideModel
      .find({
        status: { $in: [RideStatus.REQUESTED, RideStatus.BIDDING] },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  /**
   * Find Active Ride (Persistence)
   * Returns the single unfinished ride for a user (if any).
   */
  async findActiveRide(userId: string, role: string): Promise<RideDocument | null> {
    const filter =
      role === UserRole.RIDER ? { riderId: userId } : { driverId: userId };

    // Active statuses: NOT Completed, NOT Cancelled
    return this.rideModel.findOne({
      ...filter,
      status: {
        $in: [
          RideStatus.REQUESTED,
          RideStatus.BIDDING,
          RideStatus.ACCEPTED,
          RideStatus.ARRIVED,
          RideStatus.STARTED
        ]
      }
    }).sort({ createdAt: -1 }); // Get most recent
  }

  private async findById(id: string): Promise<RideDocument> {
    const ride = await this.rideModel.findById(id);
    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }

  /**
   * Get Ride Details with Driver/Rider Info
   * For detail page - populates driver and rider data
   */
  async getRideDetails(rideId: string): Promise<RideDocument> {
    const ride = await this.rideModel.findById(rideId)
      .populate('riderId', 'name phone email')
      .populate('driverId', 'name phone email')
      .exec();

    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }

  private verifyDriver(ride: RideDocument, driverId: string) {
    if (!ride.driverId || ride.driverId.toString() !== driverId) {
      throw new ForbiddenException('You are not assigned to this ride');
    }
  }

  /**
   * State Machine Validator
   * Centralized logic to prevent invalid lifecycle moves
   */
  private validateTransition(current: RideStatus, next: RideStatus) {
    if (current === RideStatus.CANCELLED || current === RideStatus.COMPLETED) {
      throw new BadRequestException(`Ride is already ${current}`);
    }

    if (next === RideStatus.CANCELLED) {
      if (current === RideStatus.STARTED) {
        throw new BadRequestException(
          'Cannot cancel a ride that has started. Please end trip.',
        );
      }
      return; // Validation passed for cancellation (before start)
    }

    const validTransitions: Record<string, RideStatus[]> = {
      [RideStatus.REQUESTED]: [
        RideStatus.BIDDING,
        RideStatus.ACCEPTED,
        RideStatus.CANCELLED,
      ],
      [RideStatus.BIDDING]: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
      [RideStatus.ACCEPTED]: [RideStatus.ARRIVED, RideStatus.STARTED, RideStatus.CANCELLED], // Added ARRIVED. Keeping STARTED for backward compat/legacy flows if needed, but ideally ACCEPTED->ARRIVED->STARTED
      [RideStatus.ARRIVED]: [RideStatus.STARTED, RideStatus.CANCELLED],
      [RideStatus.STARTED]: [RideStatus.COMPLETED],
    };

    if (!validTransitions[current]?.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from ${current} to ${next}`,
      );
    }
  }

  /**
   * Get Contact Info (Call Feature)
   * Returns the phone number of the *other* party.
   */
  async getRideContact(rideId: string, userId: string): Promise<{ phone: string; name: string }> {
    const ride = await this.rideModel.findById(rideId)
      .populate('riderId', 'phone name')
      .populate('driverId', 'phone name');

    if (!ride) throw new NotFoundException('Ride not found');

    // Helper to safely get ID string whether populated or not
    const getIsSameUser = (userOrId: any, id: string) => {
      const uId = userOrId._id ? userOrId._id.toString() : userOrId.toString();
      return uId === id;
    };

    // 1. If requester is Driver, return Rider's info
    if (ride.driverId && getIsSameUser(ride.driverId, userId)) {
      const rider = ride.riderId as any;
      return { phone: rider.phone, name: rider.name };
    }

    // 2. If requester is Rider, return Driver's info
    if (getIsSameUser(ride.riderId, userId)) {
      if (!ride.driverId) throw new BadRequestException('No driver assigned yet');
      const driver = ride.driverId as any;
      return { phone: driver.phone, name: driver.name };
    }

    throw new ForbiddenException('Not a participant in this ride');
  }

  /**
   * Collect Payment (Driver)
   * Marks payment as collected and stores payment method
   */
  async collectPayment(
    rideId: string,
    driverId: string,
    paymentMethod: string,
    amount: number,
  ): Promise<RideDocument> {
    const ride = await this.findById(rideId);
    this.verifyDriver(ride, driverId);

    if (ride.status !== RideStatus.STARTED) {
      throw new BadRequestException('Can only collect payment during active ride');
    }

    ride.paymentMethod = paymentMethod;
    ride.paymentCollected = true;
    ride.finalFare = amount;

    const saved = await ride.save();

    // REALTIME: Notify both parties
    this.realtimeService.notifyPaymentCollected(rideId, paymentMethod);

    return saved;
  }

  /**
   * Submit Review (Rider)
   * Allows rider to rate driver after ride completion
   */
  async submitReview(
    rideId: string,
    riderId: string,
    rating: number,
    review?: string,
  ): Promise<RideDocument> {
    const ride = await this.rideModel
      .findById(rideId)
      .populate('driverId', '_id')
      .exec();

    if (!ride) throw new NotFoundException('Ride not found');

    if (ride.riderId.toString() !== riderId) {
      throw new ForbiddenException('Not your ride');
    }

    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed rides');
    }

    if (ride.driverRating) {
      throw new BadRequestException('Review already submitted');
    }

    ride.driverRating = rating;
    ride.riderReview = review;
    ride.reviewedAt = new Date();

    const saved = await ride.save();

    // Update driver's average rating
    await this.updateDriverRating((ride.driverId as any)._id.toString());

    // REALTIME: Notify driver
    this.realtimeService.notifyReviewSubmitted(
      (ride.driverId as any)._id.toString(),
      rideId,
      rating,
    );

    return saved;
  }

  /**
   * Update Driver's Average Rating
   * Calculates average rating from all completed rides
   */
  private async updateDriverRating(driverId: string): Promise<void> {
    const rides = await this.rideModel
      .find({
        driverId,
        status: RideStatus.COMPLETED,
        driverRating: { $exists: true, $ne: null },
      })
      .select('driverRating')
      .exec();

    if (rides.length === 0) return;

    const totalRating = rides.reduce((sum, ride) => sum + (ride.driverRating || 0), 0);
    const averageRating = totalRating / rides.length;

    // Update driver profile (assuming DriversService has this method)
    // This would need to be implemented in DriversService
    this.logger.log(
      `Driver ${driverId} average rating: ${averageRating.toFixed(2)} from ${rides.length} reviews`,
    );
  }
}
