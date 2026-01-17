/**
 * Location Utilities
 *
 * Helper functions for handling geospatial data.
 * Used across Location, Drivers, and Rides modules.
 *
 * Why here?
 * - Reusability: Validation logic needed in DTOs and Services
 * - Consistency: Single source of truth for GeoJSON format
 * - Offline Fallback: Haversine formula for distance when external API fails
 */

export class LocationUtil {
  /**
   * Validate Latitude and Longitude
   * @param lat Latitude (-90 to 90)
   * @param lng Longitude (-180 to 180)
   */
  static isValidCoordinate(lat: number, lng: number): boolean {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;
    return true;
  }

  /**
   * Format content as MongoDB GeoJSON Point
   * Note: MongoDB stores as [longitude, latitude]
   */
  static toGeoJsonPoint(
    lat: number,
    lng: number,
  ): { type: 'Point'; coordinates: number[] } {
    return {
      type: 'Point',
      coordinates: [lng, lat],
    };
  }

  /**
   * Calculate Distance using Haversine Formula (Offline Fallback)
   * Returns distance in meters.
   */
  static calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
