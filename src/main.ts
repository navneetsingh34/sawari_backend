/**
 * Application Bootstrap File
 *
 * This is the entry point of the NestJS application. It creates and configures
 * the application instance before starting the HTTP server.
 *
 * Why this configuration?
 * Each piece of configuration here serves a specific purpose for production readiness:
 *
 * 1. Global Validation Pipe:
 *    - Automatically validates all incoming requests using class-validator
 *    - Transforms plain objects to DTO class instances
 *    - Strips unknown properties for security
 *    - Returns detailed validation errors
 *
 * 2. Global Exception Filter:
 *    - Catches all exceptions and returns standardized error responses
 *    - Ensures consistent error format across the API
 *    - Logs errors appropriatelyrw
 *
 * 3. Security Middleware (Helmet):
 *    - Sets security-related HTTP headers
 *    - Protects against common web vulnerabilities
 *    - XSS protection, clickjacking prevention, etc.
 *
 * 4. CORS Configuration:
 *    - Allows cross-origin requests from specified origins
 *    - Configures allowed methods and headers
 *    - Essential for frontend-backend communication
 *
 * 5. Rate Limiting:
 *    - Prevents abuse by limiting requests per IP
 *    - Protects against DDoS attacks
 *    - Configurable per endpoint
 *
 * 6. API Versioning:
 *    - Enables URI-based versioning (/api/v1/...)
 *    - Allows multiple API versions to coexist
 *    - Facilitates backward compatibility
 *
 * 7. Swagger Documentation:
 *    - Auto-generates API documentation
 *    - Provides interactive API explorer
 *    - Disabled in production for security
 *
 * 8. Graceful Shutdown:
 *    - Handles SIGTERM and SIGINT signals
 *    - Closes connections gracefully
 *    - Prevents data loss during deployment
 *
 * Application Flow:
 * 1. Load environment variables
 * 2. Create NestJS application instance
 * 3. Apply global configurations (validation, security, etc.)
 * 4. Set up Swagger documentation (if enabled)
 * 5. Start HTTP server
 * 6. Log startup information
 *
 * Future Enhancements:
 * - Add compression middleware for response optimization
 * - Add request ID generation for distributed tracing
 * - Add metrics endpoint for Prometheus
 * - Add graceful shutdown hooks for database cleanup
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
  // Create NestJS application instance
  const app = await NestFactory.create(AppModule, {
    // Use our custom logger instead of default NestJS logger
    bufferLogs: true,
  });

  // Get configuration service to access environment variables
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  // Set custom logger
  app.useLogger(logger);

  // ============================================
  // GLOBAL VALIDATION PIPE
  // ============================================
  // Automatically validate all incoming requests using DTOs
  // This ensures data integrity before it reaches controllers
  app.useGlobalPipes(
    new ValidationPipe({
      // Transform plain objects to DTO class instances
      // Enables type coercion (e.g., '123' -> 123)
      transform: true,

      // Strip properties that don't have decorators in the DTO
      // Security: Prevents clients from sending unexpected fields
      whitelist: true,

      // Throw error if non-whitelisted properties are present
      // Strict mode: Reject requests with unknown fields
      forbidNonWhitelisted: true,

      // Transform payloads to match DTO types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ============================================
  // GLOBAL EXCEPTION FILTER
  // ============================================
  // Catch all exceptions and return standardized error responses
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // ============================================
  // GLOBAL GUARDS
  // ============================================
  // JWT Authentication Guard (protects all routes by default)
  // Use @Public() decorator to skip authentication for specific routes
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // ============================================
  // SECURITY MIDDLEWARE
  // ============================================
  // Helmet sets various HTTP headers for security
  // Protects against XSS, clickjacking, and other attacks
  app.use(helmet());

  // ============================================
  // CORS CONFIGURATION
  // ============================================
  // Enable Cross-Origin Resource Sharing
  // Allows frontend applications to communicate with this API
  const corsOrigins = configService.get<string[]>('security.corsOrigins');
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // ============================================
  // API VERSIONING
  // ============================================
  // Enable URI-based API versioning
  // Routes will be prefixed with /api/v1, /api/v2, etc.
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  const apiVersion = configService.get<string>('app.apiVersion') || 'v1';

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  // ============================================
  // SWAGGER DOCUMENTATION
  // ============================================
  // Auto-generate API documentation
  // Accessible at /api/docs in development
  const swaggerEnabled = configService.get<boolean>('swagger.enabled') || false;
  const swaggerPath = configService.get<string>('swagger.path') || 'api/docs';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('RIDEXA Ride-Hailing API')
      .setDescription(
        'Production-grade REST API for ride-hailing application. ' +
          'This API provides endpoints for user authentication, ride management, ' +
          'driver operations, payments, and more.',
      )
      .setVersion('1.0')
      .addTag('health', 'Health check endpoints')
      // Future tags:
      // .addTag('auth', 'Authentication endpoints')
      // .addTag('users', 'User management')
      // .addTag('rides', 'Ride operations')
      // .addTag('drivers', 'Driver operations')
      // .addTag('payments', 'Payment processing')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        'JWT',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, document, {
      customSiteTitle: 'RIDEXA API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });

    logger.log(
      `Swagger documentation available at: /${swaggerPath}`,
      'Bootstrap',
    );
  }

  // ============================================
  // START SERVER
  // ============================================
  const port = configService.get<number>('app.port') || 3000;
  const env = configService.get<string>('app.env') || 'development';

  // Listen on 0.0.0.0 to accept connections from outside the container
  // This is required for cloud platforms like Railway, Heroku, etc.
  await app.listen(port, '0.0.0.0');

  // Log startup information
  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`,
    'Bootstrap',
  );
  logger.log(`📚 Environment: ${env}`, 'Bootstrap');
  logger.log(
    `🏥 Health check: http://localhost:${port}/${apiPrefix}/${apiVersion}/health`,
    'Bootstrap',
  );

  if (swaggerEnabled) {
    logger.log(
      `📖 API Documentation: http://localhost:${port}/${swaggerPath}`,
      'Bootstrap',
    );
  }

  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================
  // Handle shutdown signals gracefully
  // Ensures connections are closed properly during deployment
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM signal received: closing HTTP server', 'Bootstrap');
    await app.close();
    logger.log('HTTP server closed', 'Bootstrap');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT signal received: closing HTTP server', 'Bootstrap');
    await app.close();
    logger.log('HTTP server closed', 'Bootstrap');
    process.exit(0);
  });
}

// Start the application
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
