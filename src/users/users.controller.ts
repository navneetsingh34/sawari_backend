/**
 * Users Controller
 *
 * Handles HTTP requests for user profile management.
 *
 * Responsibilities:
 * - Get current user profile
 * - Update current user profile
 * - Soft delete current user account
 *
 * Security:
 * - All endpoints protected by strict JWT Guard
 * - Accessible to all authenticated roles (RIDER, DRIVER, ADMIN)
 * - Users can only access/modify their OWN data (@CurrentUser)
 */

import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './schemas/user.schema';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get My Profile
   *
   * Retrieves the profile of the currently authenticated user.
   *
   * @param user - Injected by @CurrentUser() decorator
   */
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: User,
  })
  getProfile(@CurrentUser() user: User) {
    // The user object is already attached to request by JwtStrategy
    // and transformed by UserSchema toJSON (removing password/tokens)
    return user;
  }

  /**
   * Update My Profile
   *
   * Updates allowed fields (name) for the current user.
   *
   * @param userId - ID from current authenticated user
   * @param updateDto - Validated update data
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
   *
   * Deactivates the account and invalidates tokens.
   *
   * @param userId - ID from current authenticated user
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
}
