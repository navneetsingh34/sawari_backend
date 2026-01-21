/**
 * Realtime Event Constants
 *
 * Strict definition of all WebSocket events.
 * Used by Backend (emit) and Frontend (listen).
 */

export const RealtimeEvents = {
  // Connection / System
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Ride Events
  RIDE_NEW: 'ride:new', // To Drivers: New ride available to bid
  RIDES_AVAILABLE: 'rides:available', // To Driver: Initial list of available rides
  RIDE_STATUS: 'ride:status', // To Rider/Driver: Ride status changed
  RIDE_CANCELLED: 'ride:cancelled',

  // Bid Events
  BID_NEW: 'bid:new', // To Rider: New bid received
  BID_ACCEPTED: 'bid:accepted', // To Driver: Your bid was chosen
  BID_REJECTED: 'bid:rejected', // To Driver: Someone else won

  // Location
  LOCATION_UPDATE: 'location:update',

  // Live Tracking
  DRIVER_LOCATION: 'driver:location', // To Rider: Car moving
};
