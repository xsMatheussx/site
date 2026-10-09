import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { OffersModule } from '../offers/offers.module';
import { StorageModule } from '../storage/storage.module';

@Module({ imports: [OffersModule, StorageModule], controllers: [ProductsController], providers: [ProductsService], exports: [ProductsService] })
export class ProductsModule {}
