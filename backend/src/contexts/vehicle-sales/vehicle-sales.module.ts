import { Module } from '@nestjs/common';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { VehicleSaleService } from './vehicle-sale.service';
import { VehicleSaleController } from './vehicle-sale.controller';

/**
 * Módulo orquestador delgado (ver adr-venta-vehiculo-orquestacion.md sección 2): importa
 * `VehiclesModule` y `SchedulingModule` sin que ninguno de los dos se entere del otro más de lo
 * que ya se conocen hoy (`SchedulingModule` ya importa `VehiclesModule`). No modifica el grafo de
 * imports existente de ninguno de los dos módulos.
 */
@Module({
  imports: [VehiclesModule, SchedulingModule],
  controllers: [VehicleSaleController],
  providers: [VehicleSaleService],
})
export class VehicleSalesModule {}
