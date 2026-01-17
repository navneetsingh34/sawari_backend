/**
 * ADMIN CONTROLLER
 *
 * Secure entry point for all administrative actions.
 *
 * SECURITY RULES:
 * 1. GUARD: All routes protected by JwtAuthGuard AND RolesGuard.
 * 2. ROLE: @Roles(UserRole.ADMIN) applied at controller level.
 * 3. READ-ONLY: Most routes are GET. Write actions are explicit and logged.
 *
 * WHY IS THIS ISOLATED?
 * Admin APIs are a high-value target. Isolating them in a separate controller/module
 * allows strictly separate permission policies and easier audit logging.
 */

import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/constants/user-roles.constant';
import { AdminQueryDto, AdminUserActionDto } from './dto/admin-query.dto';
import { DashboardMetricsResponseDto } from './dto/admin-dashboard.dto';

@ApiTags('Admin')
@ApiBearerAuth('JWT')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // CRITICAL: Applies to ALL routes in this controller
@ApiForbiddenResponse({ description: 'Forbidden. Requires ADMIN role.' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * DASHBOARD
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Get Platform Overview Metrics' })
  @ApiOkResponse({ type: DashboardMetricsResponseDto })
  async getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  /**
   * USER MANAGEMENT
   */
  @Get('users')
  @ApiOperation({ summary: 'List Users (Paginated & Filterable)' })
  async getUsers(@Query() query: AdminQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({
    summary: 'Get detailed user profile with wallet & ride stats',
  })
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Block/Unblock User (Soft Block)' })
  async toggleUserStatus(
    @Param('id') id: string,
    @Body() action: AdminUserActionDto,
  ) {
    return this.adminService.toggleUserStatus(id, action);
  }

  /**
   * RIDE MONITORING
   */
  @Get('rides')
  @ApiOperation({ summary: 'Monitor Rides (History & Active)' })
  async getRides(@Query() query: AdminQueryDto) {
    return this.adminService.getRides(query);
  }

  /**
   * FINANCIALS
   */
  @Get('financials/commissions')
  @ApiOperation({ summary: 'View Commission Ledger (Revenue Feed)' })
  async getFinancialReport() {
    return this.adminService.getFinancialReport();
  }
}
