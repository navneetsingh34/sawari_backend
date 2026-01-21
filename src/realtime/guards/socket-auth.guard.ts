/**
 * Socket Authentication Guard
 *
 * Validates JWT during WebSocket Handshake.
 *
 * Flow:
 * 1. Extract token from `client.handshake.auth.token` or headers.
 * 2. Verify with JwtService.
 * 3. Attach payload to `client.data.user`.
 * 4. Disconnect if invalid.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SocketAuthGuard implements CanActivate {
  private readonly logger = new Logger(SocketAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractToken(client);

    this.logger.debug(`Validating token for client ${client.id}`);
    this.logger.debug(`Token: ${token ? token.substring(0, 20) + '...' : 'NONE'}`);

    if (!token) {
      this.logger.warn(`Socket connection attempt without token - client ${client.id}`);
      client.emit('error', { message: 'Authentication required' });
      client.disconnect();
      return false;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.accessTokenSecret'),
      });

      this.logger.debug(`Token valid for user: ${payload.sub}, role: ${payload.role}`);
      
      // Attach user to socket instance for future use
      client.data.user = payload;
      return true;
    } catch (err) {
      this.logger.error(`Socket auth failed for client ${client.id}: ${err.message}`);
      client.emit('error', { message: 'Invalid token', details: err.message });
      client.disconnect();
      return false;
    }
  }

  private extractToken(client: Socket): string | undefined {
    // 1. Check auth object (Standard Socket.io v4)
    if (client.handshake.auth?.token) {
      const auth = client.handshake.auth.token;
      return auth.replace('Bearer ', '');
    }

    // 2. Fallback to headers
    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      return authHeader.replace('Bearer ', '');
    }

    return undefined;
  }
}
