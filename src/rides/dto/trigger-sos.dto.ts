/**
 * Trigger SOS DTO
 *
 * Validation for triggering an SOS alert during a ride.
 */

import { IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TriggerSosDto {
    @ApiPropertyOptional({
        description: 'Current latitude of the user',
        example: 12.9716,
    })
    @IsOptional()
    @IsNumber()
    latitude?: number;

    @ApiPropertyOptional({
        description: 'Current longitude of the user',
        example: 77.5946,
    })
    @IsOptional()
    @IsNumber()
    longitude?: number;
}
