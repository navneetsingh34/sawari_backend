import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HelpController } from './help.controller';
import { HelpService } from './help.service';
import { HelpTicket, HelpTicketSchema } from './schemas/help-ticket.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HelpTicket.name, schema: HelpTicketSchema }]),
  ],
  controllers: [HelpController],
  providers: [HelpService],
  exports: [HelpService],
})
export class HelpModule {}
