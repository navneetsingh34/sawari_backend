/**
 * Drivers Controller
 *
 * REST API for driver operations.
 *
 * SECURITY NOTICE:
 * - All endpoints restricted to UserRole.DRIVER
 * - Uses @Roles() decorator for enforcement
 * - Users can only manage their own profile (@CurrentUser)
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverProfileDto } from './dto/create-driver-profile.dto';
import { UpdateDriverVehicleDto } from './dto/update-driver-vehicle.dto';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/constants/user-roles.constant';
import { DriverProfile } from './schemas/driver-profile.schema';

@ApiTags('Drivers')
@ApiBearerAuth('JWT')
@Controller('drivers')
@UseGuards(RolesGuard) // Enforce role checks for all routes in this controller
@Roles(UserRole.DRIVER) // ONLY Drivers can access these endpoints
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create driver profile (One-time setup)' })
  @ApiResponse({
    status: 201,
    description: 'Profile created',
    type: DriverProfile,
  })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  async createProfile(
    @CurrentUser('id') userId: string,
    @Body() createDto: CreateDriverProfileDto,
  ) {
    return this.driversService.createProfile(userId, createDto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get my driver profile' })
  @ApiResponse({ status: 200, type: DriverProfile })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.driversService.getProfile(userId);
  }

  @Patch('vehicle')
  @ApiOperation({ summary: 'Update vehicle information' })
  @ApiResponse({ status: 200, type: DriverProfile })
  async updateVehicle(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateDriverVehicleDto,
  ) {
    return this.driversService.updateVehicle(userId, updateDto);
  }

  @Patch('status')
  @ApiOperation({ summary: 'Toggle Online/Offline status' })
  @ApiResponse({ status: 200, type: DriverProfile })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Body() statusDto: UpdateDriverStatusDto,
  ) {
    return this.driversService.updateStatus(userId, statusDto.isOnline);
  }

  @Patch('location')
  @ApiOperation({ summary: 'Update live location' })
  @ApiResponse({ status: 200, type: DriverProfile })
  async updateLocation(
    @CurrentUser('id') userId: string,
    @Body() locationDto: UpdateDriverLocationDto,
  ) {
    return this.driversService.updateLocation(userId, locationDto);
  }
}
