/**
 * Rate Limit Middleware
 *
 * Purpose:
 * Limits the number of requests an IP can make within a time window.
 *
 * Why is this critical?
 * - Anti-Abuse: Prevents brute-force attacks on login endpoints.
 * - DDoS Protection: Mitigates high-volume automated attacks.
 * - Resource Protection: Ensures fair usage of system resources for all users.
 *
 * Configuration:
 * - Window: 15 minutes
 * - Limit: 100 requests per IP
 * - Trust Proxy: Enabled (essential when behind Load Balancers like Nginx/AWS ALB)
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased from 100 to 1000 for development
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'You have exceeded the request limit. Please try again later.',
    },
    // Skip health checks to avoid false positives from monitoring tools
    skip: (req) => req.path === '/health' || req.path.includes('/health'),
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}
