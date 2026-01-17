/**
 * Create Ride DTO
 *
 * Validates input for initiating a ride request.
 * Simply accepts lat/lng for pickup and drop.
 */

import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class LocationDto {
  @ApiProperty({ example: 12.9716, description: 'Latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 77.5946, description: 'Longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    example: 'Indiranagar Metro',
    description: 'Address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateRideDto {
  @ApiProperty({ description: 'Pickup Location' })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  pickup: LocationDto;

  @ApiProperty({ description: 'Drop Location' })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  drop: LocationDto;
}
