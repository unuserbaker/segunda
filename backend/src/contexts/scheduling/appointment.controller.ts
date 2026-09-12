import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { SellerService } from '../sellers/seller.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { SellerResultDto } from './dto/seller-result.dto';
import { CustomerResultDto } from './dto/customer-result.dto';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { DisputeNoteDto } from './dto/dispute-note.dto';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { Public } from '../../common/decorators/public.decorator';
import { InternalRoles } from '../../common/decorators/internal-roles.decorator';
import { InternalRolesGuard } from '../../common/guards/internal-roles.guard';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';

/**
 * Criterio de autorización (decisión de @developer, sin bloquear por falta de definición de @po):
 * - `GET /appointments`: staff interno (`admin`/`asesor`/`operador`) ve todas las citas y puede
 *   filtrar por `isDisputed`; un usuario de negocio (`buyer`/`seller`) ve solo las citas donde
 *   participa (como comprador o, si tiene perfil `Seller`, como vendedor).
 * - `GET /appointments/:id`: mismo criterio, con 403 si el usuario de negocio no es dueño de la cita.
 * - El link de un clic (`customer-result/:token`) es el único endpoint `@Public()`.
 */
@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly sellerService: SellerService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createAppointment(@Body() dto: CreateAppointmentDto, @Req() req: any) {
    return this.appointmentService.createAppointment(req.user.userId, dto.vehicleId, dto.scheduledAt);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() query: AppointmentFilterDto, @Req() req: any) {
    const isDisputed =
      query.isDisputed !== undefined ? query.isDisputed === 'true' : undefined;

    if (req.user.internalRole) {
      return this.appointmentService.findAll(query.page, query.size, { isDisputed });
    }

    // Usuario de negocio: se filtra en memoria del lado del service sería ideal, pero para
    // mantener simple el MVP se resuelve aquí con dos consultas separadas (buyer/seller) y merge.
    const result = await this.appointmentService.findAll(query.page, query.size, { isDisputed });
    const seller = await this.sellerService.findByUserId(req.user.userId);
    const filteredRows = result.rows.filter(
      (a: any) => a.buyer_id === req.user.userId || (seller && a.seller_id === seller.id),
    );
    return { ...result, rows: filteredRows, totalItems: filteredRows.length };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const appointment = await this.appointmentService.findOne(id);

    if (!req.user.internalRole) {
      const seller = await this.sellerService.findByUserId(req.user.userId);
      const isOwner =
        appointment.buyer_id === req.user.userId || (seller && appointment.seller_id === seller.id);
      if (!isOwner) {
        throw new ForbiddenException('No tienes acceso a esta cita');
      }
    }

    const disputeNotes = await this.appointmentService.listDisputeNotes(id);
    return { ...appointment, disputeNotes };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/rsvp')
  confirmRsvp(@Param('id') id: string, @Req() req: any) {
    return this.appointmentService.confirmRsvp(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/seller-result')
  async recordSellerResult(
    @Param('id') id: string,
    @Body() dto: SellerResultDto,
    @Req() req: any,
  ) {
    const seller = await this.sellerService.findByUserId(req.user.userId);
    if (!seller) {
      throw new ForbiddenException('No tienes un perfil de seller asociado');
    }
    return this.appointmentService.recordSellerResult(id, seller.id, dto.result);
  }

  @Public()
  @Get('customer-result/:token')
  getCustomerResultByToken(@Param('token') token: string) {
    return this.appointmentService.getByCustomerResultToken(token);
  }

  @Public()
  @Post('customer-result/:token')
  recordCustomerResult(@Param('token') token: string, @Body() dto: CustomerResultDto) {
    return this.appointmentService.recordCustomerResult(token, dto.result);
  }

  @UseGuards(JwtAuthGuard, InternalRolesGuard)
  @InternalRoles('admin', 'asesor')
  @Post(':id/dispute-notes')
  addDisputeNote(@Param('id') id: string, @Body() dto: DisputeNoteDto, @Req() req: any) {
    return this.appointmentService.addDisputeNote(id, req.user.userId, dto.note);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/ratings')
  async submitRating(@Param('id') id: string, @Body() dto: SubmitRatingDto, @Req() req: any) {
    if (dto.raterRole === 'seller') {
      const seller = await this.sellerService.findByUserId(req.user.userId);
      if (!seller) {
        throw new BadRequestException('No tienes un perfil de seller asociado');
      }
      return this.appointmentService.submitRating(id, seller.id, 'seller', dto.stars, dto.label);
    }
    return this.appointmentService.submitRating(id, req.user.userId, 'buyer', dto.stars, dto.label);
  }
}
