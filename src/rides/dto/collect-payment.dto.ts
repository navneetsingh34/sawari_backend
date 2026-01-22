/**
 * Collect Payment DTO
 *
 * Used by driver to mark payment as collected after ride completion.
 */

import { IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
    CASH = 'CASH',
    UPI = 'UPI',
}

export class CollectPaymentDto {
    @ApiProperty({
        description: 'Payment method used',
        enum: PaymentMethod,
        example: PaymentMethod.CASH,
    })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiProperty({
        description: 'Amount collected',
        example: 250,
    })
    @IsNumber()
    @Min(0)
    amount: number;
}
