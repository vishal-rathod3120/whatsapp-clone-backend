import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator, PrismaHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private prisma: PrismaService,
    private memory: MemoryHealthIndicator,
    private redis: RedisService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check application health status' })
  check() {
    return this.health.check([
      // Database health
      () => this.prismaIndicator.pingCheck('database', this.prisma),
      
      // Memory usage (limit to 1GB for this check)
      () => this.memory.checkHeap('memory_heap', 1024 * 1024 * 1024),
      
      // Custom Redis check
      async () => {
        const isRedisUp = await this.redis.ping();
        return {
          redis: {
            status: isRedisUp ? 'up' : 'down',
          },
        };
      },
    ]);
  }
}
