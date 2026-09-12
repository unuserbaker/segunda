import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { InternalStaffService } from './internal-staff.service';
import { CreateInternalStaffDto } from './dto/create-internal-staff.dto';
import type { UpdateInternalStaffDto } from './dto/update-internal-staff.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { InternalRolesGuard } from '../../common/guards/internal-roles.guard';
import { InternalRoles } from '../../common/decorators/internal-roles.decorator';

@Controller('internal/staff')
@UseGuards(JwtAuthGuard, InternalRolesGuard)
@InternalRoles('admin')
export class InternalStaffController {
  constructor(private readonly internalStaffService: InternalStaffService) {}

  @Post()
  create(@Body() dto: CreateInternalStaffDto, @Req() req: any) {
    return this.internalStaffService.create(dto, req.user?.userId ?? null);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.internalStaffService.findAll(query.page, query.size);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInternalStaffDto) {
    return this.internalStaffService.update(id, dto);
  }
}
