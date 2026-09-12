import { Controller, Get, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { SellerService } from './seller.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { InternalRolesGuard } from '../../common/guards/internal-roles.guard';
import { InternalRoles } from '../../common/decorators/internal-roles.decorator';

@Controller('sellers')
@UseGuards(JwtAuthGuard, InternalRolesGuard)
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @InternalRoles('admin', 'asesor', 'operador')
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.sellerService.findAll(query.page, query.size);
  }

  @InternalRoles('admin', 'asesor')
  @Patch(':id/verify')
  verify(@Param('id') id: string, @Req() req: any) {
    return this.sellerService.verify(id, req.user?.userId);
  }
}
