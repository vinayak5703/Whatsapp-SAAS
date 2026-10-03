import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.decorators';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@ApiTags('Groups')
@Controller('groups')
@Public()
export class GroupsController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  @Get()
  @ApiOperation({ summary: 'Load synced WhatsApp groups for the workspace' })
  async getGroups(@Query('limit') limit?: string, @Query('search') search?: string) {
    const result = await this.whatsapp.getGroups({ limit: limit ? Number(limit) : 25, search });
    return {
      success: true,
      data: result,
      message: result.items.length ? 'Groups loaded' : 'No groups available',
    };
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync groups from the connected WhatsApp provider' })
  async syncGroups() {
    const data = await this.whatsapp.syncGroups();
    return {
      success: true,
      data,
      message: 'Groups synced',
    };
  }

  @Post(':id/refresh')
  @ApiOperation({ summary: 'Refresh a single WhatsApp group from the provider' })
  async refreshGroup(@Param('id') groupId: string) {
    const data = await this.whatsapp.refreshGroup(groupId);
    return {
      success: true,
      data,
      message: 'Group refreshed',
    };
  }
}
