import { Body, Controller, Get, Param, Patch, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductFileDto } from './dto/create-product-file.dto';
import { ProductsService } from './products.service';
import { StorageService } from '../storage/storage.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService, private readonly storage: StorageService) {}

  @Public()
  @Get()
  list() { return this.products.publicList(); }

  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  @Get('mine')
  mine(@Req() req: any) { return this.products.listMine(req.user.id, req.user.roles); }

  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  @Get(':id')
  get(@Param('id') id: string, @Req() req: any) { return this.products.findMine(id, req.user.id, req.user.roles); }

  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  @Post()
  create(@Req() req: any, @Body() dto: CreateProductDto) { return this.products.create(req.user.id, req.user.roles, dto); }

  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateProductDto) { return this.products.update(id, req.user.id, req.user.roles, dto); }

  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  @Post(':id/files')
  addFile(@Param('id') id: string, @Req() req: any, @Body() dto: CreateProductFileDto) { return this.products.addFile(id, req.user.id, req.user.roles, dto); }


  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async upload(@Param('id') id: string, @Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('Arquivo obrigatório.');
    const saved = await this.storage.save(file.buffer, file.originalname, file.mimetype);
    return this.products.addFile(id, req.user.id, req.user.roles, { storageKey: saved.key, fileName: saved.fileName, mimeType: saved.mimeType, size: saved.size });
  }

  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  @Post(':id/archive')
  archive(@Param('id') id: string, @Req() req: any) { return this.products.archive(id, req.user.id, req.user.roles); }
}
