import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.decorators';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('WhatsApp')
@Controller('whatsapp')
@Public()
export class WhatsAppController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  @Get('connection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the current WhatsApp connection status' })
  getConnection() {
    return {
      success: true,
      data: this.whatsapp.getConnection(),
      message: 'Connection status loaded',
    };
  }

  @Get('qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a QR pairing image for the workspace WhatsApp connection' })
  async getQr() {
    return {
      success: true,
      data: await this.whatsapp.getQr(),
      message: 'QR code generated',
    };
  }

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start and initialize the WhatsApp provider connection' })
  async connect() {
    return {
      success: true,
      data: await this.whatsapp.connect(),
      message: 'Connection started',
    };
  }

  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect the WhatsApp provider for the workspace' })
  async disconnect() {
    return {
      success: true,
      data: await this.whatsapp.disconnect(),
      message: 'Connection disconnected',
    };
  }

  @Post('reconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reconnect the WhatsApp provider for the workspace' })
  async reconnect() {
    return {
      success: true,
      data: await this.whatsapp.reconnect(),
      message: 'Connection restarted',
    };
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a single WhatsApp message' })
  async sendMessage(
    @Req() req: any,
    @Body() body: { recipient?: string; to?: string; body?: string; text?: string; tenantId?: string },
  ) {
    const destination = body.recipient || body.to;
    const message = body.body || body.text;
    if (!destination || !message) {
      return {
        success: false,
        message: 'Recipient and message body are required.',
      };
    }
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || body.tenantId;
    const result = await this.whatsapp.sendMessage(destination, message, undefined, tenantId);
    return {
      success: true,
      data: result,
      message: 'Message sent successfully',
    };
  }

  @Post('send-bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send messages to multiple contacts and groups' })
  async sendBulk(
    @Req() req: any,
    @Body()
    payload: {
      recipients?: string[];
      groups?: string[];
      manualNumbers?: string[];
      body?: string;
      message?: string;
      delayMs?: number;
      tenantId?: string;
    },
  ) {
    const bodyText = payload.body || payload.message || '';
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || payload.tenantId;
    const result = await this.whatsapp.sendBulk({
      recipients: payload.recipients,
      groups: payload.groups,
      manualNumbers: payload.manualNumbers,
      body: bodyText,
      delayMs: payload.delayMs,
      tenantId,
    });
    return {
      success: true,
      data: result,
      message: `Delivered ${result.sent} of ${result.total} messages.`,
    };
  }

  @Get('contacts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get synced WhatsApp contacts' })
  async getContacts(@Query('search') search?: string, @Query('limit') limit?: string) {
    const result = await this.whatsapp.getContacts({ search, limit: limit ? Number(limit) : 100 });
    return {
      success: true,
      data: result,
      message: 'Contacts loaded',
    };
  }

  @Post('contacts/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force sync WhatsApp contacts from connection' })
  async syncContacts() {
    const contacts = await this.whatsapp.syncContacts();
    return {
      success: true,
      data: contacts,
      message: `Synced ${contacts.length} contacts from WhatsApp.`,
    };
  }

  @Get('groups')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get synced WhatsApp groups' })
  async getGroups(@Query('search') search?: string, @Query('limit') limit?: string) {
    const result = await this.whatsapp.getGroups({ search, limit: limit ? Number(limit) : 100 });
    return {
      success: true,
      data: result,
      message: 'Groups loaded',
    };
  }

  @Post('groups/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force sync WhatsApp groups from connection' })
  async syncGroups() {
    const groups = await this.whatsapp.syncGroups();
    return {
      success: true,
      data: groups,
      message: `Synced ${groups.length} groups from WhatsApp.`,
    };
  }
}
