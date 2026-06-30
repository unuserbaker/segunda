import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferenceController } from './reference.controller';
import { ReferenceService } from './reference.service';
import { Brand } from '../vehicle/entities/brand.entity';
import { Category } from '../vehicle/entities/category.entity';
import { EngineType } from '../vehicle/entities/engine_type.entity';
import { Transmission } from '../vehicle/entities/transmission.entity';
import { Type } from '../vehicle/entities/type.entity';
import { Status } from '../vehicle/entities/status.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brand,
      Category,
      EngineType,
      Transmission,
      Type,
      Status,
    ]),
  ],
  controllers: [ReferenceController],
  providers: [ReferenceService],
  exports: [ReferenceService],
})
export class ReferenceModule {}
