import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:4200', 'http://127.0.0.1:4200'];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        // Fallback allow in case of reverse proxy / localhost
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'x-tenant-id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MsgFlow WhatsApp SaaS API')
    .setDescription('Production-ready multi-tenant messaging & automation platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Serve static frontend bundle if available
  const possiblePaths = [
    join(__dirname, '..', '..', 'frontend', 'dist', 'whatsapp-saas-frontend', 'browser'),
    join(process.cwd(), '..', 'frontend', 'dist', 'whatsapp-saas-frontend', 'browser'),
    join(process.cwd(), 'dist', 'whatsapp-saas-frontend', 'browser'),
  ];
  const frontendDist = possiblePaths.find((p) => existsSync(p));

  if (frontendDist) {
    app.use(express.static(frontendDist));
    app.use((req: any, res: any, next: any) => {
      if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
        return res.sendFile(join(frontendDist, 'index.html'));
      }
      next();
    });
    console.log(`MsgFlow Frontend served from: ${frontendDist}`);
  }

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`MsgFlow API Server running on port ${port} (0.0.0.0)`);
}

bootstrap();
