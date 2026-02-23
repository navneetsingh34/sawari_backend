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

  // Driver Arrival
  DRIVER_ARRIVED_AT_PICKUP: 'driver:arrived', // To Rider: Driver reached pickup

  // OTP Verification
  RIDE_START_OTP_REQUIRED: 'ride:otp:required', // To Driver: Request OTP input
  RIDE_START_OTP_VERIFIED: 'ride:otp:verified', // To Both: OTP success
  RIDE_START_OTP_FAILED: 'ride:otp:failed', // To Driver: OTP incorrect

  // Live Route Updates
  LIVE_ROUTE_UPDATE: 'route:update', // To Both: Route polyline and ETA

  // Payment
  PAYMENT_SCREEN: 'payment:screen', // To Driver: Show payment collection UI
  PAYMENT_COLLECTED: 'payment:collected', // To Both: Payment confirmed

  // Review
  REVIEW_REQUEST: 'review:request', // To Rider: Request driver review
  REVIEW_SUBMITTED: 'review:submitted', // To Driver: Review received

  // SOS / Emergency
  SOS_TRIGGERED: 'sos:triggered', // To Both + Admin: SOS alert activated
  SOS_RESOLVED: 'sos:resolved', // To Both + Admin: SOS resolved
};
