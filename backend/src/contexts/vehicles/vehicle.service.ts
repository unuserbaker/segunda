import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  async findAll(page = 1, size = 10) {
    const limit = size;
    const offset = page > 0 ? (page - 1) * limit : 0;

    const [rows, totalItems] = await this.vehicleRepo.findAndCount({
      relations: ['brand', 'category', 'engineType', 'transmission', 'type', 'status'],
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(totalItems / limit);

    return { currentPage: page, limit, totalPages, totalItems, rows };
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
}
