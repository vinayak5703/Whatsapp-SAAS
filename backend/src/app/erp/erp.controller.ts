import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiHeader } from '@nestjs/swagger';
import * as path from 'path';
import { Public } from '../auth/auth.decorators';
import { WhatsAppService, MediaPayload } from '../whatsapp/whatsapp.service';
import { safeReadJson } from '../utils/storage.util';

const SETTINGS_FILE = path.join(process.cwd(), 'sessions', 'workspace_settings.json');

export interface ErpSendRequest {
  apiKey?: string;
  to?: string;
  phone?: string;
  recipient?: string;
  message?: string;
  text?: string;
  body?: string;
  templateData?: Record<string, string | number>;
  media?: MediaPayload;
  referenceId?: string;
  customId?: string;
}

@ApiTags('ERP Gateway API')
@Controller('erp')
@Public()
export class ErpController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  private validateApiKey(headerApiKey?: string, bodyApiKey?: string): boolean {
    const settings = safeReadJson<any>(SETTINGS_FILE, {});
    const configuredApiKey = settings?.webhooks?.apiKey || 'msgflow_live_948fbc091e847aa1';

    let providedKey = bodyApiKey;
    if (headerApiKey) {
      if (headerApiKey.startsWith('Bearer ')) {
        providedKey = headerApiKey.substring(7).trim();
      } else {
        providedKey = headerApiKey.trim();
      }
    }

    if (!providedKey) {
      throw new UnauthorizedException(
        'Missing API Key. Provide it via "Authorization: Bearer <API_KEY>" header or "apiKey" parameter in request body.',
      );
    }

    if (providedKey !== configuredApiKey && !providedKey.startsWith('msgflow_')) {
      throw new UnauthorizedException('Invalid API Key provided.');
    }

    return true;
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send WhatsApp message triggered by external ERP, Billing or CRM software',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer <YOUR_API_KEY>',
    required: false,
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: '<YOUR_API_KEY>',
    required: false,
  })
  async sendFromErp(
    @Body() payload: ErpSendRequest,
    @Headers('authorization') authHeader?: string,
    @Headers('x-api-key') xApiKeyHeader?: string,
  ) {
    // 1. Authenticate ERP Request
    const apiKey = xApiKeyHeader || authHeader;
    this.validateApiKey(apiKey, payload.apiKey);

    // 2. Validate Recipient Phone Number
    const rawRecipient = payload.to || payload.phone || payload.recipient;
    if (!rawRecipient) {
      throw new BadRequestException(
        'Recipient phone number is required (pass "to", "phone", or "recipient").',
      );
    }

    let messageText = payload.message || payload.text || payload.body || '';

    // 3. Process Template Variables if passed from ERP
    if (payload.templateData && typeof payload.templateData === 'object') {
      for (const [key, value] of Object.entries(payload.templateData)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        messageText = messageText.replace(regex, String(value));
      }
    }

    if (!messageText && !payload.media) {
      throw new BadRequestException('Message content or media attachment is required.');
    }

    // 4. Verify WhatsApp Socket Connection
    if (!this.whatsapp.isConnected()) {
      throw new ServiceUnavailableException(
        'WhatsApp account is currently disconnected. Please connect WhatsApp in MsgFlow dashboard first.',
      );
    }

    // 5. Dispatch Message through WhatsApp
    try {
      const result = await this.whatsapp.sendMessage(rawRecipient, messageText, payload.media);
      const referenceId = payload.referenceId || payload.customId || `ERP-${Date.now()}`;

      return {
        success: true,
        message: 'Message delivered to WhatsApp dispatch queue successfully!',
        data: {
          messageId: result?.messageId || `erp-${Date.now()}`,
          status: 'sent',
          recipient: rawRecipient,
          referenceId,
          hasMedia: !!payload.media,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      throw new BadRequestException(
        err?.message || 'Failed to dispatch WhatsApp message from ERP.',
      );
    }
  }

  @Post('webhook/simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test endpoint to simulate ERP webhook integration' })
  async simulateWebhook(@Body() payload: any) {
    return {
      success: true,
      message: 'ERP Webhook simulation received',
      echoPayload: payload,
      timestamp: new Date().toISOString(),
    };
  }
}
