import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.decorators';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@ApiTags('Activity Logs')
@Controller('logs')
@Public()
export class LogsController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List dynamic activity and audit logs' })
  async getLogs(
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const messages = await this.whatsapp.getRecentMessages();
    const querySearch = (search || '').trim().toLowerCase();
    const filterStatus = (status || '').trim().toLowerCase();

    const logs = messages.filter((m) => {
      if (filterStatus && filterStatus !== 'all' && m.status.toLowerCase() !== filterStatus) {
        return false;
      }
      if (!querySearch) return true;
      return (
        m.recipient.toLowerCase().includes(querySearch) ||
        (m.body && m.body.toLowerCase().includes(querySearch)) ||
        m.status.toLowerCase().includes(querySearch)
      );
    });

    const pageLimit = Number(limit || 50);

    return {
      success: true,
      data: {
        items: logs.slice(0, pageLimit).map((l) => ({
          id: l.id,
          eventType: l.status === 'sent' ? 'Message Delivered' : l.status === 'failed' ? 'Delivery Failure' : 'Outbound Dispatch',
          recipient: l.recipient,
          status: l.status,
          hasMedia: l.hasMedia,
          bodySnippet: l.body || 'Outbound broadcast message',
          timestamp: l.createdAt,
        })),
        total: logs.length,
      },
    };
  }

  @Get('messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List message logs' })
  async getMessageLogs(
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.getLogs(limit, search);
  }
}
