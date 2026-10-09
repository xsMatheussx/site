import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentInput, CreateRecipientInput, PaymentProvider, ProviderKycLink, ProviderPayment, ProviderRecipient } from './payment-provider.interface';

@Injectable()
export class PagarmeProvider implements PaymentProvider {
  private readonly baseUrl = 'https://api.pagar.me/core/v5';
  constructor(private readonly config: ConfigService) {}

  private authHeaders() {
    const key = this.config.get<string>('PAGARME_SECRET_KEY');
    if (!key) throw new ServiceUnavailableException('PAGARME_SECRET_KEY não configurada');
    return { Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`, 'Content-Type': 'application/json' };
  }

  async createPayment(input: CreatePaymentInput): Promise<ProviderPayment> {
    if (input.paymentMethod === 'credit_card' && !input.cardToken) {
      throw new BadRequestException('cardToken é obrigatório para pagamento com cartão.');
    }
    const payment: any = input.paymentMethod === 'pix'
      ? { payment_method: 'pix', pix: { expires_in: 3600 } }
      : { payment_method: 'credit_card', credit_card: { card_token: input.cardToken, billing_address: input.billingAddress } };
    if (input.split?.length) payment.split = input.split.map((s) => ({
      type: s.type, amount: s.amount, recipient_id: s.recipientId,
      options: { liable: s.liable ?? true, charge_processing_fee: s.chargeProcessingFee ?? false, charge_remainder_fee: s.chargeRemainderFee ?? false },
    }));
    const body = {
      code: input.code,
      items: [{ amount: input.amount, description: `TZ Store - ${input.orderId}`, quantity: 1 }],
      customer: { name: input.customer.name, email: input.customer.email, document: input.customer.document ? input.customer.document.replace(/\D/g, '') : undefined, type: input.customer.document?.replace(/\D/g, '').length === 14 ? 'company' : 'individual' },
      payments: [payment], closed: true, metadata: input.metadata ?? { orderId: input.orderId },
    };
    const response = await fetch(`${this.baseUrl}/orders`, { method: 'POST', headers: this.authHeaders(), body: JSON.stringify(body) });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new BadRequestException({ provider: 'pagarme', status: response.status, details: data });
    const charge = data?.charges?.[0];
    if (!charge?.id) throw new BadRequestException('Pagar.me não retornou charge_id');
    return { id: String(charge.id), status: String(charge.status ?? 'pending'), raw: data };
  }

  async createRecipient(input: CreateRecipientInput): Promise<ProviderRecipient> {
    const body = {
      code: input.code,
      register_information: input.registerInformation,
      default_bank_account: input.defaultBankAccount,
      metadata: input.metadata,
    };
    const response = await fetch(`${this.baseUrl}/recipients`, { method: 'POST', headers: this.authHeaders(), body: JSON.stringify(body) });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new BadRequestException({ provider: 'pagarme', status: response.status, details: data });
    return { id: String(data.id), status: String(data.status ?? 'registration'), kycStatus: data.kyc_details?.status, kycStatusReason: data.kyc_details?.status_reason, raw: data };
  }

  async getRecipient(recipientId: string): Promise<ProviderRecipient> {
    const response = await fetch(`${this.baseUrl}/recipients/${encodeURIComponent(recipientId)}`, { headers: this.authHeaders() });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new BadRequestException({ provider: 'pagarme', status: response.status, details: data });
    return { id: String(data.id), status: String(data.status ?? 'unknown'), kycStatus: data.kyc_details?.status, kycStatusReason: data.kyc_details?.status_reason, raw: data };
  }

  async createKycLink(recipientId: string): Promise<ProviderKycLink> {
    const response = await fetch(`${this.baseUrl}/recipients/${encodeURIComponent(recipientId)}/kyc_link`, { method: 'POST', headers: this.authHeaders() });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new BadRequestException({ provider: 'pagarme', status: response.status, details: data });
    return { url: String(data.url ?? ''), expirationDate: data.expiration_date ? String(data.expiration_date) : undefined, base64: data.base64 ? String(data.base64) : undefined, raw: data };
  }

  async refundPayment(providerPaymentId: string, amount?: number) {
    const body = amount ? { amount } : {};
    const response = await fetch(`${this.baseUrl}/charges/${encodeURIComponent(providerPaymentId)}/cancel`, { method: 'POST', headers: this.authHeaders(), body: JSON.stringify(body) });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new BadRequestException({ provider: 'pagarme', status: response.status, details: data });
    return { id: data?.id ? String(data.id) : undefined, status: String(data?.status ?? 'canceled'), raw: data };
  }

  async getPayment(providerPaymentId: string): Promise<ProviderPayment> {
    const response = await fetch(`${this.baseUrl}/charges/${encodeURIComponent(providerPaymentId)}`, { headers: this.authHeaders() });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new BadRequestException({ provider: 'pagarme', status: response.status, details: data });
    return { id: String(data.id), status: String(data.status ?? 'unknown'), raw: data };
  }

  verifyWebhook(rawBody: Buffer, signature?: string): boolean {
    const key = this.config.get<string>('PAGARME_WEBHOOK_SECRET') || this.config.get<string>('PAGARME_SECRET_KEY');
    if (!key || !signature) return false;
    const clean = signature.startsWith('sha1=') ? signature.slice(5) : signature;
    const expected = createHmac('sha1', key).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'utf8'); const b = Buffer.from(clean, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  parseWebhook(payload: any) {
    const id = String(payload?.id ?? payload?.event?.id ?? '');
    const type = String(payload?.type ?? payload?.event ?? payload?.name ?? 'unknown');
    const data = payload?.data ?? payload;
    const charge = data?.charge ?? data?.charges?.[0] ?? data?.data?.charge;
    const recipient = data?.recipient ?? data?.data?.recipient;
    return { id, type, paymentId: charge?.id ? String(charge.id) : undefined, status: charge?.status ? String(charge.status) : undefined, recipientId: recipient?.id ? String(recipient.id) : undefined, recipientStatus: recipient?.status ? String(recipient.status) : undefined, kycStatus: recipient?.kyc_details?.status, kycStatusReason: recipient?.kyc_details?.status_reason };
  }
}
