import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import {
  CommissionLog,
  CommissionLogSchema,
} from './schemas/commission.schema';
// SubscriptionsModule is Global, so service is available.

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommissionLog.name, schema: CommissionLogSchema },
    ]),
  ],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
