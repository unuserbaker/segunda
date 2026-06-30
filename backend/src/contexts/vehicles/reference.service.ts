import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { EngineType } from './entities/engine_type.entity';
import { Transmission } from './entities/transmission.entity';
import { Type } from './entities/type.entity';
import { Status } from './entities/status.entity';

@Injectable()
export class ReferenceService {
  constructor(
    @InjectRepository(Brand) private readonly brandRepo: Repository<Brand>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(EngineType) private readonly engineTypeRepo: Repository<EngineType>,
    @InjectRepository(Transmission) private readonly transmissionRepo: Repository<Transmission>,
    @InjectRepository(Type) private readonly typeRepo: Repository<Type>,
    @InjectRepository(Status) private readonly statusRepo: Repository<Status>,
  ) {}

  async findAllBrands(page = 1, size = 10) { return this.paginate(this.brandRepo, page, size); }
  async findAllCategories(page = 1, size = 10) { return this.paginate(this.categoryRepo, page, size); }
  async findAllEngineTypes(page = 1, size = 10) { return this.paginate(this.engineTypeRepo, page, size); }
  async findAllTransmissions(page = 1, size = 10) { return this.paginate(this.transmissionRepo, page, size); }
  async findAllTypes(page = 1, size = 10) { return this.paginate(this.typeRepo, page, size); }
  async findAllStatuses(page = 1, size = 10) { return this.paginate(this.statusRepo, page, size); }

  private async paginate(repo: Repository<any>, page = 1, size = 10) {
    const limit = size;
    const offset = page > 0 ? (page - 1) * limit : 0;
    const [rows, totalItems] = await repo.findAndCount({
      take: limit, skip: offset, order: { created_at: 'DESC' },
    });
    const totalPages = Math.ceil(totalItems / limit);
    return { currentPage: page, limit, totalPages, totalItems, rows };
  }
}
