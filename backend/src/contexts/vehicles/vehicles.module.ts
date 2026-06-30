import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleController } from './vehicle.controller';
import { ReferenceController } from './reference.controller';
import { VehicleService } from './vehicle.service';
import { ReferenceService } from './reference.service';
import { SeedModule } from './seed/seed.module';
import { Vehicle } from './entities/vehicle.entity';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { EngineType } from './entities/engine_type.entity';
import { Transmission } from './entities/transmission.entity';
import { Type } from './entities/type.entity';
import { Status } from './entities/status.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, Brand, Category, EngineType, Transmission, Type, Status]),
    SeedModule,
  ],
  controllers: [VehicleController, ReferenceController],
  providers: [VehicleService, ReferenceService],
  exports: [VehicleService, ReferenceService],
})
export class VehiclesModule {}
