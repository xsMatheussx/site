import { Injectable } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
@Injectable()
export class WebhooksService {
  constructor(private readonly payments: PaymentsService) {}
  receive(provider: string, rawBody: Buffer, signature: string | undefined, payload: any) { return this.payments.handleWebhook(provider, rawBody, signature, payload); }
}
