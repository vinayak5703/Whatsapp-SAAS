import { Controller, Get, HttpCode, HttpStatus, Req } from '@nestjs/common';
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
  async getSummary(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'];
    const summary = await this.whatsapp.getDashboardSummary(tenantId);
    return {
      success: true,
      data: summary,
    };
  }

  @Get('logs/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get recent message logs' })
  async getMessageLogs(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'];
    const messages = await this.whatsapp.getRecentMessages(tenantId);
    return {
      success: true,
      data: {
        items: messages,
        total: messages.length,
      },
    };
  }
}
