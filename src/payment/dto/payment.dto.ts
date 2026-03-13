import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({ example: 500, description: 'Amount in INR' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'UPI', description: 'Payment Method (UPI, CARD, WALLET)' })
  @IsString()
  @IsIn(['UPI', 'CARD', 'WALLET'])
  method: string;

  @ApiProperty({ required: false, description: 'Associated Ride ID' })
  @IsOptional()
  @IsString()
  rideId?: string;
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 'order_123456789' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'payment_123456789' })
  @IsString()
  transactionId: string;
}
