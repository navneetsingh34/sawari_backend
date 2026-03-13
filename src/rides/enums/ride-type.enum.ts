/**
 * Ride Type Enum
 *
 * Defines the category of a ride request.
 * Used for fare calculation and route validation.
 */

export enum RideType {
  CITY = 'CITY',           // Standard intra-city rides
  INTERCITY = 'INTERCITY', // Between two cities
  OUTSTATION = 'OUTSTATION', // Long-distance / round-trip
  PARCEL = 'PARCEL',       // Package delivery (no passenger)
}
