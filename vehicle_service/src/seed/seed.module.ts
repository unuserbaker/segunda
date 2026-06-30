import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from '../modules/vehicle/entities/brand.entity';
import { Category } from '../modules/vehicle/entities/category.entity';
import { Status } from '../modules/vehicle/entities/status.entity';
import { EngineType } from '../modules/vehicle/entities/engine_type.entity';
import { Transmission } from '../modules/vehicle/entities/transmission.entity';
import { Type } from '../modules/vehicle/entities/type.entity';
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
