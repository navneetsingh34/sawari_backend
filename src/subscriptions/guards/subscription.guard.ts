/**
 * Subscription Active Guard
 *
 * Protects routes that strictly require an active plan.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class SubscriptionActiveGuard implements CanActivate {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) return false;

    const isActive = await this.subscriptionsService.isSubscriptionActive(
      user.sub,
    );
    if (!isActive) {
      throw new ForbiddenException(
        'Active subscription required for this action',
      );
    }

    return true;
  }
}
