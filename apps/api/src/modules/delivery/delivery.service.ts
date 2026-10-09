import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateToken() {
    return randomBytes(32).toString('hex');
  }

  async grant(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        product: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    const token = this.generateToken();
    const accessTokenHash = this.hashToken(token);

    let access = await this.prisma.access.findUnique({
      where: { orderId },
    });

    if (!access) {
      access = await this.prisma.access.findUnique({
        where: {
          customerId_productId: {
            customerId: order.customerId,
            productId: order.productId,
          },
        },
      });
    }

    if (access) {
      access = await this.prisma.access.update({
        where: { id: access.id },
        data: {
          orderId,
          accessTokenHash,
          status: 'ACTIVE',
          revokedAt: null,
        },
      });
    } else {
      access = await this.prisma.access.create({
        data: {
          orderId,
          customerId: order.customerId,
          productId: order.productId,
          accessTokenHash,
          status: 'ACTIVE',
        },
      });
    }

    return {
      access,
      accessToken: token,
    };
  }

  async mine(userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { userId },
    });

    if (!customer) {
      return [];
    }

    return this.prisma.access.findMany({
      where: {
        customerId: customer.id,
        status: 'ACTIVE',
      },
      include: {
        product: {
          include: {
            files: true,
            course: {
              include: {
                modules: {
                  include: {
                    lessons: true,
                  },
                  orderBy: {
                    position: 'asc',
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        grantedAt: 'desc',
      },
    });
  }

  async getByToken(token: string) {
    if (!token || token.length < 32) {
      throw new ForbiddenException('Token de acesso inválido.');
    }

    const accessTokenHash = this.hashToken(token);

    const access = await this.prisma.access.findUnique({
      where: { accessTokenHash },
      include: {
        customer: true,
        product: {
          include: {
            files: true,
            course: {
              include: {
                modules: {
                  include: {
                    lessons: true,
                  },
                  orderBy: {
                    position: 'asc',
                  },
                },
              },
            },
          },
        },
        order: true,
      },
    });

    if (!access || access.status !== 'ACTIVE') {
      throw new ForbiddenException('Acesso negado.');
    }

    return {
      id: access.id,
      status: access.status,
      grantedAt: access.grantedAt,
      customer: {
        name: access.customer.name,
        email: access.customer.email,
      },
      product: access.product,
      orderId: access.orderId,
    };
  }

  async downloadByToken(
    token: string,
    fileId: string,
  ) {
    if (!token || token.length < 32) {
      throw new ForbiddenException('Token de acesso inválido.');
    }

    const accessTokenHash = this.hashToken(token);

    const access = await this.prisma.access.findUnique({
      where: { accessTokenHash },
    });

    if (!access || access.status !== 'ACTIVE') {
      throw new ForbiddenException('Acesso negado.');
    }

    const file = await this.prisma.productFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.productId !== access.productId) {
      throw new NotFoundException('Arquivo não encontrado.');
    }

    const url = await this.storage.createDownloadUrl(
      file.storageKey,
      file.fileName,
    );

    if (url) {
      return {
        kind: 'redirect' as const,
        url,
      };
    }

    return {
      kind: 'buffer' as const,
      fileName: file.fileName,
      mimeType: file.mimeType ?? 'application/octet-stream',
      buffer: this.storage.readLocal(file.storageKey),
    };
  }

  async download(
    userId: string,
    accessId: string,
    fileId: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { userId },
    });

    const access = await this.prisma.access.findUnique({
      where: { id: accessId },
    });

    if (
      !customer ||
      !access ||
      access.customerId !== customer.id ||
      access.status !== 'ACTIVE'
    ) {
      throw new ForbiddenException('Acesso negado.');
    }

    const file = await this.prisma.productFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.productId !== access.productId) {
      throw new NotFoundException('Arquivo não encontrado.');
    }

    const url = await this.storage.createDownloadUrl(
      file.storageKey,
      file.fileName,
    );

    if (url) {
      return {
        kind: 'redirect' as const,
        url,
      };
    }

    return {
      kind: 'buffer' as const,
      fileName: file.fileName,
      mimeType: file.mimeType ?? 'application/octet-stream',
      buffer: this.storage.readLocal(file.storageKey),
    };
  }
}