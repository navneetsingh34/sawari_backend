import { Injectable } from '@nestjs/common';
import { ChatMessageDto } from './dto/chatbot.dto';

interface FaqEntry {
  keywords: string[];
  response: string;
}

@Injectable()
export class ChatbotService {
  private readonly faqs: FaqEntry[] = [
    {
      keywords: ['payment', 'card', 'upi', 'cash'],
      response: 'You can manage your payment methods in the Wallet section. We accept UPI, Credit/Debit cards, and Cash.'
    },
    {
      keywords: ['cancel', 'cancellation', 'fee'],
      response: 'You can cancel a ride anytime before the driver arrives. Cancellation fees may apply if the driver has already traveled a significant distance.'
    },
    {
      keywords: ['receipt', 'bill', 'invoice'],
      response: 'Receipts are automatically emailed to you after every completed ride. You can also view them in your Ride History.'
    },
    {
      keywords: ['lost', 'item', 'forgot'],
      response: 'If you left an item in the cab, please contact the driver via the Ride History section or raise a Help Ticket immediately.'
    },
    {
      keywords: ['promo', 'discount', 'offer', 'coupon'],
      response: 'You can view and apply available promo codes in the Offers section before booking a ride.'
    },
    {
      keywords: ['coin', 'ridexa', 'loyalty', 'reward'],
      response: 'You earn Ridexa Coins on every ride! You can redeem them for discounts on future bookings.'
    }
  ];

  private readonly defaultResponse = "I'm still learning! For complex issues, please raise a ticket in the Help section so our support team can assist you.";

  async processMessage(dto: ChatMessageDto): Promise<{ response: string }> {
    const message = dto.message.toLowerCase();
    
    // Find the best matching FAQ response
    for (const faq of this.faqs) {
      if (faq.keywords.some(keyword => message.includes(keyword))) {
        return { response: faq.response };
      }
    }

    // Default fallback
    return { response: this.defaultResponse };
  }
}
