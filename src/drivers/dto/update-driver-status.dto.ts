/**
 * Update Driver Status DTO
 *
 * Validates online/offline toggle.
 */

import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDriverStatusDto {
  @ApiProperty({ description: 'Online status', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isOnline: boolean;
}
