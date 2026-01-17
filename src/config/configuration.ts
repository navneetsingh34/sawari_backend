/**
 * Configuration Factory
 *
 * This file exports a typed configuration object that maps environment variables
 * to a structured configuration format used throughout the application.
 *
 * Why this approach?
 * - Type safety: TypeScript interfaces ensure configuration is properly typed
 * - Centralized: All configuration logic in one place
 * - Validation: Can add validation logic here
 * - Default values: Provides sensible defaults for optional settings
 *
 * How it works:
 * 1. Environment variables are loaded from .env file via dotenv
 * 2. This factory function transforms them into a typed object
 * 3. ConfigModule makes this available via ConfigService throughout the app
 *
 * Future extensibility:
 * - Add new configuration sections (e.g., redis, email, storage)
 * - Add validation using Joi or class-validator
 * - Support multiple environment files (.env.production, .env.staging)
 */

export interface AppConfig {
  env: string;
  port: number;
  name: string;
  apiPrefix: string;
  apiVersion: string;
}

export interface DatabaseConfig {
  uri: string;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiration: string;
  rateLimitTtl: number;
  rateLimitMax: number;
  corsOrigins: string[];
}

export interface LoggingConfig {
  level: string;
}

export interface SwaggerConfig {
  enabled: boolean;
  path: string;
}

export interface JwtConfig {
  accessTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenSecret: string;
  refreshTokenExpiry: string;
}

export interface Configuration {
  app: AppConfig;
  database: DatabaseConfig;
  security: SecurityConfig;
  logging: LoggingConfig;
  swagger: SwaggerConfig;
  jwt: JwtConfig;
}

/**
 * Configuration factory function
 * Called by ConfigModule during application bootstrap
 * Returns a typed configuration object
 */
export default (): Configuration => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    name: process.env.APP_NAME || 'Sawari Backend',
    apiPrefix: process.env.API_PREFIX || 'api',
    apiVersion: process.env.API_VERSION || 'v1',
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sawari',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    jwtExpiration: process.env.JWT_EXPIRATION || '7d',
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    path: process.env.SWAGGER_PATH || 'api/docs',
  },
  jwt: {
    accessTokenSecret:
      process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenSecret:
      process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
});
