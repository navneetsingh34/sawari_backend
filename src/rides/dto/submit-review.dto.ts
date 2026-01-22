/**
 * Submit Review DTO
 *
 * Used by rider to submit driver review after ride completion.
 */

import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitReviewDto {
    @ApiProperty({
        description: 'Driver rating (1-5 stars)',
        example: 5,
        minimum: 1,
        maximum: 5,
    })
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiProperty({
        description: 'Optional text review',
        example: 'Great driver, very professional!',
        required: false,
    })
    @IsOptional()
    @IsString()
    review?: string;
}
