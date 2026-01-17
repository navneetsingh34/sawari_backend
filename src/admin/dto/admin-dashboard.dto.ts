import { ApiProperty } from '@nestjs/swagger';

/**
 * Dashboard Metrics Response
 *
 * Aggregated data for the admin dashboard.
 */
export class DashboardMetricsResponseDto {
  @ApiProperty({ description: 'Total registered users (all roles)' })
  totalUsers: number;

  @ApiProperty({ description: 'Total active drivers' })
  activeDrivers: number;

  @ApiProperty({ description: 'Total rides completed' })
  completedRides: number;

  @ApiProperty({ description: 'Total active rides (Requested/Started)' })
  activeRides: number;

  @ApiProperty({ description: 'Total platform revenue (Commission collected)' })
  totalRevenue: number;

  @ApiProperty({ description: 'Total pending payouts to drivers' })
  pendingPayouts: number;
}
