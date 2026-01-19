/**
 * Health Check Controller
 *
 * This controller provides health check endpoints for monitoring the application
 * and its dependencies. Essential for production deployments with load balancers,
 * container orchestration (Kubernetes), and monitoring systems.
 *
 * Why health checks?
 * - Load balancers: Determine if instance should receive traffic
 * - Auto-scaling: Trigger scaling based on health status
 * - Monitoring: Alert when services are degraded
 * - Deployment: Verify successful deployment before routing traffic
 * - Debugging: Quick way to check if app and dependencies are working
 *
 * Health Check Types:
 * 1. Liveness: Is the application running? (basic check)
 * 2. Readiness: Is the application ready to serve traffic? (includes dependencies)
 *
 * This endpoint checks:
 * - Application status (is the process running?)
 * - Database connectivity (can we connect to MongoDB?)
 * - Memory usage (future: add memory health indicator)
 * - Disk space (future: add disk health indicator)
 *
 * Response Format:
 * {
 *   "status": "ok" | "error",
 *   "info": {
 *     "database": { "status": "up" },
 *     "app": { "status": "up" }
 *   },
 *   "timestamp": "2024-01-17T00:00:00.000Z"
 * }
 *
 * Usage in production:
 * - Kubernetes liveness probe: GET /api/v1/health
 * - Kubernetes readiness probe: GET /api/v1/health
 * - Load balancer health check: GET /api/v1/health
 * - Monitoring dashboard: Poll /api/v1/health every 30s
 *
 * Future enhancements:
 * - Add Redis health check (when caching is added)
 * - Add external API health checks (payment gateway, maps API)
 * - Add custom health indicators (queue depth, error rate)
 * - Add detailed metrics endpoint (/metrics for Prometheus)
 */

import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: MongooseHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  /**
   * Health check endpoint
   * Returns the health status of the application and its dependencies
   *
   * @returns Health check result with status of all components
   */
  @Public()
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Check MongoDB connection
      () => this.db.pingCheck('database'),

      // Check Memory Usage (Heap)
      // Alert if heap usage exceeds 300MB
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }
}
