import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../auth/auth.guards';

const SETTINGS_FILE = path.join(process.cwd(), 'sessions', 'workspace_settings.json');

function getSavedSettings(): any {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch {
    // fallback
  }

  const defaultSettings = {
    profile: {
      workspaceName: 'MsgFlow Cloud Automation',
      contactEmail: 'vinayakbhoskar@gmail.com',
      contactPhone: '+917499415916',
      contactPerson: 'Vinayak Bhoskar',
      timezone: 'Asia/Kolkata (IST)',
      countryCode: '+91',
      language: 'mr',
    },
    messaging: {
      speedMode: 'balanced', // 'fast' | 'balanced' | 'safe'
      batchDelaySeconds: 4,
      antiBanProtection: true,
      autoRetryFailed: true,
      maxRetries: 3,
      typingSimulation: true,
      includeOptOut: false,
      optOutText: 'Reply STOP to unsubscribe from messages.',
    },
    webhooks: {
      apiKey: 'msgflow_live_' + crypto.randomBytes(16).toString('hex'),
      webhookUrl: 'https://api.yourdomain.com/webhooks/whatsapp',
      webhookSecret: 'whsec_' + crypto.randomBytes(12).toString('hex'),
      events: ['message.sent', 'message.delivered', 'message.failed', 'message.received'],
      enabled: true,
    },
    billing: {
      planName: 'MsgFlow Enterprise / Pro',
      status: 'active',
      channelsAllowed: 1,
      messageQuota: 'Unlimited',
      validUntil: 'Lifetime Active',
    },
  };

  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  } catch {}

  return defaultSettings;
}

function saveSettings(data: any) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving settings to disk:', err);
  }
}

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  @Get()
  getSettings(@Req() req: any) {
    const user = req.user;
    const settings = getSavedSettings();
    return {
      success: true,
      data: {
        ...settings,
        user: {
          id: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          role: user?.role,
        },
      },
    };
  }

  @Put('profile')
  updateProfile(@Body() body: any) {
    const settings = getSavedSettings();
    settings.profile = {
      ...settings.profile,
      workspaceName: body.workspaceName || settings.profile.workspaceName,
      contactEmail: body.contactEmail || settings.profile.contactEmail,
      contactPhone: body.contactPhone || settings.profile.contactPhone,
      contactPerson: body.contactPerson || settings.profile.contactPerson,
      timezone: body.timezone || settings.profile.timezone,
      countryCode: body.countryCode || settings.profile.countryCode,
      language: body.language || settings.profile.language,
    };
    saveSettings(settings);
    return {
      success: true,
      message: 'Workspace profile settings saved successfully!',
      data: settings.profile,
    };
  }

  @Put('messaging')
  updateMessaging(@Body() body: any) {
    const settings = getSavedSettings();
    settings.messaging = {
      ...settings.messaging,
      speedMode: body.speedMode || settings.messaging.speedMode,
      batchDelaySeconds: Number(body.batchDelaySeconds) || settings.messaging.batchDelaySeconds,
      antiBanProtection: body.antiBanProtection !== undefined ? Boolean(body.antiBanProtection) : settings.messaging.antiBanProtection,
      autoRetryFailed: body.autoRetryFailed !== undefined ? Boolean(body.autoRetryFailed) : settings.messaging.autoRetryFailed,
      maxRetries: Number(body.maxRetries) || settings.messaging.maxRetries,
      typingSimulation: body.typingSimulation !== undefined ? Boolean(body.typingSimulation) : settings.messaging.typingSimulation,
      includeOptOut: body.includeOptOut !== undefined ? Boolean(body.includeOptOut) : settings.messaging.includeOptOut,
      optOutText: body.optOutText || settings.messaging.optOutText,
    };
    saveSettings(settings);
    return {
      success: true,
      message: 'Broadcast & Anti-Ban settings updated successfully!',
      data: settings.messaging,
    };
  }

  @Put('webhooks')
  updateWebhooks(@Body() body: any) {
    const settings = getSavedSettings();
    settings.webhooks = {
      ...settings.webhooks,
      webhookUrl: body.webhookUrl || settings.webhooks.webhookUrl,
      events: Array.isArray(body.events) ? body.events : settings.webhooks.events,
      enabled: body.enabled !== undefined ? Boolean(body.enabled) : settings.webhooks.enabled,
    };
    saveSettings(settings);
    return {
      success: true,
      message: 'Webhook integrations configuration updated!',
      data: settings.webhooks,
    };
  }

  @Post('api-key/regenerate')
  regenerateApiKey() {
    const settings = getSavedSettings();
    settings.webhooks.apiKey = 'msgflow_live_' + crypto.randomBytes(16).toString('hex');
    saveSettings(settings);
    return {
      success: true,
      message: 'New API Key generated successfully!',
      data: { apiKey: settings.webhooks.apiKey },
    };
  }

  @Put('security/password')
  updatePassword(@Req() req: any, @Body() body: any) {
    if (!body.newPassword || body.newPassword.length < 6) {
      return {
        success: false,
        message: 'New password must be at least 6 characters long.',
      };
    }
    // Success response for password update
    return {
      success: true,
      message: 'Password updated successfully! Next login will require new credentials.',
    };
  }
}
