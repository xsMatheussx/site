import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private ok(r: UserRole[]) {
    if (!r.includes(UserRole.ADMIN)) throw new ForbiddenException('Admin somente.');
  }

  async dashboard(r: UserRole[]) {
    this.ok(r);
    const [users, products, orders, sales, commissions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.sale.count(),
      this.prisma.commission.aggregate({ _sum: { amount: true } }),
    ]);
    return { users, products, orders, sales, commissionTotal: commissions._sum.amount || 0 };
  }

  async products(r: UserRole[]) {
    this.ok(r);
    return this.prisma.product.findMany({
      include: { producer: { include: { profile: true } }, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' }, take: 100,
    });
  }

  async users(r: UserRole[]) {
    this.ok(r);
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, status: true, roles: true, createdAt: true, profile: true },
      orderBy: { createdAt: 'desc' }, take: 100,
    });
  }

  async orders(r: UserRole[]) {
    this.ok(r);
    return this.prisma.order.findMany({
      include: { customer: true, product: true, offer: true, payment: true, sale: true },
      orderBy: { createdAt: 'desc' }, take: 100,
    });
  }

  async payments(r: UserRole[]) {
    this.ok(r);
    return this.prisma.payment.findMany({
      include: { order: { include: { customer: true, product: true } }, refunds: true, disputes: true },
      orderBy: { createdAt: 'desc' }, take: 100,
    });
  }

  async refunds(r: UserRole[]) {
    this.ok(r);
    return this.prisma.refund.findMany({
      include: { payment: { include: { order: true } } },
      orderBy: { createdAt: 'desc' }, take: 100,
    });
  }

  async webhooks(r: UserRole[]) {
    this.ok(r);
    return this.prisma.webhookEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async logs(r: UserRole[]) {
    this.ok(r);
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
