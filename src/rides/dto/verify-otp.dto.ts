/**
 * Verify OTP DTO
 *
 * Used by driver to verify rider's OTP before starting ride.
 */

import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
    @ApiProperty({
        description: '4-digit OTP from rider',
        example: '1234',
        minLength: 4,
        maxLength: 4,
    })
    @IsString()
    @IsNotEmpty()
    @Length(4, 4, { message: 'OTP must be exactly 4 digits' })
    otp: string;
}
