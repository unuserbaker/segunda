import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { SeedService } from './contexts/vehicles/seed/seed.service';
import { InternalStaffSeedService } from './contexts/iam/seed/internal-staff-seed.service';
import { SettingsService } from './contexts/scheduling/settings.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;

  const seedService = app.get(SeedService);
  await seedService.seedAll();

  const internalStaffSeedService = app.get(InternalStaffSeedService);
  await internalStaffSeedService.seedInitialAdmin();

  const settingsService = app.get(SettingsService);
  await settingsService.seedDefaults();

  await app.listen(port);
  console.log(`Segunda API running on port ${port}`);
}
bootstrap();
