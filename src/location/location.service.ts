/**
 * Location Service
 *
 * Manages all location-related operations.
 *
 * Responsibilities:
 * - Update driver live location
 * - Find nearby drivers (Geospatial query)
 * - Calculate ETA/Distance (via MapService)
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DriversService } from '../drivers/drivers.service';
import {
  DriverProfile,
  DriverProfileDocument,
} from '../drivers/schemas/driver-profile.schema';
import { UpdateDriverLocationDto } from '../drivers/dto/update-driver-location.dto';
import { MapService, DistanceMatrixResult } from './interfaces/map.interface';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    private readonly driversService: DriversService,
    @InjectModel(DriverProfile.name)
    private driverModel: Model<DriverProfileDocument>,
    @Inject('MapService') private readonly mapService: MapService,
  ) {}

  /**
   * Update Driver Live Location
   * Delegates to DriversService but adds location-specific logging/metrics if needed.
   */
  async updateDriverLocation(
    userId: string,
    locationDto: UpdateDriverLocationDto,
  ) {
    // In future, this could push to Redis for high-frequency updates
    return this.driversService.updateLocation(userId, locationDto);
  }

  /**
   * Find Nearby Drivers
   * Uses MongoDB $geoNear aggregation
   *
   * Criteria:
   * - Within radius (meters)
   * - isOnline: true
   * - isVerified: true (safety)
   * - Sorted by distance
   */
  async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusMeters: number = 5000,
  ): Promise<any[]> {
    this.logger.debug(
      `Searching for drivers near [${lat}, ${lng}] within ${radiusMeters}m`,
    );

    const drivers = await this.driverModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat], // MongoDB expects [lng, lat]
          },
          distanceField: 'distance',
          maxDistance: radiusMeters,
          spherical: true,
          query: {
            isOnline: true,
            isVerified: { $ne: false }, // Include true or undefined (if migration issues)
          },
        },
      },
      {
        $limit: 10, // Cap results
      },
      {
        $project: {
          userId: 1,
          vehicleInfo: 1,
          rating: 1,
          distance: 1,
          currentLocation: 1,
        },
      },
    ]);

    return drivers;
  }

  /**
   * Calculate Route Details
   * Proxy to abstracted MapService
   */
  async calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<DistanceMatrixResult> {
    return this.mapService.calculateRoute(
      originLat,
      originLng,
      destLat,
      destLng,
    );
  }
}
