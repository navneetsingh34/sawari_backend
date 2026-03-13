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
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RideType } from '../enums/ride-type.enum';

export class LocationDto {
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

export class RideOptionsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasAc?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isShared?: boolean;
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

  @ApiProperty({
    description: 'Custom fare offered by rider (optional, overrides system estimate)',
    example: 300,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  customFare?: number;

  @ApiProperty({ description: 'Vehicle Type: MOTO, AUTO, CAR, CAB_XL, PREMIER', example: 'CAR' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiProperty({ description: 'Ride Type: CITY, INTERCITY, OUTSTATION, PARCEL', example: 'CITY' })
  @IsOptional()
  @IsString() // Can also use @IsEnum(RideType) but keeping it simple string matching
  rideType?: RideType;

  @ApiProperty({ description: 'Ride Options', example: { hasAc: true, isShared: false } })
  @IsOptional()
  @ValidateNested()
  @Type(() => RideOptionsDto)
  rideOptions?: RideOptionsDto;

  @ApiPropertyOptional({ description: 'Schedule this ride for later' })
  @IsOptional()
  @IsBoolean()
  isScheduled?: boolean;

  @ApiPropertyOptional({ description: 'Date and time for scheduled ride (ISO string)' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
