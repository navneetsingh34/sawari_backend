/**
 * WALLET CONTROLLER
 *
 * Provides access to financial data and operations for drivers and riders.
 */

import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
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
  TopUpWalletDto,
} from './dto/wallet.dto';
import { TransactionReason } from './schemas/transaction.schema';

@ApiTags('Wallet')
@ApiBearerAuth('JWT')
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get('balance')
  @Roles(UserRole.DRIVER, UserRole.RIDER)
  @ApiOperation({
    summary: 'Get current wallet balance',
    description:
      "Returns the cached balance from the user's wallet. Source of truth is the transaction ledger.",
  })
  @ApiOkResponse({ type: WalletBalanceResponseDto })
  async getBalance(@CurrentUser('id') userId: string) {
    return this.walletService.getWalletByUserId(userId);
  }

  @Get('transactions')
  @Roles(UserRole.DRIVER, UserRole.RIDER)
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

  @Post('top-up')
  @Roles(UserRole.DRIVER, UserRole.RIDER)
  @ApiOperation({
    summary: 'Add money to wallet',
    description: 'Adds funds to the user wallet (Simulated payment)',
  })
  async topUp(@CurrentUser('id') userId: string, @Body() dto: TopUpWalletDto) {
    return this.walletService.creditWallet(
      userId,
      dto.amount,
      TransactionReason.DEPOSIT,
      `TOPUP_${Date.now()}`,
      { source: 'manual_topup' },
    );
  }
}
