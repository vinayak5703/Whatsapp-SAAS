import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.decorators';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@ApiTags('Messages')
@Controller('messages')
@Public()
export class MessagesController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a single message or bulk messages with optional media' })
  async sendMessage(
    @Body()
    payload: {
      recipient?: string;
      to?: string;
      body?: string;
      message?: string;
      recipients?: string[];
      groups?: string[];
      manualNumbers?: string[];
      delayMs?: number;
      media?: any;
    },
  ) {
    // If multi-recipients or groups are provided, route to sendBulk
    if (
      (payload.recipients && payload.recipients.length > 0) ||
      (payload.groups && payload.groups.length > 0) ||
      (payload.manualNumbers && payload.manualNumbers.length > 0)
    ) {
      const bodyText = payload.body || payload.message || '';
      const result = await this.whatsapp.sendBulk({
        recipients: payload.recipients,
        groups: payload.groups,
        manualNumbers: payload.manualNumbers,
        body: bodyText,
        delayMs: payload.delayMs,
        media: payload.media,
      });

      return {
        success: true,
        data: result,
        message: `Sent ${result.sent} of ${result.total} messages.`,
      };
    }

    // Single message send
    const destination = payload.recipient || payload.to;
    const bodyText = payload.body || payload.message || '';
    if (!destination || (!bodyText && !payload.media)) {
      return {
        success: false,
        message: 'Recipient and message body or media are required.',
      };
    }

    const result = await this.whatsapp.sendMessage(destination, bodyText, payload.media);
    return {
      success: true,
      data: result,
      message: 'Message sent successfully',
    };
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send messages to multiple contacts and groups' })
  async sendBulk(
    @Body()
    payload: {
      recipients?: string[];
      groups?: string[];
      manualNumbers?: string[];
      body?: string;
      message?: string;
      delayMs?: number;
      media?: any;
    },
  ) {
    const bodyText = payload.body || payload.message || '';
    const result = await this.whatsapp.sendBulk({
      recipients: payload.recipients,
      groups: payload.groups,
      manualNumbers: payload.manualNumbers,
      body: bodyText,
      delayMs: payload.delayMs,
      media: payload.media,
    });

    return {
      success: true,
      data: result,
      message: `Sent ${result.sent} of ${result.total} messages.`,
    };
  }
}
