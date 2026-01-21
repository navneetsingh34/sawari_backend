/**
 * Bids Controller
 *
 * REST API for Bidding operations.
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BidsService } from './bids.service';
import { PlaceBidDto } from './dto/place-bid.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/constants/user-roles.constant';

@ApiTags('Bids')
@ApiBearerAuth('JWT')
@Controller('bids')
@UseGuards(RolesGuard)
export class BidsController {
  constructor(private readonly bidsService: BidsService) { }

  @Post()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Place a bid on a ride (Driver only)' })
  @ApiResponse({ status: 201, description: 'Bid placed successfully' })
  async placeBid(
    @CurrentUser('id') driverId: string,
    @Body() dto: PlaceBidDto,
  ) {
    return this.bidsService.placeBid(driverId, dto);
  }

  @Get('ride/:rideId')
  @ApiOperation({ summary: 'Get active bids for a ride' })
  async getBids(@Param('rideId') rideId: string) {
    if (!isValidObjectId(rideId)) {
      throw new BadRequestException('Invalid Ride ID');
    }
    return this.bidsService.getBidsForRide(rideId);
  }

  @Patch(':bidId/accept')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Accept a bid (Rider only)' })
  @ApiResponse({ status: 200, description: 'Bid accepted, ride assigned' })
  async acceptBid(
    @Param('bidId') bidId: string,
    @Body('rideId') rideId: string, // Provide rideId in body to verify ownership
    @CurrentUser('id') riderId: string,
  ) {
    if (!isValidObjectId(bidId) || !isValidObjectId(rideId)) {
      throw new BadRequestException('Invalid ID');
    }
    return this.bidsService.acceptBid(riderId, rideId, bidId);
  }
}
