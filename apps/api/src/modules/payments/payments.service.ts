import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { PagarmeProvider } from './providers/pagarme.provider';
import { MockPaymentProvider } from './providers/mock.provider';
import { SplitRule } from './providers/payment-provider.interface';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly pagarme: PagarmeProvider,
    private readonly mock: MockPaymentProvider,
  ) {}

  provider() {
    return this.config.get('PAYMENT_PROVIDER', 'mock') === 'pagarme'
      ? this.pagarme
      : this.mock;
  }

  async onboardRecipient(
    userId: string,
    input: {
      provider: string;
      registerInformation: Record<string, unknown>;
      defaultBankAccount: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    },
  ) {
    if (input.provider !== 'pagarme') {
      throw new BadRequestException(
        'Provider de recebimento não suportado.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        paymentAccount: true,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Usuário não encontrado.',
      );
    }

    if (
      !user.roles.includes('PRODUCER') &&
      !user.roles.includes('AFFILIATE')
    ) {
      throw new BadRequestException(
        'Usuário precisa ser produtor ou afiliado.',
      );
    }

    if (user.paymentAccount?.externalRecipientId) {
      const recipient = await this.pagarme.getRecipient(
        user.paymentAccount.externalRecipientId,
      );

      await this.prisma.paymentAccount.update({
        where: { userId },
        data: {
          status: recipient.status as any,
          metadata: {
            ...((user.paymentAccount.metadata as object) ?? {}),
            kycStatus: recipient.kycStatus,
            kycStatusReason: recipient.kycStatusReason,
          },
        },
      });

      return {
        recipientId: recipient.id,
        status: recipient.status,
        kycStatus: recipient.kycStatus,
        kycStatusReason: recipient.kycStatusReason,
      };
    }

    const recipient = await this.pagarme.createRecipient({
      code: `tz_${user.id}`,
      registerInformation: input.registerInformation,
      defaultBankAccount: input.defaultBankAccount,
      metadata: {
        userId: user.id,
        ...Object.fromEntries(
          Object.entries(input.metadata ?? {}).map(([k, v]) => [
            k,
            String(v),
          ]),
        ),
      },
    });

    await this.prisma.paymentAccount.upsert({
      where: { userId },
      create: {
        userId,
        provider: 'pagarme',
        externalRecipientId: recipient.id,
        status: recipient.status as any,
        metadata: {
          kycStatus: recipient.kycStatus,
          kycStatusReason: recipient.kycStatusReason,
        },
      },
      update: {
        provider: 'pagarme',
        externalRecipientId: recipient.id,
        status: recipient.status as any,
        metadata: {
          kycStatus: recipient.kycStatus,
          kycStatusReason: recipient.kycStatusReason,
        },
      },
    });

    return {
      recipientId: recipient.id,
      status: recipient.status,
      kycStatus: recipient.kycStatus,
      kycStatusReason: recipient.kycStatusReason,
    };
  }

  async getRecipientStatus(userId: string) {
    const account = await this.prisma.paymentAccount.findUnique({
      where: { userId },
    });

    if (!account?.externalRecipientId) {
      throw new BadRequestException(
        'Nenhum recebedor Pagar.me cadastrado.',
      );
    }

    const recipient = await this.pagarme.getRecipient(
      account.externalRecipientId,
    );

    await this.prisma.paymentAccount.update({
      where: { userId },
      data: {
        status: recipient.status as any,
        metadata: {
          ...((account.metadata as object) ?? {}),
          kycStatus: recipient.kycStatus,
          kycStatusReason: recipient.kycStatusReason,
        },
      },
    });

    return {
      recipientId: recipient.id,
      status: recipient.status,
      kycStatus: recipient.kycStatus,
      kycStatusReason: recipient.kycStatusReason,
    };
  }

  async createKycLink(userId: string) {
    const account = await this.prisma.paymentAccount.findUnique({
      where: { userId },
    });

    if (!account?.externalRecipientId) {
      throw new BadRequestException(
        'Crie o recebedor antes de iniciar o KYC.',
      );
    }

    const result = await this.pagarme.createKycLink(
      account.externalRecipientId,
    );

    return {
      url: result.url,
      expirationDate: result.expirationDate,
      base64: result.base64,
    };
  }

  async createForOrder(
    orderId: string,
    paymentMethod: 'pix' | 'credit_card',
    cardToken?: string,
    billingAddress?: Record<string, unknown>,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        product: {
          include: {
            producer: true,
            affiliatePrograms: true,
          },
        },
        affiliateLink: {
          include: {
            affiliate: true,
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestException(
        'Pedido não encontrado.',
      );
    }

    const producerAccount =
      await this.prisma.paymentAccount.findUnique({
        where: {
          userId: order.product.producerId,
        },
      });

    const split: SplitRule[] = [];

    const platformRecipient = this.config.get<string>(
      'PAGARME_PLATFORM_RECIPIENT_ID',
    );

    if (producerAccount?.externalRecipientId) {
      const program =
        order.product.affiliatePrograms[0];

      const commission =
        program && order.affiliateLink
          ? this.calculateCommission(
              order.total,
              program.commissionType,
              program.commissionValue,
            )
          : 0;

      const platformFee = Math.max(
        0,
        order.total -
          commission -
          (order.total - commission),
      );

      const producerAmount =
        order.total - commission;

      split.push({
        recipientId:
          producerAccount.externalRecipientId,
        amount: producerAmount,
        type: 'flat',
        liable: true,
      });

      if (
        commission > 0 &&
        order.affiliateLink?.affiliate
      ) {
        const affiliateAccount =
          await this.prisma.paymentAccount.findUnique({
            where: {
              userId:
                order.affiliateLink.affiliate.userId,
            },
          });

        if (
          affiliateAccount?.externalRecipientId
        ) {
          split.push({
            recipientId:
              affiliateAccount.externalRecipientId,
            amount: commission,
            type: 'flat',
            liable: false,
          });
        }
      }

      if (platformRecipient) {
        void platformFee;
      }
    }

    const result =
      await this.provider().createPayment({
        orderId,
        code: order.id,
        amount: order.total,
        customer: {
          name: order.customer.name,
          email: order.customer.email,
          document:
            order.customer.document ??
            undefined,
        },
        paymentMethod,
        cardToken,
        billingAddress,
        split,
        metadata: {
          orderId,
        },
      });

    return this.prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        provider: this.config.get(
          'PAYMENT_PROVIDER',
          'mock',
        ),
        providerPaymentId: result.id,
        amount: order.total,
        method: paymentMethod,
        status: 'PENDING',
      },
      update: {
        providerPaymentId: result.id,
        method: paymentMethod,
        amount: order.total,
      },
    });
  }

  calculateCommission(
    total: number,
    type: string,
    value: number,
  ) {
    if (type === 'PERCENTAGE') {
      return Math.floor(
        (total * value) / 100,
      );
    }

    return Math.min(
      total,
      value,
    );
  }

  async confirm(paymentId: string) {
    const payment =
      await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

    if (!payment) {
      throw new BadRequestException(
        'Pagamento não encontrado.',
      );
    }

    if (payment.status === PaymentStatus.PAID) {
      return payment;
    }

    const provider = this.provider();

    const result =
      await provider.getPayment?.(
        payment.providerPaymentId ?? '',
      );

    if (
      result &&
      ['paid', 'captured', 'succeeded'].includes(
        String(
          (result as any).status ?? '',
        ).toLowerCase(),
      )
    ) {
      return this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });
    }

    if (this.config.get('PAYMENT_PROVIDER', 'mock') === 'mock') {
      return this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });
    }

    throw new BadRequestException(
      'Pagamento ainda não foi confirmado pelo provider.',
    );
  }

  async handleWebhook(
    providerName: string,
    rawBody: Buffer,
    signature: string | undefined,
    payload: any,
  ) {
    const provider =
      providerName === 'pagarme'
        ? this.pagarme
        : this.mock;

    if (!provider.verifyWebhook(rawBody, signature)) {
      throw new BadRequestException(
        'Assinatura do webhook inválida.',
      );
    }

    const parsed = provider.parseWebhook(payload) as any;

    if (!parsed.id) {
      throw new BadRequestException(
        'Webhook sem identificador.',
      );
    }

    const existing =
      await this.prisma.webhookEvent.findUnique({
        where: {
          provider_externalEventId: {
            provider: providerName,
            externalEventId: parsed.id,
          },
        },
      });

    if (existing?.status === 'PROCESSED') {
      return {
        ok: true,
        duplicate: true,
      };
    }

    const event =
      existing ??
      (await this.prisma.webhookEvent.create({
        data: {
          provider: providerName,
          externalEventId: parsed.id,
          eventType: parsed.type,
          payload,
          status: 'RECEIVED',
        },
      }));

    if (
      parsed.recipientId &&
      /recipient\.updated|recipient_updated/i.test(
        parsed.type,
      )
    ) {
      const account =
        await this.prisma.paymentAccount.findFirst({
          where: {
            externalRecipientId:
              parsed.recipientId,
          },
        });

      if (account) {
        await this.prisma.paymentAccount.update({
          where: {
            id: account.id,
          },
          data: {
            status:
              (parsed.recipientStatus ??
                account.status) as any,
            metadata: {
              ...((account.metadata as object) ??
                {}),
              kycStatus:
                parsed.kycStatus,
              kycStatusReason:
                parsed.kycStatusReason,
            },
          },
        });
      }

      await this.prisma.webhookEvent.update({
        where: {
          id: event.id,
        },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });

      return {
        ok: true,
        duplicate: false,
        recipientUpdated:
          Boolean(account),
      };
    }

    if (parsed.paymentId) {
      const payment =
        await this.prisma.payment.findFirst({
          where: {
            provider: providerName,
            providerPaymentId:
              parsed.paymentId,
          },
        });

      if (payment) {
        const paid =
          [
            'paid',
            'captured',
            'succeeded',
          ].includes(
            (
              parsed.status ?? ''
            ).toLowerCase(),
          ) ||
          /paid|captur|succeed/i.test(
            parsed.type,
          );

        const normalized =
          (
            parsed.status ?? ''
          ).toLowerCase();

        const chargeback =
          normalized === 'chargedback' ||
          /chargeback/i.test(
            parsed.type,
          );

        const refunded =
          normalized === 'refunded' ||
          /refund/i.test(
            parsed.type,
          );

        const failed = [
          'failed',
          'canceled',
        ].includes(normalized);

        await this.prisma.$transaction(
          async (tx) => {
            if (paid) {
              const p =
                await tx.payment.update({
                  where: {
                    id: payment.id,
                  },
                  data: {
                    status:
                      'PAID',
                    paidAt:
                      new Date(),
                  },
                });

              const order =
                await tx.order.update({
                  where: {
                    id: p.orderId,
                  },
                  data: {
                    status:
                      'PAID',
                  },
                });

              const product =
                await tx.product.findUniqueOrThrow(
                  {
                    where: {
                      id: order.productId,
                    },
                  },
                );

              const affiliateId =
                order.affiliateLinkId
                  ? (
                      await tx.affiliateLink.findUnique(
                        {
                          where: {
                            id: order.affiliateLinkId,
                          },
                        },
                      )
                    )?.affiliateId
                  : undefined;

              const sale =
                await tx.sale.upsert({
                  where: {
                    orderId: order.id,
                  },
                  create: {
                    orderId: order.id,
                    productId:
                      product.id,
                    producerId:
                      product.producerId,
                    affiliateId,
                    affiliateLinkId:
                      order.affiliateLinkId,
                    amount:
                      order.total,
                    status:
                      'APPROVED',
                  },
                  update: {
                    status:
                      'APPROVED',
                  },
                });

              if (affiliateId) {
                const program =
                  await tx.affiliateProgram.findUnique(
                    {
                      where: {
                        productId:
                          order.productId,
                      },
                    },
                  );

                if (
                  program &&
                  !(await tx.commission.findUnique(
                    {
                      where: {
                        saleId:
                          sale.id,
                      },
                    },
                  ))
                ) {
                  const amount =
                    program.commissionType ===
                    'PERCENTAGE'
                      ? Math.floor(
                          (
                            order.total *
                            program.commissionValue
                          ) / 100,
                        )
                      : Math.min(
                          order.total,
                          program.commissionValue,
                        );

                  if (amount > 0) {
                    await tx.commission.create({
                      data: {
                        orderId:
                          order.id,
                        saleId:
                          sale.id,
                        affiliateId,
                        amount,
                        status:
                          'PENDING',
                      },
                    });
                  }
                }
              }

              await tx.access.upsert({
                where: {
                  orderId: order.id,
                },
                create: {
                  orderId: order.id,
                  customerId:
                    order.customerId,
                  productId:
                    order.productId,
                },
                update: {
                  status:
                    'ACTIVE',
                },
              });
            } else if (chargeback) {
              await tx.payment.update({
                where: {
                  id: payment.id,
                },
                data: {
                  status:
                    'CHARGEBACK',
                },
              });

              await tx.order.update({
                where: {
                  id: payment.orderId,
                },
                data: {
                  status:
                    'REFUNDED',
                },
              });

              await tx.access.updateMany({
                where: {
                  orderId:
                    payment.orderId,
                },
                data: {
                  status:
                    'REVOKED',
                },
              });

              await tx.dispute.upsert({
                where: {
                  providerDisputeId:
                    parsed.id,
                },
                create: {
                  paymentId:
                    payment.id,
                  providerDisputeId:
                    parsed.id,
                  status:
                    'OPEN',
                  amount:
                    payment.amount,
                  reason:
                    parsed.type,
                },
                update: {
                  status:
                    'OPEN',
                },
              });
            } else if (refunded) {
              await tx.payment.update({
                where: {
                  id: payment.id,
                },
                data: {
                  status:
                    'REFUNDED',
                },
              });

              await tx.order.update({
                where: {
                  id: payment.orderId,
                },
                data: {
                  status:
                    'REFUNDED',
                },
              });

              await tx.access.updateMany({
                where: {
                  orderId:
                    payment.orderId,
                },
                data: {
                  status:
                    'REVOKED',
                },
              });
            } else if (failed) {
              await tx.payment.update({
                where: {
                  id: payment.id,
                },
                data: {
                  status:
                    'FAILED',
                },
              });
            }

            await tx.webhookEvent.update({
              where: {
                id: event.id,
              },
              data: {
                status:
                  'PROCESSED',
                processedAt:
                  new Date(),
              },
            });
          },
        );
      }
    } else {
      await this.prisma.webhookEvent.update({
        where: {
          id: event.id,
        },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });
    }

    return {
      ok: true,
      duplicate: false,
    };
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string,
    requestedByUserId?: string,
  ) {
    void requestedByUserId;

    const payment =
      await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

    if (!payment) {
      throw new BadRequestException(
        'Pagamento não encontrado.',
      );
    }

    if (!payment.providerPaymentId) {
      throw new BadRequestException(
        'Pagamento sem ID externo.',
      );
    }

    const provider = this.provider();

    const result =
      await provider.refundPayment?.(
        payment.providerPaymentId,
        amount,
      );

    if (!result) {
      throw new BadRequestException(
        'Provider não suporta reembolso.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const refund =
          await tx.refund.create({
            data: {
              paymentId,
              amount:
                amount ?? payment.amount,
              reason,
              providerRefundId:
                result.id,
              status:
                'REFUNDED',
            },
          });

        await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status:
              PaymentStatus.REFUNDED,
          },
        });

        await tx.order.update({
          where: {
            id: payment.orderId,
          },
          data: {
            status:
              OrderStatus.REFUNDED,
          },
        });

        await tx.access.updateMany({
          where: {
            orderId:
              payment.orderId,
          },
          data: {
            status:
              'REVOKED',
          },
        });

        await tx.financialEntry.create({
          data: {
            paymentId,
            orderId:
              payment.orderId,
            type:
              'REFUND',
            amount: -(
              amount ??
              payment.amount
            ),
          },
        });

        return refund;
      },
    );
  }

  async reconcile(
    providerPaymentId: string,
  ) {
    const payment =
      await this.prisma.payment.findFirst({
        where: {
          providerPaymentId,
        },
      });

    if (!payment) {
      throw new BadRequestException(
        'Pagamento local não encontrado.',
      );
    }

    const remote =
      await this.provider().getPayment?.(
        providerPaymentId,
      );

    if (!remote) {
      throw new BadRequestException(
        'Provider não suporta consulta.',
      );
    }

    return {
      local: payment,
      remote,
    };
  }
}