import {
  Controller,
  Get,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { DeliveryService } from './delivery.service';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Get('mine')
  mine(@Req() req: any) {
    return this.service.mine(req.user.id);
  }

  @Public()
  @Get('access/:token')
  access(@Param('token') token: string) {
    return this.service.getByToken(token);
  }

  @Public()
  @Get('access/:token/files/:fileId')
  async publicFile(
    @Param('token') token: string,
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const result = await this.service.downloadByToken(token, fileId);

    if (result.kind === 'redirect') {
      return res.redirect(result.url);
    }

    res.setHeader(
      'Content-Type',
      result.mimeType,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName.replace(/"/g, '')}"`,
    );

    return res.send(result.buffer);
  }

  @Get(':accessId/files/:fileId')
  async file(
    @Req() req: any,
    @Param('accessId') accessId: string,
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const result = await this.service.download(
      req.user.id,
      accessId,
      fileId,
    );

    if (result.kind === 'redirect') {
      return res.redirect(result.url);
    }

    res.setHeader(
      'Content-Type',
      result.mimeType,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName.replace(/"/g, '')}"`,
    );

    return res.send(result.buffer);
  }
}