/**
 * Cancel Ride DTO
 * 
 * Input for cancelling a ride.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelRideDto {
    @ApiProperty({
        description: 'Reason for cancellation',
        example: 'Changed my mind',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;
}
