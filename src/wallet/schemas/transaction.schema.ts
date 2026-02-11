/**
 * TRANSACTION SCHEMA - THE IMMUTABLE LEDGER
 *
 * WHY TRANSACTION LEDGERS ARE MANDATORY IN FINTECH:
 *
 * 1. REGULATORY COMPLIANCE
 *    - Financial regulators require complete audit trails
 *    - Every money movement must be traceable and timestamped
 *    - Transactions must be immutable (no updates, only creates)
 *    - Supports tax reporting, fraud detection, and legal disputes
 *
 * 2. DOUBLE-ENTRY BOOKKEEPING PRINCIPLE
 *    - Every financial transaction has equal and opposite effects
 *    - Credits must balance debits across the system
 *    - This schema represents one "leg" of the transaction
 *    - System-wide balance should always be zero-sum
 *
 * 3. DISPUTE RESOLUTION
 *    - Users may dispute charges months later
 *    - Complete transaction history enables investigation
 *    - Timestamps prove when money moved
 *    - Reference IDs link to source events (rides, subscriptions)
 *
 * 4. FINANCIAL RECONCILIATION
 *    - Daily/monthly reconciliation requires transaction-level data
 *    - Wallet balance = SUM(transactions) must always hold true
 *    - Discrepancies indicate bugs or fraud
 *    - Transaction log is the source of truth
 *
 * 5. BUSINESS INTELLIGENCE
 *    - Analyze revenue streams (ride earnings vs. commissions)
 *    - Track subscription payment patterns
 *    - Identify refund trends
 *    - Support data-driven decision making
 *
 * 6. IDEMPOTENCY & SAFETY
 *    - Prevents duplicate charges from retries
 *    - Each transaction has unique ID
 *    - Enables safe retry logic in distributed systems
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Wallet } from './wallet.schema';
import { User } from '../../users/schemas/user.schema';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  CREDIT = 'CREDIT', // Money added to wallet
  DEBIT = 'DEBIT', // Money removed from wallet
}

export enum TransactionReason {
  RIDE_EARNING = 'RIDE_EARNING', // Driver earned from completed ride
  COMMISSION = 'COMMISSION', // Platform commission deducted
  SUBSCRIPTION = 'SUBSCRIPTION', // Subscription payment
  REFUND = 'REFUND', // Money returned (future use)
  ADJUSTMENT = 'ADJUSTMENT', // Manual correction (admin only)
  WITHDRAWAL = 'WITHDRAWAL', // Driver withdraws to bank (future)
  BONUS = 'BONUS', // Platform bonus/incentive (future)
  PENALTY = 'PENALTY', // Fine for policy violation (future)
  DEPOSIT = 'DEPOSIT', // Money added by user
}

@Schema({ timestamps: true, collection: 'transactions' })
export class Transaction {
  /**
   * WALLET REFERENCE
   *
   * Links transaction to specific wallet
   * Indexed for fast "get all transactions for wallet X" queries
   */
  @ApiProperty({
    description: 'Reference to the wallet this transaction belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Wallet.name,
    required: true,
    index: true, // Critical for transaction history queries
  })
  walletId: string;

  /**
   * USER REFERENCE
   *
   * Denormalized for performance (avoids wallet join)
   * Enables direct user-level queries
   * Must always match wallet.userId
   */
  @ApiProperty({
    description: 'Reference to the user/driver who owns this transaction',
    example: '507f1f77bcf86cd799439011',
  })
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true, // Enables user-level financial reports
  })
  userId: string;

  /**
   * TRANSACTION TYPE
   *
   * CREDIT vs DEBIT:
   * - CREDIT: Increases wallet balance (ride earnings, refunds, bonuses)
   * - DEBIT: Decreases wallet balance (commissions, subscriptions, withdrawals)
   *
   * WHY NOT JUST USE POSITIVE/NEGATIVE AMOUNTS?
   * - Explicit type makes queries clearer
   * - Prevents sign errors in calculations
   * - Enables type-specific business rules
   * - Better for analytics and reporting
   */
  @ApiProperty({
    description: 'Type of transaction',
    enum: TransactionType,
    example: TransactionType.CREDIT,
  })
  @Prop({
    required: true,
    enum: TransactionType,
    index: true, // Enables filtering by type
  })
  type: string;

  /**
   * AMOUNT FIELD
   *
   * CRITICAL RULES:
   * - Always stored as positive number
   * - Type (CREDIT/DEBIT) determines effect on balance
   * - Use smallest currency unit (paise) for precision
   * - Never use floating point for money in production (consider Decimal128)
   *
   * PRECISION CONSIDERATIONS:
   * - JavaScript Number has precision issues with decimals
   * - For production, consider using Mongoose Decimal128
   * - Or store as integer paise (₹1.00 = 100 paise)
   * - Current implementation uses Number for simplicity
   */
  @ApiProperty({
    description:
      'Transaction amount (always positive, type determines direction)',
    example: 150.5,
    minimum: 0,
  })
  @Prop({
    required: true,
    min: 0, // Amount must be positive
  })
  amount: number;

  /**
   * TRANSACTION REASON
   *
   * WHY REASON IS CRITICAL:
   * - Enables categorized financial reporting
   * - Supports tax calculations (different rates for different reasons)
   * - Required for dispute resolution
   * - Helps users understand their transaction history
   * - Enables business intelligence queries
   *
   * AUDIT IMPORTANCE:
   * - Auditors need to trace money flow by category
   * - "Show me all commission deductions in Q1 2026"
   * - "Calculate total subscription revenue"
   * - Reason makes these queries possible
   */
  @ApiProperty({
    description: 'Reason for this transaction',
    enum: TransactionReason,
    example: TransactionReason.RIDE_EARNING,
  })
  @Prop({
    required: true,
    enum: TransactionReason,
    index: true, // Critical for analytics queries
  })
  reason: string;

  /**
   * REFERENCE ID - THE AUDIT TRAIL LINK
   *
   * WHY REFERENCE ID IS CRITICAL:
   *
   * 1. TRACEABILITY
   *    - Links transaction back to source event
   *    - "Which ride generated this earning?"
   *    - "Which subscription was paid?"
   *    - Essential for dispute resolution
   *
   * 2. IDEMPOTENCY
   *    - Prevents duplicate transactions
   *    - Check: "Did we already process ride X?"
   *    - Enables safe retries in distributed systems
   *
   * 3. RECONCILIATION
   *    - Match transactions to source records
   *    - Verify: ride.fare === transaction.amount
   *    - Detect discrepancies and fraud
   *
   * 4. BUSINESS LOGIC
   *    - "Show earnings from ride #12345"
   *    - "Refund subscription #67890"
   *    - Enables precise financial operations
   *
   * EXAMPLES:
   * - RIDE_EARNING: referenceId = rideId
   * - COMMISSION: referenceId = rideId (same ride, different reason)
   * - SUBSCRIPTION: referenceId = subscriptionId
   * - REFUND: referenceId = original transactionId
   */
  @ApiProperty({
    description: 'Reference to source entity (rideId, subscriptionId, etc.)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @Prop({
    type: String,
    index: true, // Critical for "find transactions for ride X"
  })
  referenceId?: string;

  /**
   * METADATA FIELD
   *
   * Flexible storage for additional context:
   * - Original amount before commission
   * - Commission percentage applied
   * - Payment gateway transaction ID
   * - Admin notes for manual adjustments
   * - Any other context needed for auditing
   */
  @ApiProperty({
    description: 'Additional transaction metadata',
    example: { originalAmount: 200, commissionRate: 0.15 },
    required: false,
  })
  @Prop({
    type: Object,
    default: {},
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Transaction creation timestamp (immutable)',
    example: '2026-01-17T12:00:00Z',
  })
  createdAt?: Date;

  @ApiProperty({
    description:
      'Transaction update timestamp (should never change after creation)',
    example: '2026-01-17T12:00:00Z',
  })
  updatedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

