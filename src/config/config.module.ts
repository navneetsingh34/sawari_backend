/**
 * Configuration Module
 *
 * This module is responsible for loading and validating application configuration
 * from environment variables. It uses NestJS's built-in ConfigModule.
 *
 * Why a separate config module?
 * - Separation of concerns: Configuration logic is isolated
 * - Reusability: Can be imported by any module that needs config
 * - Testability: Easy to mock configuration in tests
 *
 * How it works:
 * 1. ConfigModule.forRoot() loads .env file at application startup
 * 2. Our configuration factory (configuration.ts) transforms env vars
 * 3. ConfigService becomes available for dependency injection
 * 4. Any module can inject ConfigService to access typed config
 *
 * Usage in other modules:
 * ```typescript
 * constructor(private configService: ConfigService) {
 *   const dbUri = this.configService.get<string>('database.uri');
 * }
 * ```
 */

import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configuration from './configuration';

@Module({
  imports: [
    NestConfigModule.forRoot({
      // Load our configuration factory
      load: [configuration],

      // Make ConfigService available globally (no need to import in each module)
      isGlobal: true,

      // Cache configuration for better performance
      cache: true,

      // Expand environment variables (e.g., ${VAR_NAME})
      expandVariables: true,

      // Path to .env file (default is root directory)
      envFilePath: '.env',
    }),
  ],
})
export class ConfigModule {}
