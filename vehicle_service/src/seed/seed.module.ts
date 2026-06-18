import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from '../modules/vehicle/domain/entities/brand.entity';
import { Category } from '../modules/vehicle/domain/entities/category.entity';
import { Status } from '../modules/vehicle/domain/entities/status.entity';
import { EngineType } from '../modules/vehicle/domain/entities/engine_type.entity';
import { Transmission } from '../modules/vehicle/domain/entities/transmission.entity';
import { Type } from '../modules/vehicle/domain/entities/type.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brand,
      Category,
      Status,
      EngineType,
      Transmission,
      Type,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
