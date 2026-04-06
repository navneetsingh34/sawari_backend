import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessageDto } from './dto/chatbot.dto';

@Injectable()
export class ChatbotService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: `You are the RIDEXA App Support Assistant.
        RIDEXA is a ride-hailing application that offers rides, parcel delivery, and professional drivers.
        
        Key Features:
        1. Ride Booking: Users can book rides with different vehicle types.
        2. Parcel Delivery: Users can send items with secure OTP verification.
        3. Professional Drivers: Users can hire drivers for their own vehicles.
        4. Ridexa Coins: A loyalty program where users earn coins on rides to redeem for discounts.
        5. Wallet: Supports UPI, Cards, and Cash.
        
        Guidelines:
        - Be professional, helpful, and concise.
        - If you don't know the answer, suggest raising a support ticket.
        - Encourage users to check the FAQ section for detailed policies.
        - Do not provide legal or financial advice outside of app-related queries.`,
      });
    }
  }

  async processMessage(dto: ChatMessageDto): Promise<{ response: string }> {
    if (!this.model) {
      return { response: "I'm currently undergoing maintenance. Please try again later or raise a support ticket." };
    }

    try {
      const result = await this.model.generateContent(dto.message);
      const response = await result.response;
      return { response: response.text() };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return { response: "I'm having trouble connecting to my brain right now. Please create a ticket in the Help section so our team can assist you." };
    }
  }
}
