import { Controller, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { VehicleSaleService } from './vehicle-sale.service';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';

@Controller('vehicles')
export class VehicleSaleController {
  constructor(private readonly vehicleSaleService: VehicleSaleService) {}

  @UseGuards(JwtAuthGuard)
  @Patch(':id/sell')
  async sell(@Param('id') id: string, @Req() req: any) {
    const { record, cancelledAppointment } = await this.vehicleSaleService.markAsSold(
      id,
      req.user.userId,
      req.user.internalRole,
    );
    return {
      message: 'Vehículo marcado como vendido',
      record,
      cancelledAppointment,
    };
  }
}
