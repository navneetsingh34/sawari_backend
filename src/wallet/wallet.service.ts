import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
  TransactionReason,
} from './schemas/transaction.schema';

/**
 * WALLET SERVICE
 *
 * CRITICAL FINANCIAL PRINCIPLES:
 *
 * 1. ATOMICITY
 *    - Every balance change MUST be atomic with its transaction record
 *    - Use MongoDB transactions to ensure both succeed or both fail
 *    - Prevents orphaned transactions or incorrect balances
 *
 * 2. IMMUTABILITY
 *    - Transaction records are NEVER updated, only created
 *    - Balance is the ONLY mutable field in wallet
 *    - This creates an immutable audit trail
 *
 * 3. IDEMPOTENCY
 *    - Same operation with same referenceId should not execute twice
 *    - Prevents duplicate charges from retries
 *    - Critical for distributed systems and network failures
 *
 * 4. ISOLATION
 *    - Other modules should NEVER touch wallet balance directly
 *    - All money operations go through this service
 *    - Enforces business rules and safeguards
 *
 * 5. AUDITABILITY
 *    - Every operation is logged
 *    - Failed operations are logged with reasons
 *    - Supports forensic analysis and debugging
 */

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  /**
   * CREATE OR GET WALLET
   *
   * Ensures every user has exactly one wallet
   * Idempotent - safe to call multiple times
   */
  async getOrCreateWallet(userId: string): Promise<WalletDocument> {
    try {
      // Try to find existing wallet
      let wallet = await this.walletModel.findOne({
        userId: new Types.ObjectId(userId),
      } as any);

      if (wallet) {
        return wallet;
      }

      // Create new wallet if doesn't exist
      wallet = await this.walletModel.create({
        userId: new Types.ObjectId(userId),
        balance: 0,
        currency: 'INR',
      } as any);

      this.logger.log(`Created new wallet for user ${userId}: ${wallet._id}`);
      return wallet;
    } catch (error) {
      this.logger.error(
        `Failed to get/create wallet for user ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to initialize wallet');
    }
  }

  /**
   * GET WALLET BY USER ID
   *
   * Primary lookup method for wallet operations
   */
  async getWalletByUserId(userId: string): Promise<WalletDocument> {
    const wallet = await this.walletModel.findOne({
      userId: new Types.ObjectId(userId),
    } as any);

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }

    return wallet;
  }

  /**
   * CREDIT WALLET - ADD MONEY
   */
  async creditWallet(
    userId: string,
    amount: number,
    reason: TransactionReason,
    referenceId?: string,
    metadata?: Record<string, any>,
    session?: ClientSession,
  ): Promise<TransactionDocument> {
    // Input validation
    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }

    // Get or create wallet
    const wallet = await this.getOrCreateWallet(userId);

    // IDEMPOTENCY CHECK
    // Prevent duplicate transactions for same reference
    if (referenceId) {
      const existingTransaction = await this.transactionModel.findOne({
        walletId: wallet._id,
        referenceId,
        type: TransactionType.CREDIT,
        reason,
      } as any);

      if (existingTransaction) {
        this.logger.warn(
          `Duplicate credit attempt detected for reference ${referenceId}. ` +
            `Returning existing transaction ${existingTransaction._id}`,
        );
        return existingTransaction;
      }
    }

    // ATOMIC TRANSACTION
    // Both transaction record and balance update must succeed together
    const useSession = session || (await this.walletModel.db.startSession());
    const shouldEndSession = !session; // Only end if we created it

    try {
      if (!session) {
        useSession.startTransaction();
      }

      // Step 1: Create immutable transaction record
      const transactions = await this.transactionModel.create(
        [
          {
            walletId: wallet._id,
            userId: new Types.ObjectId(userId),
            type: TransactionType.CREDIT,
            amount,
            reason,
            referenceId,
            metadata,
            balanceAfter: wallet.balance + amount, // Snapshot balance
          } as any,
        ],
        { session: useSession },
      );

      const transaction = transactions[0];

      // Step 2: Update wallet balance atomically
      const updatedWallet = await this.walletModel.findByIdAndUpdate(
        wallet._id,
        { $inc: { balance: amount } },
        { new: true, session: useSession },
      );

      if (!updatedWallet) {
        throw new InternalServerErrorException(
          'Failed to update wallet balance',
        );
      }

      // Commit transaction
      if (!session) {
        await useSession.commitTransaction();
      }

      this.logger.log(
        `Credited ₹${amount} to wallet ${wallet._id} for ${reason}. ` +
          `New balance: ₹${updatedWallet.balance}. Transaction: ${transaction._id}`,
      );

      return transaction;
    } catch (error) {
      // Rollback on any error
      if (!session) {
        await useSession.abortTransaction();
      }

      this.logger.error(
        `Failed to credit ₹${amount} to wallet ${wallet._id}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to credit wallet');
    } finally {
      if (shouldEndSession) {
        useSession.endSession();
      }
    }
  }

  /**
   * DEBIT WALLET - REMOVE MONEY
   */
  async debitWallet(
    userId: string,
    amount: number,
    reason: TransactionReason,
    referenceId?: string,
    metadata?: Record<string, any>,
    allowNegative: boolean = false,
    session?: ClientSession,
  ): Promise<TransactionDocument> {
    // Input validation
    if (amount <= 0) {
      throw new BadRequestException('Debit amount must be positive');
    }

    // Get wallet
    const wallet = await this.getWalletByUserId(userId);

    // INSUFFICIENT BALANCE CHECK
    // Prevent negative balance unless explicitly allowed
    if (!allowNegative && wallet.balance < amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ₹${wallet.balance}, Required: ₹${amount}`,
      );
    }

    // IDEMPOTENCY CHECK
    if (referenceId) {
      const existingTransaction = await this.transactionModel.findOne({
        walletId: wallet._id,
        referenceId,
        type: TransactionType.DEBIT,
        reason,
      } as any);

      if (existingTransaction) {
        this.logger.warn(
          `Duplicate debit attempt detected for reference ${referenceId}. ` +
            `Returning existing transaction ${existingTransaction._id}`,
        );
        return existingTransaction;
      }
    }

    // ATOMIC TRANSACTION
    const useSession = session || (await this.walletModel.db.startSession());
    const shouldEndSession = !session;

    try {
      if (!session) {
        useSession.startTransaction();
      }

      // Step 1: Create immutable transaction record
      const transactions = await this.transactionModel.create(
        [
          {
            walletId: wallet._id,
            userId: new Types.ObjectId(userId),
            type: TransactionType.DEBIT,
            amount,
            reason,
            referenceId,
            metadata,
            balanceAfter: wallet.balance - amount, // Snapshot balance
          } as any,
        ],
        { session: useSession },
      );

      const transaction = transactions[0];

      // Step 2: Update wallet balance atomically
      const updatedWallet = await this.walletModel.findByIdAndUpdate(
        wallet._id,
        { $inc: { balance: -amount } },
        { new: true, session: useSession },
      );

      if (!updatedWallet) {
        throw new InternalServerErrorException(
          'Failed to update wallet balance',
        );
      }

      // Commit transaction
      if (!session) {
        await useSession.commitTransaction();
      }

      this.logger.log(
        `Debited ₹${amount} from wallet ${wallet._id} for ${reason}. ` +
          `New balance: ₹${updatedWallet.balance}. Transaction: ${transaction._id}`,
      );

      return transaction;
    } catch (error) {
      // Rollback on any error
      if (!session) {
        await useSession.abortTransaction();
      }

      this.logger.error(
        `Failed to debit ₹${amount} from wallet ${wallet._id}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to debit wallet');
    } finally {
      if (shouldEndSession) {
        useSession.endSession();
      }
    }
  }

  /**
   * GET TRANSACTION HISTORY
   *
   * WHY PAGINATION IS MANDATORY:
   *
   * 1. PERFORMANCE
   *    - Active drivers may have thousands of transactions
   *    - Loading all at once would be slow and memory-intensive
   *    - Pagination enables fast, efficient queries
   *
   * 2. USER EXPERIENCE
   *    - Users typically care about recent transactions
   *    - Infinite scroll or "load more" patterns require pagination
   *    - Better mobile experience with smaller payloads
   *
   * 3. SCALABILITY
   *    - System can handle millions of transactions
   *    - Without pagination, queries would timeout
   *    - Enables horizontal scaling
   */
  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: TransactionType,
    reason?: TransactionReason,
  ): Promise<{
    transactions: TransactionDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const wallet = await this.getWalletByUserId(userId);

    // Build query filters
    const query: any = { walletId: wallet._id };
    if (type) query.type = type;
    if (reason) query.reason = reason;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel for performance
    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(query)
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.transactionModel.countDocuments(query),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * RECONCILE WALLET BALANCE
   *
   * Verifies that wallet.balance === SUM(transactions)
   * Should be run periodically as a health check
   * Any mismatch indicates a critical bug
   */
  async reconcileBalance(userId: string): Promise<{
    walletBalance: number;
    calculatedBalance: number;
    isMatch: boolean;
    discrepancy?: number;
  }> {
    const wallet = await this.getWalletByUserId(userId);

    // Calculate balance from transactions
    const result = await this.transactionModel.aggregate([
      { $match: { walletId: wallet._id } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let credits = 0;
    let debits = 0;

    result.forEach((item) => {
      if (item._id === TransactionType.CREDIT) {
        credits = item.total;
      } else if (item._id === TransactionType.DEBIT) {
        debits = item.total;
      }
    });

    const calculatedBalance = credits - debits;
    const isMatch = Math.abs(wallet.balance - calculatedBalance) < 0.01; // Allow for floating point errors

    if (!isMatch) {
      this.logger.error(
        `Balance mismatch for wallet ${wallet._id}! ` +
          `Stored: ₹${wallet.balance}, Calculated: ₹${calculatedBalance}`,
      );
    }

    return {
      walletBalance: wallet.balance,
      calculatedBalance,
      isMatch,
      discrepancy: isMatch ? undefined : wallet.balance - calculatedBalance,
    };
  }
}
