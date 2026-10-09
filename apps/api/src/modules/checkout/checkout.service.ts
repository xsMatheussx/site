import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { DeliveryService } from '../delivery/delivery.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly delivery: DeliveryService,
  ) {}

  async quote(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        offers: {
          where: { status: 'ACTIVE' },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!product || product.status !== 'PUBLISHED') {
      throw new NotFoundException('Produto não encontrado.');
    }

    const now = new Date();

    const offer = product.offers.find(
      (item) =>
        (!item.startsAt || item.startsAt <= now) &&
        (!item.endsAt || item.endsAt >= now),
    );

    if (!offer) {
      throw new BadRequestException('Produto sem oferta ativa.');
    }

    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        coverUrl: product.coverUrl,
      },
      offer,
    };
  }

  async create(
    userId: string | undefined,
    body: any,
  ) {
    const quote = await this.quote(body.slug);

    let customer = userId
      ? await this.prisma.customer.findFirst({
          where: { userId },
        })
      : null;

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          userId,
          name: body.name,
          email: body.email,
          document: body.document,
        },
      });
    }

    const link = body.affiliateCode
      ? await this.prisma.affiliateLink.findUnique({
          where: { code: body.affiliateCode },
        })
      : null;

    if (body.affiliateCode && !link) {
      throw new BadRequestException(
        'Link de afiliado inválido.',
      );
    }

    const order = await this.prisma.order.create({
      data: {
        customerId: customer.id,
        productId: quote.product.id,
        offerId: quote.offer.id,
        affiliateLinkId: link?.id,
        amount: quote.offer.price,
        subtotal: quote.offer.price,
        discount: 0,
        total: quote.offer.price,
        status: OrderStatus.AWAITING_PAYMENT,
      },
    });

    const method =
      (body.method || 'pix')
        .toString()
        .toLowerCase() === 'credit_card'
        ? 'credit_card'
        : 'pix';

    const payment = await this.payments.createForOrder(
      order.id,
      method,
      body.cardToken,
      body.billingAddress,
    );

    return {
      orderId: order.id,
      payment,
    };
  }

  async confirm(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        customer: true,
        product: true,
        affiliateLink: {
          include: {
            affiliate: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Pedido não encontrado.',
      );
    }

    if (!order.payment) {
      throw new BadRequestException(
        'Pagamento inexistente.',
      );
    }

    const paid = await this.payments.confirm(
      order.payment.id,
    );

    const sale = await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.sale.findUnique({
          where: { orderId },
        });

        if (existing) {
          return existing;
        }

        const affiliateId =
          order.affiliateLink?.affiliateId;

        const createdSale = await tx.sale.create({
          data: {
            orderId,
            productId: order.productId,
            producerId: order.product.producerId,
            affiliateId,
            affiliateLinkId: order.affiliateLinkId,
            amount: order.total,
            status: 'APPROVED',
          },
        });

        if (affiliateId) {
          const program =
            await tx.affiliateProgram.findUnique({
              where: {
                productId: order.productId,
              },
            });

          if (program) {
            const commissionAmount =
              program.commissionType === 'PERCENTAGE'
                ? Math.floor(
                    (order.total *
                      program.commissionValue) /
                      100,
                  )
                : Math.min(
                    order.total,
                    program.commissionValue,
                  );

            if (commissionAmount > 0) {
              await tx.commission.create({
                data: {
                  orderId: order.id,
                  saleId: createdSale.id,
                  affiliateId,
                  amount: commissionAmount,
                  status: 'PENDING',
                },
              });
            }
          }
        }

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PAID,
          },
        });

        return createdSale;
      },
    );

    const access = await this.delivery.grant(
      orderId,
    );

    return {
      paid,
      sale,
      accessId: access.access.id,
      accessToken: access.accessToken,
      accessUrl:
        `/access?token=${encodeURIComponent(
          access.accessToken,
        )}`,
    };
  }
}