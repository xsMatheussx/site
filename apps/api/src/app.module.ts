import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { FinanceModule } from './modules/finance/finance.module';
import { CardsModule } from './modules/cards/cards.module';
import { RedisModule } from './modules/redis/redis.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { AccountModule } from './modules/account/account.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { ProductsModule } from './modules/products/products.module';
import { OffersModule } from './modules/offers/offers.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AffiliatesModule } from './modules/affiliates/affiliates.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { StorageModule } from './modules/storage/storage.module';
import { AdminModule } from './modules/admin/admin.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { DistributedRateLimitGuard } from './common/guards/distributed-rate-limit.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, HealthModule, ProductsModule, OffersModule, UsersModule, AuthModule, AffiliatesModule, CheckoutModule, PaymentsModule, DeliveryModule, StorageModule, AdminModule, FinanceModule, CardsModule, RedisModule, ObservabilityModule, AccountModule, WebhooksModule],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: DistributedRateLimitGuard },
  ],
})
export class AppModule {}
