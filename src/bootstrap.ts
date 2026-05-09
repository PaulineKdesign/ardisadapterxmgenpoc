import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import express, { Express } from 'express';
import { AppModule } from './app.module';

export async function configureApp(app: INestApplication): Promise<INestApplication> {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();
  return app;
}

export async function createHttpApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  return configureApp(app);
}

export async function createExpressServer(): Promise<Express> {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  await configureApp(app);
  return server;
}
