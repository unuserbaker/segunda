import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Status } from './entities/status.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { FilesService } from '../files/files.service';
import { SellerService } from '../sellers/seller.service';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Status)
    private readonly statusRepo: Repository<Status>,
    private readonly filesService: FilesService,
    private readonly sellerService: SellerService,
  ) {}

  async findAll(
    page = 1,
    size = 10,
    filters: { brandId?: string; categoryId?: string; minPrice?: number; maxPrice?: number } = {},
  ) {
    const limit = size;
    const offset = page > 0 ? (page - 1) * limit : 0;

    const qb = this.vehicleRepo
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.brand', 'brand')
      .leftJoinAndSelect('vehicle.category', 'category')
      .leftJoinAndSelect('vehicle.engineType', 'engineType')
      .leftJoinAndSelect('vehicle.transmission', 'transmission')
      .leftJoinAndSelect('vehicle.type', 'type')
      .leftJoinAndSelect('vehicle.status', 'status')
      .orderBy('vehicle.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    if (filters.brandId) {
      qb.andWhere('vehicle.brand_id = :brandId', { brandId: filters.brandId });
    }
    if (filters.categoryId) {
      qb.andWhere('vehicle.category_id = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters.minPrice !== undefined) {
      qb.andWhere('vehicle.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters.maxPrice !== undefined) {
      qb.andWhere('vehicle.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    const [rows, totalItems] = await qb.getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);

    return { currentPage: page, limit, totalPages, totalItems, rows };
  }

  async findOne(id: string) {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id },
      relations: ['brand', 'category', 'engineType', 'transmission', 'type', 'status'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    const photos = await this.filesService.listVehiclePhotoUrls(id);
    return { ...vehicle, photos };
  }

  /**
   * Verifica que el usuario autenticado sea el seller dueño del vehículo (o un rol interno
   * `admin`, que puede administrar cualquier vehículo). Helper genérico de ownership, reutilizado
   * tanto por `assertCanManagePhotos` (fotos) como por `VehicleSaleService.markAsSold` (venta).
   */
  async assertOwnerOrAdmin(vehicleId: string, userId: string, internalRole?: string | null) {
    if (internalRole === 'admin') return;

    const vehicle = await this.vehicleRepo.findOne({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    const seller = await this.sellerService.findByUserId(userId);
    if (!seller || seller.id !== vehicle.seller_id) {
      throw new ForbiddenException('No tienes permisos para administrar este vehículo');
    }
  }

  /** Consumido por el endpoint de subida de fotos (`POST /vehicles/:id/photos`). */
  async assertCanManagePhotos(vehicleId: string, userId: string, internalRole?: string | null) {
    return this.assertOwnerOrAdmin(vehicleId, userId, internalRole);
  }

  async create(dto: CreateVehicleDto) {
    const existing = await this.vehicleRepo.findOne({ where: { plate: dto.plate } });

    if (existing) {
      throw new ConflictException(`Ya existe un vehículo con la placa ${dto.plate}`);
    }

    const vehicle = this.vehicleRepo.create({
      category_id: dto.categoryId,
      brand_id: dto.brandId,
      price: dto.price,
      mileage: dto.mileage,
      plate: dto.plate,
      engine_type_id: dto.engineTypeId,
      transmission_id: dto.transmissionId,
      type_id: dto.typeId,
      status_id: dto.statusId,
      seller_id: dto.sellerId,
      year: dto.year,
      color: dto.color,
      description: dto.description,
    });

    return this.vehicleRepo.save(vehicle);
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.vehicleRepo.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    if (dto.plate && dto.plate !== vehicle.plate) {
      const existing = await this.vehicleRepo.findOne({ where: { plate: dto.plate } });
      if (existing) {
        throw new ConflictException(`Ya existe un vehículo con la placa ${dto.plate}`);
      }
    }

    if (dto.statusId !== undefined) {
      const targetStatus = await this.statusRepo.findOneBy({ id: dto.statusId });
      if (targetStatus?.str_code === 'sold') {
        throw new BadRequestException(
          'Use PATCH /vehicles/:id/sell para marcar un vehículo como vendido',
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (dto.categoryId !== undefined) updateData.category_id = dto.categoryId;
    if (dto.brandId !== undefined) updateData.brand_id = dto.brandId;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.mileage !== undefined) updateData.mileage = dto.mileage;
    if (dto.plate !== undefined) updateData.plate = dto.plate;
    if (dto.engineTypeId !== undefined) updateData.engine_type_id = dto.engineTypeId;
    if (dto.transmissionId !== undefined) updateData.transmission_id = dto.transmissionId;
    if (dto.typeId !== undefined) updateData.type_id = dto.typeId;
    if (dto.statusId !== undefined) updateData.status_id = dto.statusId;
    if (dto.sellerId !== undefined) updateData.seller_id = dto.sellerId;
    if (dto.year !== undefined) updateData.year = dto.year;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.description !== undefined) updateData.description = dto.description;

    if (Object.keys(updateData).length === 0) {
      throw new NotFoundException('No se enviaron datos para actualizar');
    }

    await this.vehicleRepo.update(id, updateData);
    return this.vehicleRepo.findOne({
      where: { id },
      relations: ['brand', 'category', 'engineType', 'transmission', 'type', 'status'],
    });
  }

  // ---------------------------------------------------------------------
  // Contrato exportado hacia `scheduling` (docs-arquitectura-mes1-scheduling.md sección 2.3)
  // `scheduling` nunca inyecta `Repository<Vehicle>` directamente, solo usa estos métodos.
  // ---------------------------------------------------------------------

  private async getStatusIdByCode(strCode: string): Promise<number> {
    const status = await this.statusRepo.findOneBy({ str_code: strCode });
    if (!status) {
      throw new NotFoundException(`Catálogo de status "${strCode}" no encontrado (seed pendiente)`);
    }
    return status.id;
  }

  async isBlockedForScheduling(vehicleId: string): Promise<boolean> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId },
      relations: ['status'],
    });
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    return vehicle.status?.str_code === 'active_appointment';
  }

  /**
   * Resumen mínimo que `scheduling` necesita para orquestar `createAppointment` sin importar
   * `Repository<Vehicle>` ni la entidad `Vehicle`.
   */
  async getSchedulingSummary(
    vehicleId: string,
  ): Promise<{ sellerId: string; isBlocked: boolean } | null> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId },
      relations: ['status'],
    });
    if (!vehicle) return null;
    return {
      sellerId: vehicle.seller_id,
      isBlocked: vehicle.status?.str_code === 'active_appointment',
    };
  }

  /**
   * Marca el vehículo como "con cita activa". El `appointmentId` no se persiste en una columna
   * dedicada (la entidad `Vehicle` no la define); la relación vehículo↔cita activa vive del lado
   * de `scheduling.appointments` (que sí guarda `vehicle_id`). Se documenta esta decisión: es
   * suficiente para el MVP, ya que `isBlockedForScheduling` solo necesita el estado, no el id.
   */
  async blockForAppointment(vehicleId: string, _appointmentId: string): Promise<void> {
    const statusId = await this.getStatusIdByCode('active_appointment');
    await this.vehicleRepo.update(vehicleId, { status_id: statusId });
  }

  async releaseFromAppointment(vehicleId: string): Promise<void> {
    const statusId = await this.getStatusIdByCode('available');
    await this.vehicleRepo.update(vehicleId, { status_id: statusId });
  }

  async archiveBySale(vehicleId: string): Promise<void> {
    const statusId = await this.getStatusIdByCode('sold');
    await this.vehicleRepo.update(vehicleId, { status_id: statusId });
  }

  /**
   * Sugiere vehículos alternativos del mismo seller (concesionario), disponibles, excluyendo el
   * vehículo original. Se prioriza "mismo seller" porque el buyer ya mostró interés en ese
   * inventario específico (decisión de @developer, no especificada al detalle en el diseño).
   */
  async suggestAlternatives(
    sellerId: string,
    excludeVehicleId: string,
    n: number,
  ): Promise<Vehicle[]> {
    const availableStatusId = await this.getStatusIdByCode('available');

    return this.vehicleRepo.find({
      where: { seller_id: sellerId, status_id: availableStatusId, id: Not(excludeVehicleId) },
      order: { created_at: 'DESC' },
      take: n,
      relations: ['brand', 'category', 'type'],
    });
  }
}
