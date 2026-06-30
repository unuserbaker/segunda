import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity';
import { Category } from '../entities/category.entity';
import { Status } from '../entities/status.entity';
import { EngineType } from '../entities/engine_type.entity';
import { Transmission } from '../entities/transmission.entity';
import { Type } from '../entities/type.entity';

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
    if (await this.brandRepo.count()) return;
    await this.brandRepo.save([
      { name: 'Toyota', str_code: 'TOY', active: true },
      { name: 'Mazda', str_code: 'MAZ', active: true },
      { name: 'Renault', str_code: 'REN', active: true },
      { name: 'Chevrolet', str_code: 'CHE', active: true },
    ]);
  }

  async seedCategories() {
    if (await this.categoryRepo.count()) return;
    await this.categoryRepo.save([
      { name: 'SUV', str_code: 'SUV', active: true },
      { name: 'Sedán', str_code: 'SED', active: true },
      { name: 'Hatchback', str_code: 'HAT', active: true },
    ]);
  }

  async seedStatus() {
    if (await this.statusRepo.count()) return;
    await this.statusRepo.save([
      { name: 'Disponible', str_code: 'available', active: true },
      { name: 'Reservado', str_code: 'reserved', active: true },
      { name: 'Vendido', str_code: 'sold', active: true },
    ]);
  }

  async seedEngineTypes() {
    if (await this.engineTypeRepo.count()) return;
    await this.engineTypeRepo.save([
      { name: 'Gasolina', str_code: 'GAS', active: true },
      { name: 'Diésel', str_code: 'DIE', active: true },
      { name: 'Eléctrico', str_code: 'ELE', active: true },
    ]);
  }

  async seedTransmissions() {
    if (await this.transmissionRepo.count()) return;
    await this.transmissionRepo.save([
      { name: 'Manual', str_code: 'MAN', active: true },
      { name: 'Automática', str_code: 'AUT', active: true },
    ]);
  }

  async seedTypes() {
    if (await this.typeRepo.count()) return;
    await this.typeRepo.save([
      { name: 'Particular', str_code: 'PAR', active: true },
      { name: 'Carga', str_code: 'CAR', active: true },
    ]);
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
