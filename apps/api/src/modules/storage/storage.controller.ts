import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { StorageService } from './storage.service';

@Controller('files')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Public()
  @Get('health')
  health() {
    return { provider: this.storage.getProvider(), ready: true };
  }
}
