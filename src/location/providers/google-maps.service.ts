/**
 * Google Maps Service Implementation
 *
 * Concrete implementation of the MapService interface using Google Maps API.
 *
 * Current Status:
 * - Mocked implementation (uses Haversine for offline calc)
 * - Prepared for real API integration
 *
 * Why mock?
 * - Avoid costs during dev/test
 * - Works without API keys
 * - Faster feedback loop
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MapService, DistanceMatrixResult } from '../interfaces/map.interface';
import { LocationUtil } from '../../common/utils/location.util';

@Injectable()
export class GoogleMapsService implements MapService {
  private readonly logger = new Logger(GoogleMapsService.name);

  constructor(private configService: ConfigService) {}

  async calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<DistanceMatrixResult> {
    // 1. Calculate realistic distance using Haversine (straight line)
    // In reality, road distance is ~1.3x straight line
    const straightDistance = LocationUtil.calculateHaversineDistance(
      originLat,
      originLng,
      destLat,
      destLng,
    );
    const estimatedRoadDistance = Math.round(straightDistance * 1.3);

    // 2. Estimate duration based on average city speed (30 km/h = 8.33 m/s)
    const averageSpeedMps = 8.33;
    const estimatedDuration = Math.round(
      estimatedRoadDistance / averageSpeedMps,
    );

    this.logger.debug(
      `[MOCK] Calculated route: ${estimatedRoadDistance}m / ${estimatedDuration}s`,
    );

    return {
      distanceMeters: estimatedRoadDistance,
      durationSeconds: estimatedDuration,
    };
  }

  async getAddress(lat: number, lng: number): Promise<string> {
    this.logger.debug(`[MOCK] Reverse geocoding for ${lat}, ${lng}`);
    return `Mock Address at [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
  }
}
