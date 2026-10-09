export type SplitRule = { recipientId: string; amount: number; type: 'flat' | 'percentage'; liable?: boolean; chargeProcessingFee?: boolean; chargeRemainderFee?: boolean };

export type CreatePaymentInput = {
  orderId: string;
  code: string;
  amount: number;
  customer: { name: string; email: string; document?: string };
  paymentMethod: 'pix' | 'credit_card';
  cardToken?: string;
  billingAddress?: Record<string, unknown>;
  split?: SplitRule[];
  metadata?: Record<string, string>;
};

export type ProviderPayment = { id: string; status: string; raw: unknown };

export type CreateRecipientInput = {
  code: string;
  registerInformation: Record<string, unknown>;
  defaultBankAccount: Record<string, unknown>;
  metadata?: Record<string, string>;
};

export type ProviderRecipient = {
  id: string;
  status: string;
  kycStatus?: string;
  kycStatusReason?: string;
  raw: unknown;
};

export type ProviderKycLink = { url: string; expirationDate?: string; base64?: string; raw: unknown };

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<ProviderPayment>;
  refundPayment?(providerPaymentId: string, amount?: number): Promise<{ id?: string; status: string; raw: unknown }>;
  getPayment?(providerPaymentId: string): Promise<ProviderPayment>;
  createRecipient?(input: CreateRecipientInput): Promise<ProviderRecipient>;
  getRecipient?(recipientId: string): Promise<ProviderRecipient>;
  createKycLink?(recipientId: string): Promise<ProviderKycLink>;
  verifyWebhook(rawBody: Buffer, signature?: string): boolean;
  parseWebhook(payload: any): { id: string; type: string; paymentId?: string; status?: string; recipientId?: string; recipientStatus?: string; kycStatus?: string; kycStatusReason?: string };
}
