import { Injectable } from '@nestjs/common';
import { CreatePaymentInput, PaymentProvider, ProviderPayment } from './payment-provider.interface';
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(input: CreatePaymentInput): Promise<ProviderPayment> { return { id: `mock_${input.orderId}`, status: 'pending', raw: { mock: true } }; }
  verifyWebhook(): boolean { return true; }
  parseWebhook(payload: any) { return { id: String(payload?.id ?? ''), type: String(payload?.type ?? 'unknown'), paymentId: payload?.paymentId ? String(payload.paymentId) : undefined, status: payload?.status ? String(payload.status) : undefined }; }
  async refundPayment(providerPaymentId: string, amount?: number) { return { id: `mock_ref_${providerPaymentId}`, status: 'refunded', raw: { providerPaymentId, amount } }; }
  async getPayment(providerPaymentId: string) { return { id: providerPaymentId, status: 'paid', raw: {} }; }
}
