import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OffersService } from './offers.service';

@Controller('products/:productId/offers')
@Roles(UserRole.PRODUCER, UserRole.ADMIN)
export class OffersController {
  constructor(private readonly offers: OffersService) {}
  @Get() list(@Param('productId') productId: string, @Req() req: any) { return this.offers.list(productId, req.user.id, req.user.roles); }
  @Post() create(@Param('productId') productId: string, @Req() req: any, @Body() dto: CreateOfferDto) { return this.offers.create(productId, req.user.id, req.user.roles, dto); }
  @Patch(':id') update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateOfferDto) { return this.offers.update(id, req.user.id, req.user.roles, dto); }
}
