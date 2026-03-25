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

  @ApiPropertyOptional({ description: 'Sender Name (Parcel)', example: 'John Doe' })
  @IsOptional()
  @IsString()
  senderName?: string;

  @ApiPropertyOptional({ description: 'Sender Phone (Parcel)', example: '9999999999' })
  @IsOptional()
  @IsString()
  senderPhone?: string;

  @ApiPropertyOptional({ description: 'Receiver Name (Parcel)', example: 'Jane Smith' })
  @IsOptional()
  @IsString()
  receiverName?: string;

  @ApiPropertyOptional({ description: 'Receiver Phone (Parcel)', example: '8888888888' })
  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @ApiPropertyOptional({ description: 'Parcel Category', example: 'Documents' })
  @IsOptional()
  @IsString()
  parcelCategory?: string;

  @ApiPropertyOptional({ description: 'Parcel Weight (kg)', example: 2.5 })
  @IsOptional()
  @IsNumber()
  parcelWeight?: number;

  @ApiPropertyOptional({ description: 'Is Parcel Fragile?', example: true })
  @IsOptional()
  @IsBoolean()
  fragile?: boolean;

  @ApiPropertyOptional({ description: 'Schedule this ride for later' })
  @IsOptional()
  @IsBoolean()
  isScheduled?: boolean;

  @ApiPropertyOptional({ description: 'Date and time for scheduled ride (ISO string)' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
