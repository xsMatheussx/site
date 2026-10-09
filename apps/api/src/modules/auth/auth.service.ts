import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../database/prisma.service';
import { AccountService } from '../account/account.service';

const REFRESH_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly users: UsersService, private readonly jwt: JwtService, private readonly account: AccountService) {}

  private sanitize(user: any) { return { id: user.id, email: user.email, status: user.status, roles: user.roles, profile: user.profile }; }
  private hashRefresh(token: string) { return createHash('sha256').update(token).digest('hex'); }

  async register(email: string, password: string, name: string) {
    const user = await this.users.create(email, password, name, [UserRole.BUYER]);
    const verificationToken = await this.account.createEmailVerification(user.id);
    return { ...(await this.issueTokens(user)), verificationToken: process.env.NODE_ENV === 'production' ? undefined : verificationToken };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !(await this.users.verifyPassword(user.passwordHash, password)) || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    return this.issueTokens(user);
  }

  async issueTokens(user: any) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, roles: user.roles });
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 86400000);
    await this.prisma.refreshSession.create({ data: { userId: user.id, tokenHash: this.hashRefresh(refreshToken), expiresAt } });
    return { accessToken, refreshToken, user: this.sanitize(user) };
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.refreshSession.findUnique({ where: { tokenHash: this.hashRefresh(refreshToken) }, include: { user: { include: { profile: true } } } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== 'ACTIVE') throw new UnauthorizedException('Refresh token inválido.');
    await this.prisma.refreshSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(session.user);
  }

  async revoke(refreshToken: string) {
    await this.prisma.refreshSession.updateMany({ where: { tokenHash: this.hashRefresh(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  async me(userId: string) { return this.sanitize(await this.users.findById(userId)); }
}
