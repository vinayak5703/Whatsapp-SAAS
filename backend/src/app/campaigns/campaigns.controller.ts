import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Public } from '../auth/auth.decorators';
import { WhatsAppService, MediaPayload } from '../whatsapp/whatsapp.service';

export interface CampaignRecord {
  id: string;
  name: string;
  message: string;
  status: 'draft' | 'scheduled' | 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  scheduledAt?: string | null;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  recipients?: string[];
  groups?: string[];
  media?: MediaPayload;
  createdAt: string;
  updatedAt: string;
}

@ApiTags('Campaigns')
@Controller('campaigns')
@Public()
export class CampaignsController {
  private readonly campaignsFilePath = join(process.cwd(), 'sessions', 'campaigns.json');
  private campaigns: CampaignRecord[] = [];

  constructor(private readonly whatsapp: WhatsAppService) {
    this.loadCampaignsFromDisk();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all campaigns' })
  async listCampaigns(@Query('limit') limit?: number, @Query('search') search?: string) {
    this.loadCampaignsFromDisk();
    const querySearch = (search || '').trim().toLowerCase();
    const filtered = this.campaigns.filter((c) => {
      if (!querySearch) return true;
      return c.name.toLowerCase().includes(querySearch) || c.message.toLowerCase().includes(querySearch);
    });

    const pageLimit = Number(limit || 25);
    return {
      success: true,
      data: {
        items: filtered.slice(0, pageLimit),
        total: filtered.length,
      },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific campaign by ID' })
  async getCampaign(@Param('id') id: string) {
    this.loadCampaignsFromDisk();
    const campaign = this.campaigns.find((c) => c.id === id);
    if (!campaign) {
      return { success: false, message: 'Campaign not found' };
    }
    return { success: true, data: campaign };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new campaign' })
  async createCampaign(
    @Body()
    body: {
      name: string;
      message: string;
      scheduledAt?: string | null;
      recipients?: string[];
      groups?: string[];
      media?: MediaPayload;
    },
  ) {
    this.loadCampaignsFromDisk();
    const contactsList = await this.whatsapp.getContacts({ limit: 1000 });
    const groupsList = await this.whatsapp.getGroups({ limit: 1000 });

    let targetCount = (body.recipients?.length || 0) + (body.groups?.length || 0);
    if (targetCount === 0) {
      targetCount = contactsList.total || contactsList.items.length || 1;
    }

    const newCampaign: CampaignRecord = {
      id: randomUUID(),
      name: body.name.trim(),
      message: body.message.trim(),
      status: body.scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: body.scheduledAt || null,
      recipientCount: targetCount,
      sentCount: 0,
      failedCount: 0,
      recipients: body.recipients,
      groups: body.groups,
      media: body.media,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.campaigns.unshift(newCampaign);
    this.saveCampaignsToDisk();

    return {
      success: true,
      data: newCampaign,
      message: 'Campaign created successfully',
    };
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start campaign broadcasting' })
  async startCampaign(@Param('id') id: string) {
    this.loadCampaignsFromDisk();
    const campaign = this.campaigns.find((c) => c.id === id);
    if (!campaign) {
      return { success: false, message: 'Campaign not found' };
    }

    campaign.status = 'running';
    campaign.updatedAt = new Date().toISOString();
    this.saveCampaignsToDisk();

    // Trigger async execution
    this.executeCampaign(campaign).catch(() => {});

    return {
      success: true,
      data: campaign,
      message: 'Campaign started successfully',
    };
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause a running campaign' })
  async pauseCampaign(@Param('id') id: string) {
    this.loadCampaignsFromDisk();
    const campaign = this.campaigns.find((c) => c.id === id);
    if (!campaign) return { success: false, message: 'Campaign not found' };

    campaign.status = 'paused';
    campaign.updatedAt = new Date().toISOString();
    this.saveCampaignsToDisk();

    return { success: true, data: campaign, message: 'Campaign paused' };
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused campaign' })
  async resumeCampaign(@Param('id') id: string) {
    this.loadCampaignsFromDisk();
    const campaign = this.campaigns.find((c) => c.id === id);
    if (!campaign) return { success: false, message: 'Campaign not found' };

    campaign.status = 'running';
    campaign.updatedAt = new Date().toISOString();
    this.saveCampaignsToDisk();

    this.executeCampaign(campaign).catch(() => {});

    return { success: true, data: campaign, message: 'Campaign resumed' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a campaign' })
  async deleteCampaign(@Param('id') id: string) {
    this.loadCampaignsFromDisk();
    this.campaigns = this.campaigns.filter((c) => c.id !== id);
    this.saveCampaignsToDisk();
    return { success: true, message: 'Campaign deleted' };
  }

  private async executeCampaign(campaign: CampaignRecord): Promise<void> {
    try {
      let targets: string[] = [];
      let groups: string[] = [];

      if (campaign.recipients && campaign.recipients.length > 0) {
        targets = campaign.recipients;
      } else {
        const contactsResult = await this.whatsapp.getContacts({ limit: 1000 });
        targets = contactsResult.items.map((c) => c.phoneE164);
      }

      if (campaign.groups && campaign.groups.length > 0) {
        groups = campaign.groups;
      }

      if (this.whatsapp.isConnected()) {
        const result = await this.whatsapp.sendBulk({
          recipients: targets,
          groups,
          body: campaign.message,
          media: campaign.media,
          delayMs: 1500,
        });

        campaign.sentCount = result.sent;
        campaign.failedCount = result.failed;
        campaign.recipientCount = result.total;
        campaign.status = result.failed > 0 && result.sent === 0 ? 'failed' : 'completed';
      } else {
        campaign.status = 'failed';
        campaign.failedCount = campaign.recipientCount;
      }
    } catch {
      campaign.status = 'failed';
    } finally {
      campaign.updatedAt = new Date().toISOString();
      this.saveCampaignsToDisk();
    }
  }

  private loadCampaignsFromDisk(): void {
    try {
      if (existsSync(this.campaignsFilePath)) {
        const raw = readFileSync(this.campaignsFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.campaigns = parsed;
        }
      }
    } catch {
      this.campaigns = [];
    }
  }

  private saveCampaignsToDisk(): void {
    try {
      const dir = join(process.cwd(), 'sessions');
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this.campaignsFilePath, JSON.stringify(this.campaigns, null, 2), 'utf-8');
    } catch {}
  }
}
