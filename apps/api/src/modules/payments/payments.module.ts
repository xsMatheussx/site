import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PagarmeProvider } from './providers/pagarme.provider';
import { MockPaymentProvider } from './providers/mock.provider';
@Module({ providers: [PaymentsService, PagarmeProvider, MockPaymentProvider], exports: [PaymentsService] })
export class PaymentsModule {}
