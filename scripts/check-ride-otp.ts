/**
 * Check Ride OTP Script
 * 
 * Usage: npx ts-node scripts/check-ride-otp.ts <RIDE_ID>
 * 
 * This script fetches:
 * 1. The ride details
 * 2. The rider's details
 * 3. The expected OTP for that rider
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RidesService } from '../src/rides/rides.service';
import { UsersService } from '../src/users/users.service';
import { isValidObjectId } from 'mongoose';

async function bootstrap() {
    const rideId = process.argv[2];

    if (!rideId) {
        console.error('❌ Please provide a Ride ID');
        console.error('Usage: npx ts-node scripts/check-ride-otp.ts <RIDE_ID>');
        process.exit(1);
    }

    if (!isValidObjectId(rideId)) {
        console.error('❌ Invalid Ride ID format');
        process.exit(1);
    }

    const app = await NestFactory.createApplicationContext(AppModule);
    const ridesService = app.get(RidesService);
    const usersService = app.get(UsersService);

    try {
        console.log(`🔍 Checking details for Ride ID: ${rideId}...`);

        // 1. Get Ride
        // We access the model directly via service if possible, or use public methods
        // RidesService.findById is private, so let's use getRideDetails
        const ride = await ridesService.getRideDetails(rideId);
        console.log(`✅ Ride found. Status: ${ride.status}`);

        // 2. Get Rider
        const rider = ride.riderId as any; // Populated
        console.log(`👤 Rider: ${rider.name} (${rider.email})`);
        console.log(`🆔 Rider ID: ${rider._id}`);

        // 3. Fetch full User object to see OTP (getRideDetails populates select fields, maybe not OTP)
        // We need to fetch user explicitly to be sure, specifically with schema that includes riderOtp
        // But riderOtp is not select: false, so it might be there if populated.
        // However, verifyOtpAndStart does .populate('riderId', 'riderOtp'). 'riderOtp' is not in default select?
        // Let's check the schema. riderOtp marks sparse/unique but not 'select: false'.

        // Fetch fresh user to be absolutely sure
        const fullUser = await usersService.findById(rider._id.toString());

        if (!fullUser) {
            console.error('❌ Rider not found in database!');
        } else {
            console.log(`🔐 EXPECTED OTP: ${fullUser.riderOtp || 'UNDEFINED'}`);

            if (!fullUser.riderOtp) {
                console.warn('⚠️ WARNING: This rider has NO OTP assigned.');
                console.warn('   Run npx ts-node scripts/fix-missing-otps.ts to generate one.');
            } else {
                console.log('   (Share this OTP with the driver to start the ride)');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await app.close();
    }
}

bootstrap();
