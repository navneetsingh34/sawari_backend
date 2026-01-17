# Exception Filters

This directory contains exception filters that handle errors thrown during request processing.

## Purpose

Exception filters catch exceptions and transform them into standardized HTTP responses. They ensure consistent error handling across the entire application.

## Current Filters

- **http-exception.filter.ts**: Global exception filter that catches all exceptions and returns standardized error responses

## How Exception Filters Work

1. An exception is thrown anywhere in the application (controller, service, middleware)
2. The exception bubbles up through the call stack
3. The exception filter catches it before it reaches the client
4. The filter transforms the exception into a standardized response
5. The response is sent to the client

## When to Create New Filters

Create a new exception filter when you need:
- Custom handling for specific exception types
- Different error formats for different contexts (e.g., GraphQL vs REST)
- Special logging or monitoring for certain errors

## Usage

Filters can be applied at different levels:

```typescript
// Global (in main.ts)
app.useGlobalFilters(new HttpExceptionFilter());

// Controller level
@UseFilters(HttpExceptionFilter)
export class UsersController {}

// Method level
@UseFilters(HttpExceptionFilter)
@Get()
findAll() {}
```

## Best Practices

- Keep filters focused on error transformation, not business logic
- Log errors appropriately (error level for 5xx, warn for 4xx)
- Hide sensitive information in production
- Return consistent error response format
- Include enough context for debugging
