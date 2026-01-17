/**
 * Request ID Middleware
 *
 * Purpose:
 * Attaches a unique Correlation ID to every incoming request.
 * This ID is used in logs to trace a request's journey through the system.
 *
 * Why is this critical?
 * - Debugging: Allows filtering logs by a specific request ID to see the full sequence of events.
 * - Distributed Tracing: Can be passed to downstream services (microservices) to trace across boundaries.
 * - Support: When a user reports an error, we can look up their specific request ID.
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check if client sent an ID (e.g., from mobile app), otherwise generate one
    const requestId = req.headers['x-request-id'] || uuidv4();

    // Attach to request object for use in Guards/Interceptors
    req['id'] = requestId;

    // Attach to response headers so client knows the ID
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
