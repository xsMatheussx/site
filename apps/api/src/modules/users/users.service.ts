import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentAccountStatus, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(email: string, password: string, name: string, roles: UserRole[] = [UserRole.BUYER]) {
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) throw new ConflictException('E-mail já cadastrado.');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    return this.prisma.user.create({
      data: { email: normalizedEmail, passwordHash, roles, name: name.trim() },
      include: { profile: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, include: { profile: true } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { profile: true } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  async verifyPassword(hash: string, password: string) { return argon2.verify(hash, password); }

  async addRole(userId: string, role: UserRole) {
    const user = await this.findById(userId);
    if (user.roles.includes(role)) return user;
    return this.prisma.user.update({ where: { id: userId }, data: { roles: { push: role } }, include: { profile: true } });
  }

  async savePaymentAccount(userId: string, provider: string, externalRecipientId: string, status: string = 'PENDING') {
    const user = await this.findById(userId);
    if (!user.roles.includes(UserRole.PRODUCER)) throw new ConflictException('Usuário precisa estar habilitado como produtor.');
    return this.prisma.paymentAccount.upsert({ where: { userId }, create: { userId, provider, externalRecipientId, status: status as PaymentAccountStatus }, update: { provider, externalRecipientId, status: status as PaymentAccountStatus } });
  }

  async close() { await this.prisma.$disconnect(); }
}
