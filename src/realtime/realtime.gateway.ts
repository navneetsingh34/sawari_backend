/**
 * Realtime Gateway (WebSocket Server)
 *
 * Handles all socket connections and incoming events.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger, Injectable, Inject, forwardRef } from '@nestjs/common';
import { SocketAuthGuard } from './guards/socket-auth.guard';
import { RealtimeService } from './realtime.service';
import { RealtimeEvents } from './events/event.constants';
import { UserRole } from '../common/constants/user-roles.constant';
import { RidesService } from '../rides/rides.service';

import { DriversService } from '../drivers/drivers.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all for dev, restrict in prod
  },
  namespace: 'events', // separate namespace if needed, using default for now or 'events'
})
@Injectable()
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly socketAuthGuard: SocketAuthGuard,
    @Inject(forwardRef(() => RidesService))
    private readonly ridesService: RidesService,
    @Inject(forwardRef(() => DriversService))
    private readonly driversService: DriversService,
  ) { }

  afterInit(server: Server) {
    this.realtimeService.setServer(server);
    this.logger.log('WebSocket Gateway Initialized');
  }

  // Handle Connection manually to apply global logic
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token || client.handshake.headers.authorization;

      this.logger.log(`Client connected: ${client.id}`);
      this.logger.debug(`Token received: ${token ? 'Yes' : 'No'}`);
      this.logger.debug(`Auth object: ${JSON.stringify(client.handshake.auth)}`);

      if (!token) {
        this.logger.warn(`No token provided for client ${client.id}`);
      }
    } catch (e) {
      this.logger.error(`Connection error: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Secure Event: Join Room
   * Users must join 'ride:ID' to see updates.
   * Drivers joining 'drivers' room receive available rides.
   */
  @UseGuards(SocketAuthGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    const user = client.data.user;
    this.logger.debug(`User ${user.sub} joining room ${room}`);

    // Security: Validate room access?
    // For now, allow joining 'ride:ID' and 'user:ID'
    // 'drivers' room is restricted to Drivers

    if (room === 'drivers' && user.role !== UserRole.DRIVER) {
      // Ignore or error
      return;
    }

    client.join(room);

    // Auto-join private user room
    client.join(`user:${user.sub}`);

    // If driver joins 'drivers' room, assign special rooms too
    if (room === 'drivers' && user.role === UserRole.DRIVER) {
      try {
        const profile = await this.driversService.getProfile(user.sub);
        // Default to CAR if missing
        const vType = profile.vehicleInfo?.vehicleType ? profile.vehicleInfo.vehicleType.toUpperCase() : 'CAR';

        client.join(`drivers:${vType}`);
        this.logger.debug(`Driver ${user.sub} joined drivers:${vType}`);

        // AC Room
        // Check if features exist (legacy support)
        if (profile.vehicleInfo?.features?.hasAc) {
          client.join(`drivers:${vType}_AC`);
          this.logger.debug(`Driver ${user.sub} joined drivers:${vType}_AC`);
        }

        // Shared Room
        if (profile.vehicleInfo?.features?.allowsSharing) {
          client.join(`drivers:${vType}_SHARED`);
        }

        // Send ALL available rides (not filtered by vehicle type for better visibility)
        // Drivers can choose which rides to accept
        const availableRides = await this.ridesService.findAvailableRides();
        client.emit(RealtimeEvents.RIDES_AVAILABLE, availableRides);
        this.logger.debug(
          `Sent ${availableRides.length} available rides to driver ${user.sub} (vehicleType: ${vType})`,
        );
      } catch (err) {
        this.logger.error(`Failed to assign vehicle rooms for ${user.sub}`, err);
        // Even if profile fetch fails, try to send available rides
        try {
          const availableRides = await this.ridesService.findAvailableRides();
          client.emit(RealtimeEvents.RIDES_AVAILABLE, availableRides);
        } catch (e) {
          this.logger.error(`Failed to fetch available rides`, e);
        }
      }
    }
  }

  /**
   * Secure Event: Driver Location Stream
   * Driver sends new coords -> Server broadcasts to Ride Room
   */
  @UseGuards(SocketAuthGuard)
  @SubscribeMessage(RealtimeEvents.DRIVER_LOCATION)
  handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { rideId: string; lat: number; lng: number },
  ) {
    const user = client.data.user;
    if (user.role !== UserRole.DRIVER) return;

    // Broadcast to specific ride room (so Rider sees it)
    this.server
      .to(`ride:${payload.rideId}`)
      .emit(RealtimeEvents.DRIVER_LOCATION, {
        driverId: user.sub,
        lat: payload.lat,
        lng: payload.lng,
      });
  }
}
