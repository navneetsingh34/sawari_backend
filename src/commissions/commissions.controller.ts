/**
 * Commissions Controller
 *
 * Read-only access to financial logs.
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/constants/user-roles.constant';

@ApiTags('Commissions')
@ApiBearerAuth('JWT')
@Controller('commissions')
@UseGuards(RolesGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get my commission history' })
  async getMyHistory(@CurrentUser('id') driverId: string) {
    return this.commissionsService.getDriverLogs(driverId);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all commission logs (Admin)' })
  async getAdminReport() {
    return this.commissionsService.getAllLogs();
  }
}
