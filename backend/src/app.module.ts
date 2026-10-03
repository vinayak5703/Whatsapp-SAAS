import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';

import { HealthController } from './app/health/health.controller';
import { DatabaseService } from './app/database/database.service';
import { AuthController } from './app/auth/auth.controller';
import { AuthService } from './app/auth/auth.service';
import { JwtAuthGuard, PermissionsGuard, TenantContextGuard } from './app/auth/auth.guards';
import { TenantContextMiddleware } from './app/auth/tenant-context.middleware';
import { ContactsController } from './app/contacts/contacts.controller';
import { GroupsController } from './app/groups/groups.controller';
import { MessagesController } from './app/messages/messages.controller';
import { WhatsAppController } from './app/whatsapp/whatsapp.controller';
import { WhatsAppService } from './app/whatsapp/whatsapp.service';
import { DashboardController } from './app/dashboard/dashboard.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '../.env.local', '.env', '.env.local'],
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as NonNullable<
            JwtModuleOptions['signOptions']
          >['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [
    HealthController,
    AuthController,
    ContactsController,
    GroupsController,
    MessagesController,
    WhatsAppController,
    DashboardController,
  ],
  providers: [
    DatabaseService,
    AuthService,
    WhatsAppService,
    TenantContextMiddleware,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantContextGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
