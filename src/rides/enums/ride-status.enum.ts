/**
 * Ride Status Enum
 *
 * Defines the lifecycle states of a ride.
 * Used for state machine validation.
 */

export enum RideStatus {
  REQUESTED = 'REQUESTED', // Creation
  BIDDING = 'BIDDING', // (Future) Drivers bidding
  ACCEPTED = 'ACCEPTED', // Driver assigned
  STARTED = 'STARTED', // Ride in progress
  COMPLETED = 'COMPLETED', // Successfully finished
  CANCELLED = 'CANCELLED', // Aborted by user/driver
}
