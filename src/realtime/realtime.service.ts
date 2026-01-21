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
   * (In production, this would be Geo-fenced to drivers in radius)
   */
  alertDrivers(ride: any) {
    if (!this.server) return;
    this.logger.debug(`Broadcasting new ride ${ride._id} to 'drivers' room`);

    // In future: this.server.to(`geo:${city}`).emit(...)
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
}
