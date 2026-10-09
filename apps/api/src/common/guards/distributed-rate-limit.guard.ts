import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RedisService } from '../../modules/redis/redis.service';
@Injectable()
export class DistributedRateLimitGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<any>();
    const ip = String(req.ip || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    const route = String(req.route?.path || req.path || 'unknown');
    const key = `rl:${ip}:${route}`.replace(/[^a-zA-Z0-9:_-]/g,'_');
    try { const n = await this.redis.incr(key,60); return n <= 120; } catch { return process.env.NODE_ENV !== 'production'; }
  }
}
