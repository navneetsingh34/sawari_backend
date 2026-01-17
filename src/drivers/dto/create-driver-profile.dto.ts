/**
 * Create Driver Profile DTO
 *
 * Validates data required to initialize a driver profile.
 * Focuses on vehicle information as userId comes from auth token.
 */

import { IsString, IsNotEmpty, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class VehicleInfoDto {
  @ApiProperty({
    example: 'CAR',
    description: 'Type of vehicle (CAR, BIKE, AUTO)',
  })
  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @ApiProperty({ example: 'Toyota Prius', description: 'Model of the vehicle' })
  @IsString()
  @IsNotEmpty()
  vehicleModel: string;

  @ApiProperty({ example: 'KA-01-HH-1234', description: 'Registration number' })
  @IsString()
  @IsNotEmpty()
  vehicleNumber: string;

  @ApiProperty({ example: 'White', description: 'Color of the vehicle' })
  @IsString()
  @IsNotEmpty()
  vehicleColor: string;
}

export class CreateDriverProfileDto {
  @ApiProperty({ description: 'Vehicle details' })
  @ValidateNested()
  @Type(() => VehicleInfoDto)
  @IsNotEmpty()
  vehicleInfo: VehicleInfoDto;
}
