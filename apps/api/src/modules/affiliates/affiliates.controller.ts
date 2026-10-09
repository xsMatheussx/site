import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AffiliatesService } from './affiliates.service';
@Controller('affiliates') export class AffiliatesController { constructor(private s:AffiliatesService){}
 @Roles(UserRole.AFFILIATE,UserRole.BUYER,UserRole.PRODUCER,UserRole.ADMIN) @Post('enable') enable(@Req()r:any){return this.s.enable(r.user.id,r.user.roles)}
 @Public() @Get('opportunities') opportunities(){return this.s.opportunities()}
 @Roles(UserRole.PRODUCER,UserRole.ADMIN) @Post('programs/:productId') program(@Param('productId')p:string,@Req()r:any,@Body()b:any){return this.s.createProgram(p,r.user.id,r.user.roles,b.commissionType,b.commissionValue,b.approvalMode,b.rules)}
 @Roles(UserRole.AFFILIATE,UserRole.ADMIN) @Post('programs/:programId/apply') apply(@Param('programId')p:string,@Req()r:any){return this.s.apply(p,r.user.id,r.user.roles)}
 @Roles(UserRole.AFFILIATE,UserRole.ADMIN) @Post('programs/:programId/link') link(@Param('programId')p:string,@Req()r:any){return this.s.createLink(p,r.user.id,r.user.roles)}
 @Roles(UserRole.AFFILIATE,UserRole.ADMIN) @Get('links') links(@Req()r:any){return this.s.myLinks(r.user.id,r.user.roles)}
 @Roles(UserRole.AFFILIATE,UserRole.ADMIN) @Get('sales') sales(@Req()r:any){return this.s.mySales(r.user.id,r.user.roles)}
 @Roles(UserRole.AFFILIATE,UserRole.ADMIN) @Get('commissions') commissions(@Req()r:any){return this.s.myCommissions(r.user.id,r.user.roles)}
}
