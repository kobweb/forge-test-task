import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadConfig } from './config';

async function bootstrap(): Promise<void> {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const config = loadConfig();
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  // 0.0.0.0 so a phone on the same Wi-Fi (EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000) can connect.
  await app.listen(config.PORT, '0.0.0.0');
}

void bootstrap();
