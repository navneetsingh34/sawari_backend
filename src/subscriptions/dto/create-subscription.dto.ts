/**
 * Create Subscription DTO
 *
 * Validate plan purchase request.
 */

import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PLANS } from '../schemas/subscription.schema';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Plan ID to purchase',
    enum: Object.keys(PLANS),
    example: 'DRIVER_7_DAYS',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.keys(PLANS))
  planId: string;
}
