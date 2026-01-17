import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/constants/user-roles.constant';
import { RideStatus } from '../../rides/enums/ride-status.enum';

/**
 * Standard Admin Pagination & Filter Query
 *
 * Used for listing Users, Drivers, and Rides.
 */
export class AdminQueryDto {
  @ApiPropertyOptional({ description: 'Page number (default: 1)', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page (default: 10)',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search term (Name, Phone, Email)',
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Filter by User Role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: RideStatus,
    description: 'Filter by Ride Status',
  })
  @IsOptional()
  @IsEnum(RideStatus)
  status?: RideStatus; // Can be reused for User status (active/inactive) logic if needed, but primarily for Rides

  @ApiPropertyOptional({ description: 'Start Date (ISO 8601)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End Date (ISO 8601)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

/**
 * Block/Unblock User DTO
 */
export class AdminUserActionDto {
  @ApiPropertyOptional({ description: 'Reason for blocking/unblocking' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Block duration (optional)' })
  @IsOptional()
  @IsString()
  duration?: string;
}
