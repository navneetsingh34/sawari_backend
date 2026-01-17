/**
 * Logger Module
 *
 * This module provides the LoggerService globally throughout the application.
 * It's configured as a global module so it doesn't need to be imported in every module.
 *
 * Why a global logger?
 * - Convenience: No need to import in every module
 * - Consistency: Same logger instance and configuration everywhere
 * - Performance: Single logger instance shared across the app
 *
 * The @Global() decorator makes this module's exports available everywhere
 * without explicit imports.
 */

import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
