/**
 * Subscriptions Controller
 *
 * Driver plan management.
 */

import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/constants/user-roles.constant';

@ApiTags('Subscriptions')
@ApiBearerAuth('JWT')
@Controller('subscriptions')
@UseGuards(RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Purchase a subscription plan' })
  @ApiResponse({ status: 201, description: 'Plan activated' })
  async purchase(
    @CurrentUser('id') driverId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.purchasePlan(driverId, dto);
  }

  @Get()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get current active subscription' })
  async getStatus(@CurrentUser('id') driverId: string) {
    const sub = await this.subscriptionsService.getMySubscription(driverId);
    return {
      active: !!sub,
      subscription: sub || null,
      message: sub
        ? 'Plan Active'
        : 'No active plan. Buy one to get 0% commission!',
    };
  }
}
