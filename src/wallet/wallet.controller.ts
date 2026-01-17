/**
 * WALLET CONTROLLER
 *
 * Provides read-only access to financial data for drivers and admins.
 * Write operations (credit/debit) are internal-only via WalletService.
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../common/constants/user-roles.constant';
import {
  GetTransactionHistoryDto,
  TransactionHistoryResponseDto,
  WalletBalanceResponseDto,
} from './dto/wallet.dto';

@ApiTags('Wallet')
@ApiBearerAuth('JWT')
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @Roles(UserRole.DRIVER)
  @ApiOperation({
    summary: 'Get current wallet balance',
    description:
      "Returns the cached balance from the driver's wallet. Source of truth is the transaction ledger.",
  })
  @ApiOkResponse({ type: WalletBalanceResponseDto })
  async getBalance(@CurrentUser('id') userId: string) {
    return this.walletService.getWalletByUserId(userId);
  }

  @Get('transactions')
  @Roles(UserRole.DRIVER)
  @ApiOperation({
    summary: 'Get transaction history',
    description:
      'Returns paginated transaction history with filtering options. Default sort is newest first.',
  })
  @ApiOkResponse({ type: TransactionHistoryResponseDto })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query() query: GetTransactionHistoryDto,
  ) {
    return this.walletService.getTransactionHistory(
      userId,
      query.page,
      query.limit,
      query.type,
      query.reason,
    );
  }
}
