/**
 * Update Driver Vehicle DTO
 *
 * Allows updating vehicle details.
 */

import { PartialType } from '@nestjs/swagger';
import { VehicleInfoDto } from './create-driver-profile.dto';

export class UpdateDriverVehicleDto extends PartialType(VehicleInfoDto) {}
