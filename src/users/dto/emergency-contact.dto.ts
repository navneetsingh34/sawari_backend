/**
 * Emergency Contact DTOs
 *
 * Validation for adding/removing emergency contacts.
 */

import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddEmergencyContactDto {
    @ApiProperty({
        description: 'Name of the emergency contact',
        example: 'Mom',
    })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name: string;

    @ApiProperty({
        description: 'Phone number of the emergency contact',
        example: '+919876543210',
    })
    @IsString()
    @MinLength(10)
    @MaxLength(15)
    phone: string;

    @ApiPropertyOptional({
        description: 'Relation with the contact',
        example: 'Mother',
    })
    @IsOptional()
    @IsString()
    @MaxLength(30)
    relation?: string;
}
