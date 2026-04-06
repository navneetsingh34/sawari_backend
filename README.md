# RIDEXA Ride-Hailing Backend

Production-grade NestJS backend foundation for a commercial ride-hailing application.

## 🏗️ Architecture

This backend follows **Clean Architecture** principles with clear separation of concerns:

- **Config Layer**: Environment-based configuration management
- **Database Layer**: MongoDB with Mongoose ODM
- **Common Layer**: Shared utilities, filters, guards, decorators
- **Business Layer**: Domain-specific modules (to be added in future steps)

## 🚀 Features

### ✅ Implemented (Step 1)

- **Configuration Management**: Centralized config with environment variable validation
- **Database**: MongoDB connection with Mongoose, connection pooling, and error handling
- **Logging**: Winston-based structured logging with environment-specific formats
- **Exception Handling**: Global exception filter with standardized error responses
- **Security**: Helmet, CORS, rate limiting
- **Validation**: Global validation pipe with class-validator
- **API Versioning**: URI-based versioning (`/api/v1`)
- **Health Checks**: Database connectivity monitoring
- **Documentation**: Swagger/OpenAPI auto-generated docs

### 🔜 Coming Next

- Authentication & Authorization (JWT, OAuth)
- User Management (Riders & Drivers)
- Ride Management (Request, Match, Track)
- Payment Processing
- Real-time Notifications
- Location Services

## 📋 Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- npm or yarn

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

## ⚙️ Configuration

All configuration is managed through environment variables. See `.env.example` for all available options.

Key configurations:
- `NODE_ENV`: Environment (development/staging/production)
- `PORT`: Application port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `LOG_LEVEL`: Logging verbosity
- `CORS_ORIGINS`: Allowed CORS origins

## 🏃 Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## 📚 API Documentation

When `SWAGGER_ENABLED=true`, Swagger documentation is available at:
```
http://localhost:3000/api/docs
```

## 🏥 Health Check

Monitor application health:
```
GET http://localhost:3000/api/v1/health
```

Returns:
- Application status
- Database connectivity status
- Timestamp

## 📁 Project Structure

```
src/
├── common/              # Shared utilities and cross-cutting concerns
│   ├── filters/        # Exception filters
│   ├── interceptors/   # Request/response interceptors
│   ├── guards/         # Authentication & authorization guards
│   ├── decorators/     # Custom decorators
│   ├── middleware/     # Custom middleware
│   ├── utils/          # Helper functions
│   ├── constants/      # Application constants
│   ├── exceptions/     # Custom exception classes
│   └── logger/         # Logging service
├── config/             # Configuration management
├── database/           # Database connection and schemas
├── health/             # Health check endpoints
├── modules/            # Business logic modules (future)
└── main.ts            # Application entry point
```

## 🔒 Security

- **Helmet**: Security headers (XSS, clickjacking protection)
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Request throttling per IP
- **Validation**: Input validation and sanitization
- **Error Handling**: Secure error messages (no stack traces in production)

## 📝 Logging

Structured logging with Winston:
- **Development**: Pretty console output with colors
- **Production**: JSON format for log aggregation
- **Levels**: error, warn, info, http, debug
- **Context**: Each log includes timestamp, level, and context

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚢 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set strong JWT secret
4. Disable Swagger (`SWAGGER_ENABLED=false`)
5. Configure production CORS origins
6. Set appropriate log level (`info` or `warn`)

### Build

```bash
npm run build
```

### Start

```bash
npm run start:prod
```

## 📖 Code Documentation

Every file includes comprehensive comments explaining:
- **What**: What the code does
- **Why**: Architectural decisions and rationale
- **How**: How to use and extend the code
- **Future**: Extension points for future features

## 🤝 Contributing

This is a production-grade foundation. When adding new features:

1. Follow existing patterns and architecture
2. Add comprehensive comments
3. Write tests
4. Update documentation
5. Follow SOLID principles
6. Maintain clean architecture

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Built by Principal Backend Architects following enterprise standards.

---

**Note**: This is Step 1 of the implementation. Authentication and business logic modules will be added in subsequent steps.