/**
 * INDEXES - OPTIMIZED FOR FINANCIAL QUERIES
 *
 * 1. walletId + createdAt (descending)
 *    - Primary query: "Get recent transactions for wallet"
 *    - Supports pagination efficiently
 *    - Most common user-facing query
 *
 * 2. userId + reason + createdAt
 *    - Analytics: "Driver's ride earnings over time"
 *    - Tax reporting: "All commission deductions in date range"
 *    - Business intelligence queries
 *
 * 3. referenceId
 *    - Idempotency checks: "Did we process this ride?"
 *    - Dispute resolution: "Show all transactions for ride X"
 *    - Reconciliation queries
 *
 * 4. type + createdAt
 *    - System-wide analytics: "Total credits vs debits"
 *    - Financial health monitoring
 */

// Primary query: transaction history for wallet
TransactionSchema.index({ walletId: 1, createdAt: -1 });

// Analytics: user's transactions by reason and time
TransactionSchema.index({ userId: 1, reason: 1, createdAt: -1 });

// Idempotency and reconciliation
// TransactionSchema.index({ referenceId: 1 }); // Handled by @Prop({ index: true })

// System-wide financial analytics
TransactionSchema.index({ type: 1, createdAt: -1 });

// Compound index for complex queries
TransactionSchema.index({ walletId: 1, type: 1, reason: 1 });
