/**
 * Estimate Ride DTO
 * 
 * Input for calculating ride fare and distance.
 */
import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from './create-ride.dto';
import { RideType } from '../enums/ride-type.enum';
import { IsString, IsOptional } from 'class-validator';

export class EstimateRideDto {
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

    @ApiProperty({ description: 'Vehicle Type: MOTO, AUTO, CAR, CAB_XL, PREMIER', example: 'CAR', required: false })
    @IsOptional()
    @IsString()
    vehicleType?: string;

    @ApiProperty({ description: 'Ride Type: CITY, INTERCITY, OUTSTATION, PARCEL', example: 'CITY', required: false })
    @IsOptional()
    @IsString() 
    rideType?: RideType;
}
