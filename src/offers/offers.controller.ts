import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { OffersService } from './offers.service';
import { ApplyOfferDto } from './dto/offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Offers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of active offers' })
  getActiveOffers() {
    return this.offersService.getActiveOffers();
  }

  @Post('apply')
  @ApiOperation({ summary: 'Calculate discount for an offer code' })
  applyOffer(@Body() dto: ApplyOfferDto) {
    return this.offersService.applyOffer(dto);
  }
}
