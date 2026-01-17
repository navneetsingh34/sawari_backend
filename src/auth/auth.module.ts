/**
 * Auth Module
 *
 * Central authentication module that wires together all auth components.
 *
 * Components:
 * - AuthController: HTTP endpoints
 * - AuthService: Business logic
 * - JwtAccessStrategy: Access token validation
 * - JwtRefreshStrategy: Refresh token validation
 * - Guards: JwtAuthGuard, JwtRefreshGuard, RolesGuard
 * - Decorators: @Roles(), @CurrentUser(), @Public()
 *
 * Dependencies:
 * - UsersModule: For user database operations
 * - JwtModule: For token generation and validation
 * - PassportModule: For strategy-based authentication
 *
 * Exports:
 * - AuthService: For use in other modules
 * - Guards: For protecting routes
 * - Decorators: For route metadata
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,

    // JWT Module Configuration
    // Registers JWT module with default options
    // Actual secrets are provided in strategies
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('jwt.accessTokenSecret') ||
          'default-secret',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.accessTokenExpiry') ||
            '15m') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
