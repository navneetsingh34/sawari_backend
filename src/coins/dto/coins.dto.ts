import { IsNumber, IsString, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemCoinsDto {
  @ApiProperty({ example: 50, description: 'Number of coins to redeem' })
  @IsNumber()
  @Min(1)
  @Max(500)
  amount: number;

  @ApiProperty({ example: 'ride_123', description: 'Associated ride ID for the discount' })
  @IsString()
  @IsNotEmpty()
  rideId: string;
}
