import { Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}
  @Public()
  @Post(':provider')
  receive(@Param('provider') provider: string, @Headers('x-hub-signature') signature: string | undefined, @Req() req: Request & { rawBody?: Buffer }, @Body() body: any) {
    return this.service.receive(provider, req.rawBody ?? Buffer.from(JSON.stringify(body)), signature, body);
  }
}
