import { Module, Global } from '@nestjs/common';
import { makeCounterProvider, makeGaugeProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  providers: [
    MetricsService,
    makeCounterProvider({
      name: 'messages_sent_total',
      help: 'Total number of messages sent',
    }),
    makeGaugeProvider({
      name: 'active_connections',
      help: 'Number of active WebSocket connections',
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route'],
    }),
  ],
  exports: [MetricsService],
})
export class MonitoringModule {}
