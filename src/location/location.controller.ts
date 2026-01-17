/**
 * Location Controller
 *
 * Endpoints for location-based features.
 *
 * Endpoints:
 * - PATCH /location/update: Driver sends live pings
 * - GET /location/nearby: Find drivers (Riders/System use)
 * - POST /location/eta: Calculate trip estimates
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LocationService } from './location.service';
import { UpdateDriverLocationDto } from '../drivers/dto/update-driver-location.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/constants/user-roles.constant';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming global, but explicit is good

@ApiTags('Location')
@ApiBearerAuth('JWT')
@Controller('location')
@UseGuards(RolesGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * Driver: Update Live Location
   */
  @Patch('update')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Update live driver location (Drivers only)' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateLocation(
    @CurrentUser('id') userId: string,
    @Body() locationDto: UpdateDriverLocationDto,
  ) {
    return this.locationService.updateDriverLocation(userId, locationDto);
  }

  /**
   * System/Rider: Find Nearby Drivers
   * (Ideally protected for internal use or Rider app)
   */
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby online drivers' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Radius in meters (default 5000)',
  })
  async getNearbyDrivers(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    return this.locationService.findNearbyDrivers(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : 5000,
    );
  }

  /**
   * System: Calculate ETA
   */
  @Post('eta')
  @ApiOperation({ summary: 'Calculate ETA and distance' })
  async calculateEta(
    @Body()
    body: {
      originLat: number;
      originLng: number;
      destLat: number;
      destLng: number;
    },
  ) {
    return this.locationService.calculateRoute(
      body.originLat,
      body.originLng,
      body.destLat,
      body.destLng,
    );
  }
}
