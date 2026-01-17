/**
 * WALLET SCHEMA
 *
 * FINANCIAL ARCHITECTURE PRINCIPLES:
 *
 * 1. SEPARATION OF CONCERNS
 *    - Wallet is separate from User to maintain clean domain boundaries
 *    - Allows independent scaling and optimization of financial operations
 *    - Enables easier auditing and compliance reporting
 *
 * 2. BALANCE CACHING STRATEGY
 *    - Balance is cached here for performance (O(1) reads)
 *    - Source of truth is the Transaction ledger
 *    - Balance can be recalculated from transactions if needed
 *    - This pattern is standard in banking systems
 *
 * 3. WHY THIS MATTERS
 *    - In production, wallet reads happen 100x more than writes
 *    - Calculating balance from transactions on every read is expensive
 *    - Cached balance + immutable transaction log = best of both worlds
 *    - Allows for balance reconciliation and audit trails
 *
 * 4. AUDIT & COMPLIANCE
 *    - Every balance change must have a corresponding transaction
 *    - Transactions are immutable (never updated, only created)
 *    - This creates a complete audit trail for regulators
 *    - Supports dispute resolution and financial forensics
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/schemas/user.schema';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true, collection: 'wallets' })
export class Wallet {
  @ApiProperty({
    description: 'Reference to the driver/user who owns this wallet',
    example: '507f1f77bcf86cd799439011',
  })
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true, // One wallet per user
    index: true, // Fast lookups by userId
  })
  userId: string;

  /**
   * BALANCE FIELD
   *
   * CRITICAL RULES:
   * - NEVER update this field directly in business logic
   * - ONLY update through WalletService.creditWallet() or debitWallet()
   * - These methods ensure transaction records are created atomically
   * - Balance must always equal SUM(transactions.amount) for this wallet
   *
   * RECONCILIATION:
   * - Periodic jobs should verify: wallet.balance === sum(transactions)
   * - Any mismatch indicates a critical bug or data corruption
   * - Must be investigated immediately and corrected
   */
  @ApiProperty({
    description: 'Current wallet balance (cached from transactions)',
    example: 5000.5,
    minimum: 0,
  })
  @Prop({
    required: true,
    default: 0,
    min: 0, // Prevent negative balances (can be configured per business rules)
  })
  balance: number;

  /**
   * CURRENCY FIELD
   *
   * MULTI-CURRENCY CONSIDERATIONS:
   * - Currently hardcoded to INR for Indian market
   * - In future, this enables multi-currency support
   * - Exchange rates would be handled at transaction creation time
   * - Never mix currencies in calculations
   */
  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'INR',
    default: 'INR',
  })
  @Prop({
    required: true,
    default: 'INR',
    enum: ['INR'], // Extend this when supporting multiple currencies
  })
  currency: string;

  @ApiProperty({
    description: 'Wallet creation timestamp',
    example: '2026-01-17T12:00:00Z',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Last wallet update timestamp',
    example: '2026-01-17T12:30:00Z',
  })
  updatedAt?: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

/**
 * INDEXES
 *
 * Performance optimization for common queries:
 *
 * 1. userId (unique, indexed)
 *    - Primary lookup pattern: "get wallet for user X"
 *    - Ensures one wallet per user
 *    - Enables fast O(log n) lookups
 *
 * 2. Future indexes to consider:
 *    - Compound index on (userId, currency) if multi-currency
 *    - Index on balance for admin queries (top earners, etc.)
 */

// Additional compound indexes if needed
WalletSchema.index({ userId: 1, currency: 1 });
