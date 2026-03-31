import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MetricsService } from '../../modules/monitoring/metrics.service';
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly metricsService;
    private readonly logger;
    constructor(metricsService: MetricsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
