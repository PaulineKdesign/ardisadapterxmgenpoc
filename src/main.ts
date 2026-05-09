import '@nestjs/core';
import { createHttpApp } from './bootstrap';

async function bootstrap(): Promise<void> {
  const app = await createHttpApp();
  await app.listen(3000);
}

bootstrap();
