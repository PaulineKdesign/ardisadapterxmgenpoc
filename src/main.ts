import '@nestjs/core';
import { createHttpApp } from './bootstrap';

async function bootstrap(): Promise<void> {
  const app = await createHttpApp();
  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
}

bootstrap();
