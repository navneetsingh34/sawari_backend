/**
 * Place Bid DTO
 *
 * Input validation for placing a bid.
 */

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlaceBidDto {
  @ApiProperty({
    description: 'ID of the ride to bid on',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  rideId: string;

  @ApiProperty({ description: 'Bid amount', example: 150 })
  @IsNumber()
  @Min(1)
  amount: number;
}
