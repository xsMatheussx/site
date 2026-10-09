import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Public()
  @Get('quote/:slug')
  quote(@Param('slug') slug: string) {
    return this.checkoutService.quote(slug);
  }

  @Public()
  @Post('orders')
  create(@Req() req: any, @Body() body: any) {
    return this.checkoutService.create(req.user?.id, body);
  }

  @Public()
  @Post('orders/:orderId/confirm')
  confirm(@Param('orderId') orderId: string) {
    return this.checkoutService.confirm(orderId);
  }
}