import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { IamModule } from './contexts/iam/iam.module';
import { VehiclesModule } from './contexts/vehicles/vehicles.module';
import { SellersModule } from './contexts/sellers/sellers.module';
import { SchedulingModule } from './contexts/scheduling/scheduling.module';
import { FilesModule } from './contexts/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    IamModule,
    VehiclesModule,
    SellersModule,
    SchedulingModule,
    FilesModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
