import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { DriversModule } from '../drivers/drivers.module';
import {
  DriverProfile,
  DriverProfileSchema,
} from '../drivers/schemas/driver-profile.schema';
import { GoogleMapsService } from './providers/google-maps.service';

@Module({
  imports: [
    DriversModule, // To access DriversService
    MongooseModule.forFeature([
      { name: DriverProfile.name, schema: DriverProfileSchema }, // Direct access for aggregation queries
    ]),
  ],
  controllers: [LocationController],
  providers: [
    LocationService,
    {
      provide: 'MapService', // String token for dependency injection
      useClass: GoogleMapsService, // Swap this with MapboxService later transparently
    },
  ],
  exports: [LocationService],
})
export class LocationModule {}
