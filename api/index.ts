import 'reflect-metadata';
import serverlessExpress from '@codegenie/serverless-express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createExpressServer } from '../src/bootstrap';

let cachedHandler:
  | ((req: VercelRequest, res: VercelResponse) => Promise<void>)
  | undefined;

async function getHandler(): Promise<
  (req: VercelRequest, res: VercelResponse) => Promise<void>
> {
  if (!cachedHandler) {
    const app = await createExpressServer();
    cachedHandler = serverlessExpress({ app }) as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<void>;
  }

  return cachedHandler;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const server = await getHandler();
  await server(req, res);
}
