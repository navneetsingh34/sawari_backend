/**
 * Health Check Module
 *
 * This module provides health check functionality using @nestjs/terminus.
 * It's used to monitor the application and its dependencies.
 *
 * The TerminusModule provides:
 * - Health check service
 * - Built-in health indicators (database, HTTP, memory, disk)
 * - Standardized health check response format
 */

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
