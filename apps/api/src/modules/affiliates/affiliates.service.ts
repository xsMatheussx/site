import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AffiliatesService {
  constructor(private prisma: PrismaService) {}

  private assertAffiliate(roles: UserRole[]) {
    if (
      !roles.includes(UserRole.AFFILIATE) &&
      !roles.includes(UserRole.ADMIN)
    ) {
      throw new ForbiddenException(
        'Apenas afiliados podem operar esta área.',
      );
    }
  }

  async enable(userId: string, roles: UserRole[]) {
    if (!roles.includes(UserRole.AFFILIATE)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            push: UserRole.AFFILIATE,
          },
        },
      });
    }

    return this.prisma.affiliate.upsert({
      where: { userId },
      update: { status: 'ACTIVE' },
      create: {
        userId,
        status: 'ACTIVE',
      },
    });
  }

  async opportunities() {
    return this.prisma.affiliateProgram.findMany({
      where: {
        enabled: true,
        product: {
          status: 'PUBLISHED',
        },
      },
      include: {
        product: {
          include: {
            offers: {
              where: { status: 'ACTIVE' },
              orderBy: { price: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async createProgram(
    productId: string,
    userId: string,
    roles: UserRole[],
    commissionType: string,
    commissionValue: number,
    approvalMode = 'AUTO',
    rules?: string,
  ) {
    if (
      !roles.includes(UserRole.PRODUCER) &&
      !roles.includes(UserRole.ADMIN)
    ) {
      throw new ForbiddenException('Apenas produtores.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    if (
      product.producerId !== userId &&
      !roles.includes(UserRole.ADMIN)
    ) {
      throw new ForbiddenException();
    }

    if (
      !['PERCENTAGE', 'FIXED'].includes(commissionType) ||
      commissionValue <= 0
    ) {
      throw new BadRequestException('Comissão inválida.');
    }

    return this.prisma.affiliateProgram.upsert({
      where: { productId },
      update: {
        enabled: true,
        commissionType,
        commissionValue,
        approvalMode,
        rules,
      },
      create: {
        productId,
        enabled: true,
        commissionType,
        commissionValue,
        approvalMode,
        rules,
      },
    });
  }

  async apply(
    programId: string,
    userId: string,
    roles: UserRole[],
  ) {
    this.assertAffiliate(roles);

    const affiliate = await this.prisma.affiliate.upsert({
      where: { userId },
      update: { status: 'ACTIVE' },
      create: {
        userId,
        status: 'ACTIVE',
      },
    });

    const p = await this.prisma.affiliateProgram.findUnique({
      where: { id: programId },
    });

    if (!p || !p.enabled) {
      throw new NotFoundException('Programa não encontrado.');
    }

    const applicationData = {
      affiliateId: affiliate.id,
      affiliateProgramId: programId,
    };

    if (p.approvalMode === 'AUTO') {
      return this.prisma.affiliateApplication.upsert({
        where: {
          affiliateId_affiliateProgramId: {
            affiliateId: affiliate.id,
            affiliateProgramId: programId,
          },
        },
        update: {
          status: 'APPROVED',
        },
        create: {
          ...applicationData,
          status: 'APPROVED',
        },
      });
    }

    return this.prisma.affiliateApplication.upsert({
      where: {
        affiliateId_affiliateProgramId: {
          affiliateId: affiliate.id,
          affiliateProgramId: programId,
        },
      },
      update: {
        status: 'PENDING',
      },
      create: {
        ...applicationData,
        status: 'PENDING',
      },
    });
  }

  async createLink(
    programId: string,
    userId: string,
    roles: UserRole[],
  ) {
    this.assertAffiliate(roles);

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new BadRequestException(
        'Ative seu perfil de afiliado.',
      );
    }

    const app = await this.prisma.affiliateApplication.findUnique({
      where: {
        affiliateId_affiliateProgramId: {
          affiliateId: affiliate.id,
          affiliateProgramId: programId,
        },
      },
    });

    if (!app || app.status !== 'APPROVED') {
      throw new ForbiddenException(
        'Afiliado não aprovado neste produto.',
      );
    }

    const p = await this.prisma.affiliateProgram.findUnique({
      where: { id: programId },
    });

    if (!p) {
      throw new NotFoundException();
    }

    return this.prisma.affiliateLink.create({
      data: {
        affiliateId: affiliate.id,
        programId: p.id,
        productId: p.productId,
        code: randomBytes(6).toString('hex'),
      },
    });
  }

  async myLinks(
    userId: string,
    roles: UserRole[],
  ) {
    this.assertAffiliate(roles);

    const a = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    return a
      ? this.prisma.affiliateLink.findMany({
          where: { affiliateId: a.id },
          include: { product: true },
          orderBy: { id: 'desc' },
        })
      : [];
  }
  async mySales(userId: string, roles: UserRole[]) {
    this.assertAffiliate(roles);
    const affiliate = await this.prisma.affiliate.findUnique({ where: { userId } });
    if (!affiliate) return [];
    return this.prisma.sale.findMany({
      where: { affiliateId: affiliate.id },
      include: { product: true, order: { include: { customer: true } }, affiliateLink: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async myCommissions(userId: string, roles: UserRole[]) {
    this.assertAffiliate(roles);
    const affiliate = await this.prisma.affiliate.findUnique({ where: { userId } });
    if (!affiliate) return [];
    return this.prisma.commission.findMany({
      where: { affiliateId: affiliate.id },
      include: { sale: { include: { product: true } }, order: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

}