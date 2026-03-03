/**
 * Realtime Service
 *
 * Facade for emitting WebSocket events.
 * Injected into Rides/Bids/Drivers services.
 *
 * Design:
 * - This service doesn't handle connection logic (Gateway does that).
 * - It strictly handles *outbound* messaging (Broadcasting).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { RealtimeEvents } from './events/event.constants';

@Injectable()
export class RealtimeService {
  private server: Server;
  private readonly logger = new Logger(RealtimeService.name);

  // Called by Gateway to set the server instance
  setServer(server: Server) {
    this.server = server;
  }

  /**
   * Alert all online drivers about a new ride
   * Broadcasts to the base vehicle type room so ALL drivers of that type see the ride
   * AC/Shared preferences are rider requests, not driver filters
   */
  alertDrivers(ride: any) {
    if (!this.server) return;

    const vType = ride.vehicleType ? ride.vehicleType.toUpperCase() : 'CAR';

    // Always broadcast to the base vehicle room so all drivers see it
    const baseRoom = `drivers:${vType}`;

    this.logger.debug(`Broadcasting new ride ${ride._id} to '${baseRoom}' room`);
    this.server.to(baseRoom).emit(RealtimeEvents.RIDE_NEW, ride);

    // Also broadcast to the generic 'drivers' room for maximum visibility
    this.server.to('drivers').emit(RealtimeEvents.RIDE_NEW, ride);
  }

  /**
   * Notify Rider (and Driver) of status updates
   */
  updateRideStatus(rideId: string, status: string, payload?: any) {
    if (!this.server) return;
    this.logger.debug(`Emitting status ${status} for ride ${rideId}`);

    this.server.to(`ride:${rideId}`).emit(RealtimeEvents.RIDE_STATUS, {
      rideId,
      status,
      ...payload,
    });
  }

  /**
   * Notify Rider of a new bid
   */
  notifyNewBid(rideId: string, bid: any) {
    if (!this.server) return;
    this.server.to(`ride:${rideId}`).emit(RealtimeEvents.BID_NEW, bid);
  }

  /**
   * Notifty Driver their bid was accepted/rejected
   */
  notifyBidResult(driverId: string, accepted: boolean, rideId: string) {
    if (!this.server) return;
    const event = accepted
      ? RealtimeEvents.BID_ACCEPTED
      : RealtimeEvents.BID_REJECTED;

    this.server.to(`user:${driverId}`).emit(event, { rideId });
  }

  /**
   * Broadcast Driver Location to Ride Room
   */
  emitLocationUpdate(rideId: string, driverId: string, location: { lat: number; lng: number }) {
    if (!this.server) return;
    this.server.to(`ride:${rideId}`).emit(RealtimeEvents.LOCATION_UPDATE, {
      driverId,
      ...location,
    });
  }

  /**
   * Notify Rider that Driver Arrived at Pickup
   */
  notifyDriverArrived(rideId: string, driverLocation: { lat: number; lng: number }) {
    if (!this.server) return;
    this.logger.debug(`Driver arrived at pickup for ride ${rideId}`);
    this.server.to(`ride:${rideId}`).emit(RealtimeEvents.DRIVER_ARRIVED_AT_PICKUP, {
      rideId,
      driverLocation,
    });
  }

  /**
   * Request OTP from Driver
   */
  requestOtpVerification(rideId: string) {
    if (!this.server) return;
    this.server.to(`ride:${rideId}`).emit(RealtimeEvents.RIDE_START_OTP_REQUIRED, {
      rideId,
    });
  }

  /**
   * Notify OTP Verification Result
   */
  notifyOtpResult(rideId: string, success: boolean, message?: string) {
    if (!this.server) return;
    const event = success
      ? RealtimeEvents.RIDE_START_OTP_VERIFIED
      : RealtimeEvents.RIDE_START_OTP_FAILED;

    this.server.to(`ride:${rideId}`).emit(event, {
      rideId,
      success,
      message,
    });
  }

  /**
   * Emit Live Route Updates
   */
  emitLiveRoute(rideId: string, routeData: any) {
    if (!this.server) return;
    this.server.to(`ride:${rideId}`).emit(RealtimeEvents.LIVE_ROUTE_UPDATE, {
      rideId,
      ...routeData,
    });
  }

  /**
   * Request Payment Collection from Driver
   */
  requestPayment(rideId: string, fareAmount: number) {
    if (!this.server) return;
    this.server.to(`ride:${rideId}`).emit(RealtimeEvents.PAYMENT_SCREEN, {
      rideId,
      fareAmount,
    });
  }

  /**
   * Notify Payment Collected
   */
  notifyPaymentCollected(rideId: string, paymentMethod: string) {
    if (!this.server) return;
    this.server.to(`ride:${rideId}`).emit(RealtimeEvents.PAYMENT_COLLECTED, {
      rideId,
      paymentMethod,
    });
  }

  /**
   * Request Review from Rider
   */
  requestReview(riderId: string, rideId: string, driverId: string) {
    if (!this.server) return;
    this.server.to(`user:${riderId}`).emit(RealtimeEvents.REVIEW_REQUEST, {
      rideId,
      driverId,
    });
  }

  /**
   * Notify Driver of Review Submission
   */
  notifyReviewSubmitted(driverId: string, rideId: string, rating: number) {
    if (!this.server) return;
    this.server.to(`user:${driverId}`).emit(RealtimeEvents.REVIEW_SUBMITTED, {
      rideId,
      rating,
    });
  }

  /**
   * Notify Ride Cancellation
   * Notifies both rider and driver that the ride has been cancelled
   */
  notifyRideCancelled(rideId: string, cancelledBy: string, reason?: string) {
    if (!this.server) return;
    this.logger.debug(`Ride ${rideId} cancelled by ${cancelledBy}`);
    
    const payload = {
      rideId,
      cancelledBy,
      reason,
    };
    
    // Notify the specific ride room (for drivers in ActiveRideScreen or riders tracking it)
    this.server.to(`ride:${rideId}`).emit(RealtimeEvents.RIDE_CANCELLED, payload);
    
    // Also broadcast to the generic 'drivers' room to clear from available pools or active status on Home
    this.server.to('drivers').emit(RealtimeEvents.RIDE_CANCELLED, payload);
  }

  /**
   * Broadcast SOS Alert
   * Notifies both parties in the ride room about the emergency.
   */
  notifySOS(rideId: string, triggeredBy: string, location: any) {
    if (!this.server) return;
    this.logger.warn(`🚨 SOS Alert broadcast for ride ${rideId} by ${triggeredBy}`);
    this.server.to(`ride:${rideId}`).emit(RealtimeEvents.SOS_TRIGGERED, {
      rideId,
      triggeredBy,
      location,
      timestamp: new Date().toISOString(),
    });
  }
}
