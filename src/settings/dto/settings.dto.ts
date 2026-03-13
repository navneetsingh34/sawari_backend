import { IsString, IsOptional, ValidateNested, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class NotificationPrefsDto {
  @IsOptional() @IsBoolean() rides?: boolean;
  @IsOptional() @IsBoolean() promos?: boolean;
  @IsOptional() @IsBoolean() sos?: boolean;
}

class PrivacyPrefsDto {
  @IsOptional() @IsBoolean() showProfilePhoto?: boolean;
  @IsOptional() @IsBoolean() shareRideStatus?: boolean;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'dark', enum: ['light', 'dark', 'system'] })
  @IsOptional()
  @IsEnum(['light', 'dark', 'system'])
  theme?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPrefsDto)
  notificationPrefs?: NotificationPrefsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PrivacyPrefsDto)
  privacy?: PrivacyPrefsDto;
}
