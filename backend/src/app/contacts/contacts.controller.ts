import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.decorators';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@ApiTags('Contacts')
@Controller('contacts')
@Public()
export class ContactsController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  @Get()
  @ApiOperation({ summary: 'Load contact records synced from the connected WhatsApp provider' })
  async getContacts(
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('cursor') cursor?: string,
  ) {
    const result = await this.whatsapp.getContacts({ limit: limit ? Number(limit) : 25, search, cursor });
    return {
      success: true,
      data: result,
      message: result.items.length ? 'Contacts loaded' : 'No contacts available',
    };
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync contacts from the connected WhatsApp provider' })
  async syncContacts() {
    const data = await this.whatsapp.syncContacts();
    return {
      success: true,
      data,
      message: `Synced ${data.length} contacts`,
    };
  }
}
