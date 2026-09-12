import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclePhoto } from './entities/vehicle-photo.entity';
import { FilesService } from './files.service';
import { R2StorageProvider } from './providers/r2-storage.provider';
import { STORAGE_PROVIDER } from './storage-provider.interface';

@Module({
  imports: [TypeOrmModule.forFeature([VehiclePhoto])],
  controllers: [],
  providers: [FilesService, { provide: STORAGE_PROVIDER, useClass: R2StorageProvider }],
  exports: [FilesService],
})
export class FilesModule {}
