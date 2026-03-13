import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Offer, OfferDocument } from './schemas/offer.schema';
import { ApplyOfferDto } from './dto/offer.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
  ) {}

  async getActiveOffers(): Promise<OfferDocument[]> {
    return this.offerModel.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
      $expr: { $lt: ['$usedCount', '$usageLimit'] }
    }).exec();
  }

  async applyOffer(dto: ApplyOfferDto): Promise<{ discountAmount: number, finalFare: number }> {
    const offer = await this.offerModel.findOne({
      code: dto.code.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!offer) {
      throw new NotFoundException('Invalid or expired offer code');
    }

    if (offer.usedCount >= offer.usageLimit) {
      throw new BadRequestException('Offer usage limit exceeded');
    }

    if (dto.rideAmount < offer.minRideAmount) {
      throw new BadRequestException(`Minimum ride amount of ₹${offer.minRideAmount} required for this offer`);
    }

    let discountAmount = 0;

    if (offer.discountType === 'FLAT') {
      discountAmount = offer.discountValue;
    } else if (offer.discountType === 'PERCENT') {
      discountAmount = (dto.rideAmount * offer.discountValue) / 100;
      if (offer.maxDiscount && discountAmount > offer.maxDiscount) {
        discountAmount = offer.maxDiscount;
      }
    }

    // Ensure discount doesn't exceed total fare
    if (discountAmount > dto.rideAmount) {
      discountAmount = dto.rideAmount;
    }

    const finalFare = dto.rideAmount - discountAmount;

    // We don't increment usedCount here, usually done when ride is COMPLETED.
    // This endpoint is just for calculating the estimate.

    return {
      discountAmount: Math.round(discountAmount),
      finalFare: Math.round(finalFare),
    };
  }
}
