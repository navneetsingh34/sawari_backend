import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto/payment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  /**
   * Mock Razorpay Order Creation
   */
  async initiatePayment(userId: string, dto: InitiatePaymentDto): Promise<{ orderId: string, amount: number }> {
    const orderId = `order_${uuidv4().replace(/-/g, '').substring(0, 14)}`;

    const payment = new this.paymentModel({
      orderId,
      userId,
      rideId: dto.rideId,
      amount: dto.amount,
      method: dto.method,
      status: 'PENDING',
    });

    await payment.save();

    return {
      orderId,
      amount: dto.amount,
    };
  }

  /**
   * Mock Razorpay Payment Verification
   */
  async verifyPayment(userId: string, dto: VerifyPaymentDto): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ orderId: dto.orderId });

    if (!payment) {
      throw new NotFoundException('Order not found');
    }

    if (payment.userId.toString() !== userId) {
      throw new BadRequestException('Order does not belong to you');
    }

    if (payment.status === 'SUCCESS') {
      return payment; // Idempotent
    }

    // In a real app, verify signature with Razorpay secret
    // Here we just mark it as SUCCESS for the mock
    payment.status = 'SUCCESS';
    
    // You'd typically update Ride/Wallet via events, but omitted here for brevity
    
    const saved = await payment.save();
    return saved;
  }

  async getPaymentStatus(orderId: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ orderId });
    if (!payment) {
      throw new NotFoundException('Order not found');
    }
    return payment;
  }
}
