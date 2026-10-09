import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { StorageModule } from '../storage/storage.module';

@Module({ imports: [StorageModule], providers: [DeliveryService], controllers: [DeliveryController], exports: [DeliveryService] })
export class DeliveryModule {}
