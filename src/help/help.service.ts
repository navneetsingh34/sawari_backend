import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HelpTicket, HelpTicketDocument } from './schemas/help-ticket.schema';
import { CreateTicketDto } from './dto/help.dto';

@Injectable()
export class HelpService {
  constructor(
    @InjectModel(HelpTicket.name) private ticketModel: Model<HelpTicketDocument>,
  ) {}

  async createTicket(userId: string, dto: CreateTicketDto): Promise<HelpTicketDocument> {
    const ticket = new this.ticketModel({
      userId,
      ...dto,
    });
    return ticket.save();
  }

  async getUserTickets(userId: string): Promise<HelpTicketDocument[]> {
    return this.ticketModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getTicketDetails(userId: string, ticketId: string): Promise<HelpTicketDocument> {
    const ticket = await this.ticketModel.findOne({ _id: ticketId, userId }).exec();
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  getHelpTopics(): string[] {
    return [
      'Account & Profile',
      'Payment & Wallets',
      'Ride Issues',
      'Lost Items',
      'Safety Concerns',
      'Offers & Ridexa Coins'
    ];
  }
}
