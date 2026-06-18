import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ejecutar seeders solo una vez
  const seedService = app.get(SeedService);
  await seedService.seedAll();
  console.log('Seeders ejecutados correctamente.');

  await app.close(); // Cierra la app después de poblar
}
bootstrap();
