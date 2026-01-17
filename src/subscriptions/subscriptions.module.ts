import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';

@Global() // Global so Bids/Commission/Rides can check priority easily?
// The Prompt said "Create a subscriptions module... Explain why...".
// Making it Global is easiest for cross-cutting "Priority" checks handled by other modules,
// ensuring we don't have to import SubscriptionsModule into every single feature module manually
// if it becomes a core business rule.
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
