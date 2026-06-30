import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SeedService } from './seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT_APP || 3005;

  const seedService = app.get(SeedService);
  await seedService.seedAll();

  await app.listen(port);
  console.log(`Vehicle Service running on port ${port}`);
}
bootstrap();
