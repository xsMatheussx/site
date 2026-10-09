import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProductOwner(productId: string, userId: string, roles: UserRole[]) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produto não encontrado.');
    if (product.producerId !== userId && !roles.includes(UserRole.ADMIN)) throw new ForbiddenException('Você não possui este produto.');
    return product;
  }

  async create(productId: string, userId: string, roles: UserRole[], dto: CreateOfferDto) {
    await this.assertProductOwner(productId, userId, roles);
    if (dto.endsAt && dto.startsAt && new Date(dto.endsAt) <= new Date(dto.startsAt)) throw new ConflictException('A data final deve ser posterior à inicial.');
    return this.prisma.offer.create({ data: { productId, name: dto.name, price: dto.price, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined, endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined } });
  }

  async list(productId: string, userId: string, roles: UserRole[]) {
    await this.assertProductOwner(productId, userId, roles);
    return this.prisma.offer.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, userId: string, roles: UserRole[], dto: UpdateOfferDto) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundException('Oferta não encontrada.');
    await this.assertProductOwner(offer.productId, userId, roles);
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : offer.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : offer.endsAt;
    if (startsAt && endsAt && endsAt <= startsAt) throw new ConflictException('A data final deve ser posterior à inicial.');
    return this.prisma.offer.update({ where: { id }, data: { ...dto, startsAt: dto.startsAt ? startsAt : undefined, endsAt: dto.endsAt ? endsAt : undefined } });
  }
}
