import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: 'Payment Issue' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'I was overcharged for my last ride.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'ride_12345' })
  @IsOptional()
  @IsString()
  rideId?: string;
}
