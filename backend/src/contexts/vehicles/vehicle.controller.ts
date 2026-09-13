import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VehicleService } from './vehicle.service';
import { FilesService } from '../files/files.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { SellerVerifiedGuard } from '../../common/guards/seller-verified.guard';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Controller('vehicles')
export class VehicleController {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly filesService: FilesService,
  ) {}

  @Public()
  @Get()
  findAll(@Query() query: VehicleFilterDto) {
    return this.vehicleService.findAll(query.page, query.size, {
      brandId: query.brandId,
      categoryId: query.categoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehicleService.findOne(id);
  }

  @Post()
  @UseGuards(SellerVerifiedGuard)
  create(@Body() dto: CreateVehicleDto) {
    return this.vehicleService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehicleService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No se envió ningún archivo');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido (solo jpeg, png o webp)');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('El archivo excede el tamaño máximo permitido (5MB)');
    }

    await this.vehicleService.assertCanManagePhotos(id, req.user.userId, req.user.internalRole);

    return this.filesService.uploadVehiclePhoto(id, {
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
    });
  }
}
