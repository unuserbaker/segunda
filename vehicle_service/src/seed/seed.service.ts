import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../modules/vehicle/domain/entities/brand.entity';
import { Category } from '../modules/vehicle/domain/entities/category.entity';
import { Status } from '../modules/vehicle/domain/entities/status.entity';
import { EngineType } from '../modules/vehicle/domain/entities/engine_type.entity';
import { Transmission } from '../modules/vehicle/domain/entities/transmission.entity';
import { Type } from '../modules/vehicle/domain/entities/type.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Brand) private brandRepo: Repository<Brand>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Status) private statusRepo: Repository<Status>,
    @InjectRepository(EngineType) private engineTypeRepo: Repository<EngineType>,
    @InjectRepository(Transmission) private transmissionRepo: Repository<Transmission>,
    @InjectRepository(Type) private typeRepo: Repository<Type>,
  ) {}

  async seedBrands() {
    const brands = [
      { name: 'Toyota', str_code: 'TOY', active: true },
      { name: 'Mazda', str_code: 'MAZ', active: true },
      { name: 'Renault', str_code: 'REN', active: true },
      { name: 'Chevrolet', str_code: 'CHE', active: true },
    ];
    await this.brandRepo.save(brands);
  }

  async seedCategories() {
    const categories = [
      { name: 'SUV', str_code: 'SUV', active: true },
      { name: 'Sedán', str_code: 'SED', active: true },
      { name: 'Hatchback', str_code: 'HAT', active: true },
    ];
    await this.categoryRepo.save(categories);
  }

  async seedStatus() {
    const status = [
      { name: 'Disponible', str_code: 'available', active: true },
      { name: 'Reservado', str_code: 'reserved', active: true },
      { name: 'Vendido', str_code: 'sold', active: true },
    ];
    await this.statusRepo.save(status);
  }

  async seedEngineTypes() {
    const engineTypes = [
      { name: 'Gasolina', str_code: 'GAS', active: true },
      { name: 'Diésel', str_code: 'DIE', active: true },
      { name: 'Eléctrico', str_code: 'ELE', active: true },
    ];
    await this.engineTypeRepo.save(engineTypes);
  }

  async seedTransmissions() {
    const transmissions = [
      { name: 'Manual', str_code: 'MAN', active: true },
      { name: 'Automática', str_code: 'AUT', active: true },
    ];
    await this.transmissionRepo.save(transmissions);
  }

  async seedTypes() {
    const types = [
      { name: 'Particular', str_code: 'PAR', active: true },
      { name: 'Carga', str_code: 'CAR', active: true },
    ];
    await this.typeRepo.save(types);
  }

  async seedAll() {
    await this.seedBrands();
    await this.seedCategories();
    await this.seedStatus();
    await this.seedEngineTypes();
    await this.seedTransmissions();
    await this.seedTypes();
  }
}