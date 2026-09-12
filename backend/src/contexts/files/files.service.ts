import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { VehiclePhoto } from './entities/vehicle-photo.entity';
import { StorageProvider, STORAGE_PROVIDER } from './storage-provider.interface';

const SIGNED_URL_EXPIRES_IN_SECONDS = 3600; // 1h, ver docs-arquitectura-ajustes-infra.md 2.3

@Injectable()
export class FilesService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly provider: StorageProvider,
    @InjectRepository(VehiclePhoto)
    private readonly vehiclePhotoRepo: Repository<VehiclePhoto>,
  ) {}

  async uploadVehiclePhoto(
    vehicleId: string,
    file: { buffer: Buffer; contentType: string; originalName: string },
  ): Promise<{ key: string; url: string }> {
    const extension = file.originalName.includes('.')
      ? file.originalName.split('.').pop()
      : undefined;
    const key = `vehicles/${vehicleId}/${randomUUID()}${extension ? `.${extension}` : ''}`;

    await this.provider.upload({ key, buffer: file.buffer, contentType: file.contentType });

    const lastPhoto = await this.vehiclePhotoRepo.findOne({
      where: { vehicle_id: vehicleId },
      order: { position: 'DESC' },
    });
    const position = lastPhoto ? lastPhoto.position + 1 : 0;

    const photo = this.vehiclePhotoRepo.create({ vehicle_id: vehicleId, storage_key: key, position });
    await this.vehiclePhotoRepo.save(photo);

    const url = await this.provider.getSignedUrl(key, SIGNED_URL_EXPIRES_IN_SECONDS);
    return { key, url };
  }

  async getPhotoUrl(key: string): Promise<string> {
    return this.provider.getSignedUrl(key, SIGNED_URL_EXPIRES_IN_SECONDS);
  }

  async deletePhoto(key: string): Promise<void> {
    await this.provider.delete(key);
    await this.vehiclePhotoRepo.delete({ storage_key: key });
  }

  /** Consumido por `vehicles` para incluir URLs firmadas en `GET /vehicles/:id`. */
  async listVehiclePhotoUrls(vehicleId: string): Promise<{ id: string; url: string; position: number }[]> {
    const photos = await this.vehiclePhotoRepo.find({
      where: { vehicle_id: vehicleId },
      order: { position: 'ASC' },
    });

    return Promise.all(
      photos.map(async (photo) => ({
        id: photo.id,
        position: photo.position,
        url: await this.provider.getSignedUrl(photo.storage_key, SIGNED_URL_EXPIRES_IN_SECONDS),
      })),
    );
  }
}
