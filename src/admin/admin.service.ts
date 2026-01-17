/**
 * ADMIN SERVICE
 *
 * Central hub for all administrative actions and aggregated reporting.
 * Read-heavy logic optimized for dashboards.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Ride, RideDocument } from '../rides/schemas/ride.schema';
import {
  CommissionLog,
  CommissionLogDocument,
} from '../commissions/schemas/commission.schema';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import { AdminQueryDto, AdminUserActionDto } from './dto/admin-query.dto';
import { DashboardMetricsResponseDto } from './dto/admin-dashboard.dto';
import { UserRole } from '../common/constants/user-roles.constant';
import { RideStatus } from '../rides/enums/ride-status.enum';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
    @InjectModel(CommissionLog.name)
    private commissionModel: Model<CommissionLogDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  /**
   * DASHBOARD METRICS
   * High-level overview for the admin landing page.
   */
  async getDashboardMetrics(): Promise<DashboardMetricsResponseDto> {
    const [
      totalUsers,
      activeDrivers,
      completedRides,
      activeRides,
      revenueStats,
      walletStats,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: UserRole.RIDER }),
      this.userModel.countDocuments({ role: UserRole.DRIVER, isActive: true }),
      this.rideModel.countDocuments({ status: RideStatus.COMPLETED }),
      this.rideModel.countDocuments({
        status: { $in: [RideStatus.REQUESTED, RideStatus.STARTED] },
      }),
      this.commissionModel.aggregate([
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
      this.walletModel.aggregate([
        { $group: { _id: null, total: { $sum: '$balance' } } },
      ]),
    ]);

    return {
      totalUsers,
      activeDrivers,
      completedRides,
      activeRides,
      totalRevenue: revenueStats[0]?.total || 0,
      pendingPayouts: walletStats[0]?.total || 0, // Simplifying: Total wallet balance = liability
    };
  }

  /**
   * USER MANAGEMENT
   * Paginated list with filters.
   */
  async getUsers(query: AdminQueryDto) {
    const buffer = {};
    if (query.role) buffer['role'] = query.role;
    if (query.search) {
      buffer['$or'] = [
        { email: new RegExp(query.search, 'i') },
        { phone: new RegExp(query.search, 'i') },
        { name: new RegExp(query.search, 'i') },
      ];
    }

    const total = await this.userModel.countDocuments(buffer);
    const users = await this.userModel
      .find(buffer)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .exec();

    return {
      data: users,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * USER DETAILS
   * Deep dive into a specific user.
   */
  async getUserDetails(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const wallet = await this.walletModel.findOne({ userId: user._id } as any);

    // Recent rides
    const rides = await this.rideModel
      .find({
        $or: [{ riderId: userId }, { driverId: userId }],
      })
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      profile: user,
      wallet: wallet,
      recentActivity: rides,
    };
  }

  /**
   * MODERATION: BLOCK/UNBLOCK
   * Soft block by setting isActive: false.
   */
  async toggleUserStatus(
    userId: string,
    action: AdminUserActionDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Toggle logic
    user.isActive = !user.isActive;

    // Log moderation action (In a real system, save to AdminAuditLog)
    this.logger.warn(
      `Admin toggled status for user ${userId}. New status: ${user.isActive}. Reason: ${action.reason}`,
    );

    return user.save();
  }

  /**
   * RIDE MONITORING
   */
  async getRides(query: AdminQueryDto) {
    const filter: any = {};

    if (query.status) filter.status = query.status;
    if (query.startDate && query.endDate) {
      filter.createdAt = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate),
      };
    }

    const total = await this.rideModel.countDocuments(filter);
    const rides = await this.rideModel
      .find(filter)
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .exec();

    return {
      data: rides,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * FINANCIAL OVERSIGHT
   * Commission reports.
   */
  async getFinancialReport(limit: number = 20) {
    return this.commissionModel
      .find()
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
