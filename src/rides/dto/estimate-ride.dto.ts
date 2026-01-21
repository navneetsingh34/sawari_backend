/**
 * Estimate Ride DTO
 * 
 * Input for calculating ride fare and distance.
 */
import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from './create-ride.dto';

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
}
