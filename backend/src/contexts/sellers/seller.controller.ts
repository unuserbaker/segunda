import { Controller, Get, Patch, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { SellerService } from './seller.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { InternalRolesGuard } from '../../common/guards/internal-roles.guard';
import { InternalRoles } from '../../common/decorators/internal-roles.decorator';

@Controller('sellers')
@UseGuards(JwtAuthGuard, InternalRolesGuard)
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('me')
  async findMe(@Req() req: any) {
    const seller = await this.sellerService.findByUserId(req.user?.userId);
    if (!seller) {
      throw new NotFoundException('No tienes un perfil de seller');
    }
    return {
      message: 'Perfil de seller',
      record: {
        id: seller.id,
        business_name: seller.business_name,
        tax_id: seller.tax_id,
        phone: seller.phone,
        verified: seller.verified,
        verified_at: seller.verified_at,
        rating: seller.rating,
        total_sales: seller.total_sales,
      },
    };
  }

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
