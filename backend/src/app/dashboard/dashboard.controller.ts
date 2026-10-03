import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.decorators';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@ApiTags('Dashboard')
@Controller()
@Public()
export class DashboardController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  @Get('dashboard/summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get workspace metrics and dashboard summary' })
  async getSummary() {
    const summary = await this.whatsapp.getDashboardSummary();
    return {
      success: true,
      data: summary,
    };
  }

  @Get('logs/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get recent message logs' })
  async getMessageLogs() {
    const messages = await this.whatsapp.getRecentMessages();
    return {
      success: true,
      data: {
        items: messages,
        total: messages.length,
      },
    };
  }
}
