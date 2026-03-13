/**
 * Application Root Module
 *
 * This is the root module of the application. It imports and configures all
 * other modules, middleware, and global providers.
 *
 * Why a root module?
 * - Entry point: NestJS starts here and builds the dependency injection tree
 * - Module organization: Imports all feature and infrastructure modules
 * - Global configuration: Sets up middleware, guards, and interceptors
 * - Dependency management: Manages module dependencies and imports
 *
 * Module Structure:
 * - imports: Other modules this module depends on
 * - controllers: Controllers defined in this module
 * - providers: Services and providers available in this module
 *
 * Current Modules:
 * - ConfigModule: Environment configuration management
 * - DatabaseModule: MongoDB connection via Mongoose
 * - LoggerModule: Winston-based logging
 * - HealthModule: Health check endpoints
 *
 * Future Modules (will be added in next steps):
 * - AuthModule: Authentication and authorization
 * - UsersModule: User management
 * - RidesModule: Core ride-hailing logic
 * - DriversModule: Driver management
 * - PaymentsModule: Payment processing
 * - NotificationsModule: Push/SMS/Email notifications
 *
 * Middleware Configuration:
 * - RequestLoggerMiddleware: Logs all HTTP requests
 *
 * The configure() method is called during application initialization
 * to set up middleware for specific routes.
 */

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './common/logger/logger.module';
import { HealthModule } from './health/health.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DriversModule } from './drivers/drivers.module';
import { LocationModule } from './location/location.module';
import { RidesModule } from './rides/rides.module';
import { BidsModule } from './bids/bids.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CommissionsModule } from './commissions/commissions.module';
import { WalletModule } from './wallet/wallet.module';
import { AdminModule } from './admin/admin.module';
import { PaymentModule } from './payment/payment.module';
import { OffersModule } from './offers/offers.module';
import { CoinsModule } from './coins/coins.module';
import { SettingsModule } from './settings/settings.module';
import { HelpModule } from './help/help.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    // Global configuration module
    // Loads environment variables and provides ConfigService
    ConfigModule,

    // Enable Scheduled Tasks (Cron)
    ScheduleModule.forRoot(),

    // Database connection module
    // Establishes MongoDB connection via Mongoose
    DatabaseModule,

    // Global logging module
    // Provides LoggerService throughout the application
    LoggerModule,

    // Health check module
    // Provides /health endpoint for monitoring
    HealthModule,

    // Users module
    // User schema and CRUD operations
    UsersModule,

    // Authentication module
    // Registration, login, JWT tokens, guards
    AuthModule,

    // Drivers module
    // Driver profile, vehicle, location management
    DriversModule,

    // Location module
    // Geospatial queries, maps, distance calc
    LocationModule,

    // Rides module
    // Core ride lifecycle (Request -> Complete)
    RidesModule,

    // Bids Module
    // Driver bidding logic
    BidsModule,

    // Realtime Module
    // WebSocket Gateway & Events
    RealtimeModule,

    // Subscriptions Module
    // Driver monetization & Priority
    SubscriptionsModule,

    // Commissions Module
    // Revenue Engine
    CommissionsModule,

    // Wallet Module
    // Ledger & Payments
    WalletModule,

    // Admin Module
    // Platform Monitoring & Moderation
    AdminModule,

    PaymentModule,

    OffersModule,

    CoinsModule,

    SettingsModule,

    HelpModule,

    ChatbotModule,

    // Future modules will be added here:
    // PaymentsModule
    // DriversModule,
    // PaymentsModule,
    // NotificationsModule,
    // LocationsModule,
    // PricingModule,
    // AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  /**
   * Configure middleware for the application
   *
   * Middleware is applied to routes in the order they are registered.
   * Here we apply RequestLoggerMiddleware to all routes ('*').
   *
   * You can apply middleware to specific routes:
   * .forRoutes('users', 'rides')
   *
   * Or exclude specific routes:
   * .exclude({ path: 'health', method: RequestMethod.GET })
   * .forRoutes('*')
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, RateLimitMiddleware, RequestLoggerMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
