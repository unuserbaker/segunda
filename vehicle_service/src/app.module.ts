import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { SeedModule } from './seed/seed.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { ReferenceModule } from './modules/reference/reference.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || process.env.DB_USER,
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    SeedModule,
    VehicleModule,
    ReferenceModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
