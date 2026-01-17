/**
 * Map Service Interface
 *
 * abstraction layer for map providers (Google Maps, Mapbox, etc.).
 *
 * Why abstract?
 * - Flexibility: Swap providers without changing business logic
 * - Testability: Easy to mock for unit tests
 * - Resilience: Can implement failover strategies (Google -> Mapbox)
 */

export interface DistanceMatrixResult {
  distanceMeters: number;
  durationSeconds: number;
}

export interface MapService {
  /**
   * Calculate distance and duration between two points
   */
  calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<DistanceMatrixResult>;

  /**
   * Get human-readable address from coordinates (Reverse Geocoding)
   */
  getAddress(lat: number, lng: number): Promise<string>;
}
