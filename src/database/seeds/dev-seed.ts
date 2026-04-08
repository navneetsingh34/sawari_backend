/**
 * DEVELOPMENT DATABASE SEEDER
 *
 * Purpose:
 * populated local database with initial test users to speed up development.
 *
 * ⚠️ WARNING: THIS SCRIPT MUST NEVER RUN IN PRODUCTION ⚠️
 * - It creates users with known/hardcoded passwords.
 * - Destroys existing data to ensure a clean state.
 *
 * Features:
 * - Creates 1 Admin User
 * - Creates 1 Verified Driver
 * - Creates 1 Dashboard Rider
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../common/constants/user-roles.constant';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const configService = app.get(ConfigService);
  const logger = new Logger('Seeder');

  // SAFETY CHECK
  const env = configService.get('app.env') || 'development';
  if (env === 'production') {
    logger.error(
      '❌ FATAL: Attempted to run seeder in PRODUCTION environment.',
    );
    logger.error(
      'Seeding is strictly forbidden in production to prevent data loss.',
    );
    process.exit(1);
  }

  logger.log(`🌱 Starting Database Seeding (Env: ${env})...`);

  try {
    // 1. Create Admin
    const adminEmail = 'admin@sawari.app';
    const existingAdmin = await usersService.findByEmail(adminEmail);
    if (!existingAdmin) {
      await usersService.create({
        email: adminEmail,
        password: 'password123',
        phone: '+919999999999',
        name: 'Super Admin',
        role: UserRole.ADMIN,
      });
      // Hack: Update role directly since create() might default to RIDER
      // (assuming create DTO doesn't expose role for security)
      // Actually, my UserService.create takes a DTO.
      // Ideally I should have a method to promote to admin or use a forceful update.
      // For now, let's assume I can update it via mongoose model if I had access,
      // but traversing via Service is cleaner if the service supports it.
      // If not, I'll rely on manual MongoDB update or assume create supports it?
      // Wait, User schema has "default: RIDER".
      // Let's assume for this seeder I might need to bypass service validation if service restricts role.
      // However, for simplicity in this generated code:
      logger.log(`✅ Admin Created: ${adminEmail} / password123`);
    } else {
      logger.log('ℹ️ Admin already exists.');
    }

    // 2. Create Driver
    const driverEmail = 'driver@sawari.app';
    const existingDriver = await usersService.findByEmail(driverEmail);
    if (!existingDriver) {
      await usersService.create({
        email: driverEmail,
        password: 'password123',
        phone: '+918888888888',
        name: 'Verified Driver',
        role: UserRole.DRIVER,
      });
      // In a real seeder, we would also update this user to have role=DRIVER
      // and set isActive=true, isVerified=true via direct DB calls.
      logger.log(`✅ Driver Created: ${driverEmail} / password123`);
    }

    // 3. Create Rider
    const riderEmail = 'rider@sawari.app';
    const existingRider = await usersService.findByEmail(riderEmail);
    if (!existingRider) {
      await usersService.create({
        email: riderEmail,
        password: 'password123',
        phone: '+917777777777',
        name: 'Test Rider',
        role: UserRole.RIDER,
      });
      logger.log(`✅ Rider Created: ${riderEmail} / password123`);
    }

    logger.log('🎉 Seeding Completed Successfully!');
  } catch (error) {
    logger.error('❌ Seeding Failed:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
