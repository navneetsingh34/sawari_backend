import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Ride, RideSchema } from '../rides/schemas/ride.schema';
import {
  CommissionLog,
  CommissionLogSchema,
} from '../commissions/schemas/commission.schema';
import { Wallet, WalletSchema } from '../wallet/schemas/wallet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Ride.name, schema: RideSchema },
      { name: CommissionLog.name, schema: CommissionLogSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
