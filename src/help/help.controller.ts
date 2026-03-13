import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { HelpService } from './help.service';
import { CreateTicketDto } from './dto/help.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Help')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('help')
export class HelpController {
  constructor(private readonly helpService: HelpService) {}

  @Get('topics')
  @ApiOperation({ summary: 'Get list of help topics' })
  getHelpTopics() {
    return this.helpService.getHelpTopics();
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create a new support ticket' })
  createTicket(@Req() req: any, @Body() dto: CreateTicketDto) {
    return this.helpService.createTicket(req.user.userId, dto);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get all tickets for current user' })
  getUserTickets(@Req() req: any) {
    return this.helpService.getUserTickets(req.user.userId);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get specific ticket details' })
  getTicketDetails(@Req() req: any, @Param('id') id: string) {
    return this.helpService.getTicketDetails(req.user.userId, id);
  }
}
