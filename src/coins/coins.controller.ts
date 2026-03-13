import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { RedeemCoinsDto } from './dto/coins.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Coins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current Ridexa Coins balance' })
  getBalance(@Req() req: any) {
    return this.coinsService.getBalance(req.user.userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get coin transaction history' })
  getHistory(@Req() req: any) {
    return this.coinsService.getHistory(req.user.userId);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem coins for ride discounts' })
  redeemCoins(@Req() req: any, @Body() dto: RedeemCoinsDto) {
    return this.coinsService.redeemCoins(req.user.userId, dto);
  }
}
