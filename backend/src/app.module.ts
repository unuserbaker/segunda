import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { DatabaseModule } from './common/database/database.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { IamModule } from './contexts/iam/iam.module';
import { JwtAuthGuard } from './contexts/iam/guards/jwt-auth.guard';
import { VehiclesModule } from './contexts/vehicles/vehicles.module';
import { SellersModule } from './contexts/sellers/sellers.module';
import { SchedulingModule } from './contexts/scheduling/scheduling.module';
import { VehicleSalesModule } from './contexts/vehicle-sales/vehicle-sales.module';
import { FilesModule } from './contexts/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        genReqId: (req: any) => req.headers['x-request-id'] || randomUUID(),
        customProps: (req: any) => ({
          userId: req.user?.userId ?? null,
          internalRole: req.user?.internalRole ?? null,
        }),
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    DatabaseModule,
    IamModule,
    VehiclesModule,
    SellersModule,
    SchedulingModule,
    VehicleSalesModule,
    FilesModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
