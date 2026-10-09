import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertProducer(roles: UserRole[]) {
    if (!roles.includes(UserRole.PRODUCER) && !roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Apenas produtores podem gerenciar produtos.');
    }
  }

  async create(userId: string, roles: UserRole[], dto: CreateProductDto) {
    this.assertProducer(roles);

    const existing = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Slug já está em uso.');
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        category: dto.category,
        coverUrl: dto.coverUrl,
        type: dto.type,
        producerId: userId,
      },
      include: { offers: true },
    });
  }

  async listMine(userId: string, roles: UserRole[]) {
    this.assertProducer(roles);

    const data = await this.prisma.product.findMany({
      where: { producerId: userId },
      include: {
        offers: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data,
      meta: { total: data.length },
    };
  }

  async findMine(id: string, userId: string, roles: UserRole[]) {
    this.assertProducer(roles);

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        offers: true,
        files: true,
        affiliatePrograms: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    if (
      product.producerId !== userId &&
      !roles.includes(UserRole.ADMIN)
    ) {
      throw new ForbiddenException('Você não possui este produto.');
    }

    return product;
  }

  async update(
    id: string,
    userId: string,
    roles: UserRole[],
    dto: UpdateProductDto,
  ) {
    const product = await this.findMine(id, userId, roles);

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.prisma.product.findUnique({
        where: { slug: dto.slug },
      });

      if (existing) {
        throw new ConflictException('Slug já está em uso.');
      }
    }

    const data = { ...dto } as any;

    if (
      dto.status === ProductStatus.PUBLISHED &&
      product.status !== ProductStatus.PUBLISHED
    ) {
      data.publishedAt = new Date();
    }

    if (dto.status === ProductStatus.DRAFT) {
      data.publishedAt = null;
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: { offers: true },
    });
  }

  async addFile(
    productId: string,
    userId: string,
    roles: UserRole[],
    dto: import('./dto/create-product-file.dto').CreateProductFileDto,
  ) {
    await this.findMine(productId, userId, roles);

    return this.prisma.productFile.create({
      data: {
        productId,
        storageKey: dto.storageKey,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        size: dto.size,
      },
    });
  }

  async removeFile(
    productId: string,
    fileId: string,
    userId: string,
    roles: UserRole[],
  ) {
    await this.findMine(productId, userId, roles);

    const file = await this.prisma.productFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.productId !== productId) {
      throw new NotFoundException('Arquivo não encontrado.');
    }

    return this.prisma.productFile.delete({
      where: { id: fileId },
    });
  }

  async archive(
    id: string,
    userId: string,
    roles: UserRole[],
  ) {
    await this.findMine(id, userId, roles);

    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
    });
  }

  async publicList() {
    const data = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        coverUrl: true,
        type: true,
        publishedAt: true,
        offers: {
          where: { status: 'ACTIVE' },
          orderBy: { price: 'asc' },
          take: 1,
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    return {
      data,
      meta: {
        page: 1,
        limit: data.length,
        total: data.length,
      },
    };
  }
}