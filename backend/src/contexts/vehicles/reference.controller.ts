import { Controller, Get, Query } from '@nestjs/common';
import { ReferenceService } from './reference.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller()
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get('brands')
  findAllBrands(@Query() query: PaginationDto) { return this.referenceService.findAllBrands(query.page, query.size); }

  @Get('categories')
  findAllCategories(@Query() query: PaginationDto) { return this.referenceService.findAllCategories(query.page, query.size); }

  @Get('engine_types')
  findAllEngineTypes(@Query() query: PaginationDto) { return this.referenceService.findAllEngineTypes(query.page, query.size); }

  @Get('transmissions')
  findAllTransmissions(@Query() query: PaginationDto) { return this.referenceService.findAllTransmissions(query.page, query.size); }

  @Get('types')
  findAllTypes(@Query() query: PaginationDto) { return this.referenceService.findAllTypes(query.page, query.size); }

  @Get('status')
  findAllStatuses(@Query() query: PaginationDto) { return this.referenceService.findAllStatuses(query.page, query.size); }
}
