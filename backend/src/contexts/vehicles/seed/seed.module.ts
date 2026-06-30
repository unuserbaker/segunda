import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from '../entities/brand.entity';
import { Category } from '../entities/category.entity';
import { Status } from '../entities/status.entity';
import { EngineType } from '../entities/engine_type.entity';
import { Transmission } from '../entities/transmission.entity';
import { Type } from '../entities/type.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Brand, Category, Status, EngineType, Transmission, Type])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
