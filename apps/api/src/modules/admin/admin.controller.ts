import { Controller, Get, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private s: AdminService) {}
  @Roles(UserRole.ADMIN) @Get('dashboard') dashboard(@Req() r: any) { return this.s.dashboard(r.user.roles); }
  @Roles(UserRole.ADMIN) @Get('products') products(@Req() r: any) { return this.s.products(r.user.roles); }
  @Roles(UserRole.ADMIN) @Get('users') users(@Req() r: any) { return this.s.users(r.user.roles); }
  @Roles(UserRole.ADMIN) @Get('orders') orders(@Req() r: any) { return this.s.orders(r.user.roles); }
  @Roles(UserRole.ADMIN) @Get('payments') payments(@Req() r: any) { return this.s.payments(r.user.roles); }
  @Roles(UserRole.ADMIN) @Get('refunds') refunds(@Req() r: any) { return this.s.refunds(r.user.roles); }
  @Roles(UserRole.ADMIN) @Get('webhooks') webhooks(@Req() r: any) { return this.s.webhooks(r.user.roles); }
  @Roles(UserRole.ADMIN) @Get('logs') logs(@Req() r: any) { return this.s.logs(r.user.roles); }
}
