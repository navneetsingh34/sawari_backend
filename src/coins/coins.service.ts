import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CoinTransaction, CoinTransactionDocument } from './schemas/coin-transaction.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RedeemCoinsDto } from './dto/coins.dto';

@Injectable()
export class CoinsService {
  constructor(
    @InjectModel(CoinTransaction.name) private coinModel: Model<CoinTransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId).select('ridexaCoins').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.ridexaCoins || 0;
  }

  async getHistory(userId: string): Promise<CoinTransactionDocument[]> {
    return this.coinModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async awardCoins(userId: string, amount: number, reason: string, rideId?: string): Promise<void> {
    const session = await this.userModel.db.startSession();
    session.startTransaction();
    try {
      await this.userModel.findByIdAndUpdate(userId, { $inc: { ridexaCoins: amount } }, { session });
      
      const transaction = new this.coinModel({
        userId,
        amount,
        type: 'EARNED',
        reason,
        rideId,
      });
      await transaction.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async redeemCoins(userId: string, dto: RedeemCoinsDto): Promise<{ success: boolean; newBalance: number }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if ((user.ridexaCoins || 0) < dto.amount) {
      throw new BadRequestException('Insufficient coin balance');
    }

    const session = await this.userModel.db.startSession();
    session.startTransaction();
    try {
      user.ridexaCoins -= dto.amount;
      await user.save({ session });

      const transaction = new this.coinModel({
        userId,
        amount: dto.amount,
        type: 'REDEEMED',
        reason: `Discount on ride ${dto.rideId}`, // Simplified reason
        rideId: dto.rideId,
      });
      await transaction.save({ session });

      await session.commitTransaction();
      return { success: true, newBalance: user.ridexaCoins };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
