/**
 * Database Module
 *
 * This module handles the MongoDB connection using Mongoose ODM.
 * It's configured to work with NestJS's dependency injection system.
 *
 * Why Mongoose?
 * - Schema validation: Ensures data integrity at the application level
 * - Middleware: Pre/post hooks for business logic
 * - Virtuals and methods: Extend documents with computed properties
 * - Population: Easy relationship handling
 * - Active community: Well-maintained and documented
 *
 * Connection Flow:
 * 1. ConfigModule provides database URI from environment variables
 * 2. MongooseModule.forRootAsync() creates connection during app bootstrap
 * 3. Connection is established before app starts accepting requests
 * 4. If connection fails, application won't start (fail-fast principle)
 *
 * Connection Options Explained:
 * - useNewUrlParser: Use new MongoDB connection string parser
 * - useUnifiedTopology: Use new Server Discovery and Monitoring engine
 * - retryWrites: Automatically retry write operations on network errors
 * - w: 'majority': Write concern - wait for majority of replica set to acknowledge
 *
 * Future Usage:
 * In feature modules, import MongooseModule.forFeature() to define schemas:
 * ```typescript
 * @Module({
 *   imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
 * })
 * export class UsersModule {}
 * ```
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      // Import ConfigModule to access ConfigService
      imports: [ConfigModule],

      // Inject ConfigService to get database configuration
      inject: [ConfigService],

      // Factory function to create Mongoose connection options
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('database.uri');

        return {
          uri,

          // Connection options for production reliability
          // These ensure the connection is stable and handles network issues gracefully
          retryWrites: true,
          w: 'majority',

          // Connection pool settings
          // Helps manage multiple concurrent database operations
          maxPoolSize: 10,
          minPoolSize: 2,

          // Timeout settings (in milliseconds)
          serverSelectionTimeoutMS: 5000, // How long to wait for server selection
          socketTimeoutMS: 45000, // How long to wait for socket operations

          // Monitoring and debugging
          // Set to true in development to see MongoDB driver logs
          // autoIndex: configService.get<string>('app.env') === 'development',
        };
      },

      // Connection name (useful if you need multiple database connections)
      // connectionName: 'default',
    }),
  ],

  // Export MongooseModule so other modules can use it
  exports: [MongooseModule],
})
export class DatabaseModule {}
