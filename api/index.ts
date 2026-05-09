import 'reflect-metadata';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Express } from 'express';
import { createExpressServer } from '../src/bootstrap';

let cachedApp: Express | undefined;

async function getApp(): Promise<Express> {
  if (!cachedApp) {
    cachedApp = await createExpressServer();
  }

  return cachedApp;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const app = await getApp();
  app(req, res);
}
