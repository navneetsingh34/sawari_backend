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

@Injectable()
export class DriversService {
  constructor(
    @InjectModel(DriverProfile.name)
    private driverModel: Model<DriverProfileDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

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

    return this.driverModel
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
  }
}
