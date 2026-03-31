import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('messages_sent_total')
    public readonly messagesSent: Counter<string>,
    @InjectMetric('active_connections')
    public readonly activeConnections: Gauge<string>,
    @InjectMetric('http_request_duration_seconds')
    public readonly httpRequestDuration: Histogram<string>,
  ) {}

  incrementMessagesSent() {
    this.messagesSent.inc();
  }

  updateActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  recordHttpRequestDuration(method: string, route: string, duration: number) {
    this.httpRequestDuration.labels(method, route).observe(duration);
  }
}
