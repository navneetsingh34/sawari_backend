import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TransactionReason, TransactionType } from '../transaction.schema';

/**
 * DTO for transaction history queries
 * Supports pagination and filtering
 */
export class GetTransactionHistoryDto {
  @ApiProperty({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of transactions per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({
    description: 'Filter by transaction type',
    enum: TransactionType,
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({
    description: 'Filter by transaction reason',
    enum: TransactionReason,
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionReason)
  reason?: TransactionReason;
}

/**
 * Response DTO for wallet balance
 */
export class WalletBalanceResponseDto {
  @ApiProperty({
    description: 'Wallet ID',
    example: '507f1f77bcf86cd799439011',
  })
  walletId: string;

  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'Current balance',
    example: 5000.5,
  })
  balance: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'INR',
  })
  currency: string;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2026-01-17T12:00:00Z',
  })
  updatedAt: Date;
}

/**
 * Response DTO for transaction history
 */
export class TransactionHistoryResponseDto {
  @ApiProperty({
    description: 'List of transactions',
    type: 'array',
  })
  transactions: any[];

  @ApiProperty({
    description: 'Total number of transactions',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;
}

/**
 * Internal DTO for creating transactions
 * NOT exposed via API - used only by internal services
 */
export class CreateTransactionDto {
  @IsString()
  walletId: string;

  @IsString()
  userId: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(TransactionReason)
  reason: TransactionReason;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
