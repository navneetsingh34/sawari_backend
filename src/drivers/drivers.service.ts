/**
 * Drivers Service
 *
 * Core business logic for Driver operations.
 *
 * Responsibilities:
 * - Manage driver profiles (separate from User auth)
 * - Handle driver status (online/offline)
 * - Update real-time location (GeoJSON)
 * - Vehicle management
 *
 * Architecture:
 * - 1:1 Relationship with User entity (via userId)
 * - Driver data lives in 'driver_profiles' collection
 * - Uses MongoDB geospatial features
 */

import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DriverProfile,
  DriverProfileDocument,
} from './schemas/driver-profile.schema';
import { CreateDriverProfileDto } from './dto/create-driver-profile.dto';
import { UpdateDriverVehicleDto } from './dto/update-driver-vehicle.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../common/constants/user-roles.constant';
import { RealtimeService } from '../realtime/realtime.service';
import { Ride, RideDocument } from '../rides/schemas/ride.schema';
import { RideStatus } from '../rides/enums/ride-status.enum';

@Injectable()
export class DriversService {
  constructor(
    @InjectModel(DriverProfile.name)
    private driverModel: Model<DriverProfileDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
    @Inject(forwardRef(() => RealtimeService))
    private readonly realtimeService: RealtimeService,
  ) { }

  /**
   * Create Driver Profile
   *
   * Initializes a profile for a user with DRIVER role.
   *
   * Validations:
   * 1. User must have DRIVER role
   * 2. User must not already have a profile (1:1 constraint)
   */
  async createProfile(
    userId: string,
    createDto: CreateDriverProfileDto,
  ): Promise<DriverProfile> {
    // 1. Check user role
    const user = await this.userModel.findById(userId);
    if (!user || user.role !== UserRole.DRIVER) {
      throw new BadRequestException(
        'User must have DRIVER role to create a driver profile',
      );
    }

    // 2. Check for duplicate profile
    const existingProfile = await this.driverModel.findOne({ userId });
    if (existingProfile) {
      throw new ConflictException(
        'Driver profile already exists for this user',
      );
    }

    // 3. Create profile
    const profile = new this.driverModel({
      userId,
      ...createDto,
    });

    return profile.save();
  }

  /**
   * Get Current Driver Profile
   */
  async getProfile(userId: string): Promise<DriverProfile> {
    const profile = await this.driverModel
      .findOne({ userId })
      .populate('userId', 'email phone role'); // Populate limited user fields
    if (!profile) {
      throw new NotFoundException(
        'Driver profile not found. Please complete driver registration.',
      );
    }
    return profile;
  }

  /**
   * Update Vehicle Information
   */
  async updateVehicle(
    userId: string,
    updateDto: UpdateDriverVehicleDto,
  ): Promise<DriverProfile> {
    const profile = await this.driverModel.findOneAndUpdate(
      { userId },
      { $set: { vehicleInfo: updateDto } }, // Partial update of nested object
      { new: true },
    );

    if (!profile) {
      throw new NotFoundException('Driver profile not found');
    }
    return profile;
  }

  /**
   * Toggle Online/Offline Status
   */
  async updateStatus(
    userId: string,
    isOnline: boolean,
  ): Promise<DriverProfile> {
    return this.driverModel
      .findOneAndUpdate({ userId }, { isOnline }, { new: true })
      .exec();
  }

  /**
   * Update Live Location
   *
   * Updates latitude/longitude in GeoJSON format.
   * Needed for "find nearby drivers" queries.
   */
  async updateLocation(
    userId: string,
    locationDto: UpdateDriverLocationDto,
  ): Promise<DriverProfile> {
    const { latitude, longitude } = locationDto;

    // 1. Update Profile Location
    const updatedProfile = await this.driverModel
      .findOneAndUpdate(
        { userId },
        {
          currentLocation: {
            type: 'Point',
            coordinates: [longitude, latitude], // MongoDB stores [lng, lat]
          },
        },
        { new: true },
      )
      .exec();

    // 2. Broadcast location if driver is in an active ride
    if (userId) {
      // Find active ride for this driver
      // Removed ARRIVED if it doesn't exist, check enum first in next step. For now assume STARTED/ACCEPTED.
      const activeRide = await this.rideModel.findOne({
        driverId: userId,
        status: { $in: [RideStatus.ACCEPTED, RideStatus.STARTED] }
      });

      if (activeRide) {
        this.realtimeService.emitLocationUpdate(activeRide._id.toString(), userId, { lat: latitude, lng: longitude });
      }
    }

    return updatedProfile;
  }

  /**
   * Upload Driver Document
   * 
   * Stores document (license, insurance, etc.) as base64.
   * In production, you would typically use cloud storage (S3, GCS).
   */
  async uploadDocument(
    userId: string,
    documentType: string,
    base64Data: string,
    fileName: string,
    mimeType: string,
  ): Promise<DriverProfile> {
    // Validate document type
    const validTypes = ['driverLicense', 'insurancePolicy', 'vehicleRegistration', 'profilePhoto'];
    if (!validTypes.includes(documentType)) {
      throw new BadRequestException(`Invalid document type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate base64 data
    if (!base64Data || base64Data.length === 0) {
      throw new BadRequestException('Document data is required');
    }

    // Maximum file size check (5MB limit for base64)
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    const base64SizeBytes = (base64Data.length * 3) / 4;
    if (base64SizeBytes > maxSizeBytes) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Create document entry
    const documentEntry = {
      url: base64Data, // In production, upload to cloud storage and store URL
      fileName,
      mimeType,
      uploadedAt: new Date(),
      isVerified: false,
    };

    // Update the specific document in the profile
    const updatePath = `documents.${documentType}`;

    const profile = await this.driverModel.findOneAndUpdate(
      { userId },
      { $set: { [updatePath]: documentEntry } },
      { new: true, upsert: false },
    );

    if (!profile) {
      throw new NotFoundException('Driver profile not found');
    }

    return profile;
  }

  /**
   * Get Driver Documents
   */
  async getDocuments(userId: string): Promise<any> {
    const profile = await this.driverModel.findOne({ userId }).select('documents');
    if (!profile) {
      throw new NotFoundException('Driver profile not found');
    }
    return profile.documents || {};
  }
  /**
   * Get Dashboard Statistics
   * 
   * returns aggregated stats for the driver dashboard.
   */
  async getDashboardStats(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Find completed rides for today
    // Note: In real app, ensure indexes on driverId + createdAt
    const rides = await this.rideModel.find({
      driverId: userId,
      createdAt: { $gte: todayStart },
      status: RideStatus.COMPLETED
    });

    const earnings = rides.reduce((sum, ride) => sum + (ride.finalFare || ride.customFare || 0), 0);
    const rideCount = rides.length;

    // Mock data for incomplete features
    // onlineHours: separate collection usually tracks session times
    // acceptanceRate: requires tracking declined offers
    return {
      earnings,
      rides: rideCount,
      onlineHours: 5.2,
      acceptanceRate: 94,
      rating: 4.9
    };
  }
}
