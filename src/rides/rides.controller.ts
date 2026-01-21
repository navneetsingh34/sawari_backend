/**
 * Rides Controller
 *
 * REST API for Ride Management.
 * Exposes lifecycle actions (Create, Cancel, Start, Complete).
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
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
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { EstimateRideDto } from './dto/estimate-ride.dto';
import { CancelRideDto } from './dto/cancel-ride.dto';
import { RideHistoryQueryDto } from './dto/ride-history-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/constants/user-roles.constant';
import { User } from '../users/schemas/user.schema';

@ApiTags('Rides')
@ApiBearerAuth('JWT')
@Controller('rides')
@UseGuards(RolesGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) { }

  @Post('estimate')
  @ApiOperation({ summary: 'Estimate ride fare and distance' })
  @ApiResponse({ status: 200, description: 'Estimation result' })
  @ApiBearerAuth('JWT') // Optional if public? But usually authenticated. Controller has @UseGuards(RolesGuard) class level.
  // Wait, if RolesGuard blocks, we need to allow any authenticated user? 
  // The class has @UseGuards(RolesGuard), but no @Roles() here means it might depend on implementation of RolesGuard.
  // Usually RolesGuard checks if @Roles is present. If not, it might allow or deny.
  // Assuming default allow for authenticated users if no role specified, or we add @Roles(UserRole.RIDER, UserRole.DRIVER).
  // Let's assume Rider initiates it.
  @Roles(UserRole.RIDER)
  async estimate(@Body() estimateDto: EstimateRideDto) {
    return this.ridesService.estimateRide(estimateDto);
  }

  @Post()
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Request a new ride (Rider only)' })
  @ApiResponse({ status: 201, description: 'Ride created successfully' })
  async create(
    @CurrentUser('id') riderId: string,
    @Body() createDto: CreateRideDto,
  ) {
    return this.ridesService.createRequest(riderId, createDto);
  }

  @Patch(':id/request-bidding')
  @Roles(UserRole.RIDER)
  @ApiOperation({
    summary: 'Open ride for bidding (Transition to BIDDING status)',
  })
  async requestBidding(
    @Param('id') rideId: string,
    @CurrentUser('id') riderId: string,
  ) {
    return this.ridesService.requestBidding(rideId, riderId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get current active ride (if any)' })
  async getActiveRide(
    @CurrentUser() user: User,
  ) {
    return this.ridesService.findActiveRide((user as any).id, user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get ride history (Paginated)' })
  async findAll(
    @CurrentUser() user: User,
    @Query() query: RideHistoryQueryDto,
  ) {
    // CurrentUser decorator returns the User document, so we access properties directly
    // Assuming the interface has ._id or .id. If it's the mongoose document, .id works.
    // Casting to any to avoid strict type issues with 'user' param vs string id
    return this.ridesService.findAll((user as any).id, user.role, query);
  }

  // --- Driver Actions ---

  @Patch(':id/accept')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Accept a ride request' })
  async accept(
    @Param('id') rideId: string,
    @CurrentUser('id') driverId: string,
  ) {
    return this.ridesService.acceptRide(rideId, driverId);
  }

  @Patch(':id/arrived')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Mark driver as arrived at pickup' })
  async arrived(
    @Param('id') rideId: string,
    @CurrentUser('id') driverId: string,
  ) {
    return this.ridesService.driverArrived(rideId, driverId);
  }

  @Patch(':id/start')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Start the ride' })
  async start(
    @Param('id') rideId: string,
    @CurrentUser('id') driverId: string,
  ) {
    return this.ridesService.startRide(rideId, driverId);
  }

  @Patch(':id/complete')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Complete the ride' })
  async complete(
    @Param('id') rideId: string,
    @CurrentUser('id') driverId: string,
  ) {
    return this.ridesService.completeRide(rideId, driverId);
  }

  // --- Common Actions ---

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel ride' })
  async cancel(
    @Param('id') rideId: string,
    @CurrentUser() user: User,
    @Body() cancelDto: CancelRideDto,
  ) {
    return this.ridesService.cancelRide(
      rideId,
      (user as any).id,
      user.role,
      cancelDto.reason,
    );
  }

  @Get(':id/contact')
  @ApiOperation({ summary: 'Get contact info of other party (Call Feature)' })
  async getContact(
    @Param('id') rideId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ridesService.getRideContact(rideId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride details with driver/rider info' })
  async getRideDetails(
    @Param('id') rideId: string,
  ) {
    return this.ridesService.getRideDetails(rideId);
  }
}
