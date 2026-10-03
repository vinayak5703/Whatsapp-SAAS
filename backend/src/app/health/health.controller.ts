import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Public } from '../auth/auth.decorators';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'backend',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async getReadiness() {
    try {
      await this.database.checkConnection();
      return { status: 'ok', dependencies: { postgres: 'ok' } };
    } catch {
      throw new ServiceUnavailableException({
        status: 'unavailable',
        dependencies: { postgres: 'unavailable' },
      });
    }
  }
}
