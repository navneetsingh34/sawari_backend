/**
 * Users Controller
 *
 * Handles HTTP requests for user profile management.
 *
 * Responsibilities:
 * - Get current user profile
 * - Update current user profile
 * - Soft delete current user account
 * - Manage emergency contacts (SOS feature)
 *
 * Security:
 * - All endpoints protected by strict JWT Guard
 * - Accessible to all authenticated roles (RIDER, DRIVER, ADMIN)
 * - Users can only access/modify their OWN data (@CurrentUser)
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { AddEmergencyContactDto } from './dto/emergency-contact.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './schemas/user.schema';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /**
   * Get My Profile
   */
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: User,
  })
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  /**
   * Update My Profile
   */
  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateDto);
  }

  /**
   * Delete My Account (Soft Delete)
   */
  @Delete('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate current user account (Soft Delete)' })
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully',
  })
  async deleteAccount(@CurrentUser('id') userId: string) {
    return this.usersService.softDelete(userId);
  }

  // ============ Emergency Contacts (SOS Feature) ============

  @Get('emergency-contacts')
  @ApiOperation({ summary: 'Get all emergency contacts' })
  @ApiResponse({ status: 200, description: 'Emergency contacts list' })
  async getEmergencyContacts(@CurrentUser('id') userId: string) {
    return this.usersService.getEmergencyContacts(userId);
  }

  @Post('emergency-contacts')
  @ApiOperation({ summary: 'Add an emergency contact (max 5)' })
  @ApiResponse({ status: 201, description: 'Contact added successfully' })
  @ApiResponse({ status: 400, description: 'Max contacts reached' })
  async addEmergencyContact(
    @CurrentUser('id') userId: string,
    @Body() contactDto: AddEmergencyContactDto,
  ) {
    return this.usersService.addEmergencyContact(userId, contactDto);
  }

  @Delete('emergency-contacts/:phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an emergency contact by phone' })
  @ApiResponse({ status: 200, description: 'Contact removed successfully' })
  async removeEmergencyContact(
    @CurrentUser('id') userId: string,
    @Param('phone') phone: string,
  ) {
    return this.usersService.removeEmergencyContact(userId, phone);
  }
}
