import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaymentAccountDto } from './dto/payment-account.dto';
import { PaymentAccountOnboardDto } from './dto/payment-account-onboard.dto';
import { PaymentsService } from '../payments/payments.service';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService, private readonly payments: PaymentsService) {}

  @Roles(UserRole.PRODUCER, UserRole.AFFILIATE)
  @Post('me/payment-account')
  async paymentAccount(@Req() req: any, @Body() body: PaymentAccountDto) {
    return this.users.savePaymentAccount(req.user.id, body.provider, body.externalRecipientId, body.status);
  }


  @Roles(UserRole.PRODUCER, UserRole.AFFILIATE)
  @Post('me/payment-account/onboard')
  async onboard(@Req() req: any, @Body() body: PaymentAccountOnboardDto) {
    return this.payments.onboardRecipient(req.user.id, body);
  }

  @Roles(UserRole.PRODUCER, UserRole.AFFILIATE)
  @Get('me/payment-account/status')
  async status(@Req() req: any) {
    return this.payments.getRecipientStatus(req.user.id);
  }

  @Roles(UserRole.PRODUCER, UserRole.AFFILIATE)
  @Post('me/payment-account/kyc-link')
  async kycLink(@Req() req: any) {
    return this.payments.createKycLink(req.user.id);
  }

  @Post('me/producer')
  async becomeProducer(@Req() req: any) {
    return this.users.addRole(req.user.id, UserRole.PRODUCER);
  }
}
