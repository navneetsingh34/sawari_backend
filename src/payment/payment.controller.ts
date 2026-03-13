import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a mock Razorpay order' })
  initiatePayment(@Req() req: any, @Body() dto: InitiatePaymentDto) {
    return this.paymentService.initiatePayment(req.user.userId, dto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify a mock Razorpay payment' })
  verifyPayment(@Req() req: any, @Body() dto: VerifyPaymentDto) {
    return this.paymentService.verifyPayment(req.user.userId, dto);
  }

  @Get('status/:orderId')
  @ApiOperation({ summary: 'Check payment status' })
  getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentStatus(orderId);
  }
}
