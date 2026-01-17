# Common Module

This directory contains cross-cutting concerns and utilities that are used throughout the application.

## Purpose

The `common` directory houses code that doesn't belong to any specific business domain but is needed across multiple modules. This promotes code reuse and maintains a clean separation of concerns.

## Subdirectories

- **filters/**: Exception filters for error handling
- **interceptors/**: Request/response transformation and logging
- **guards/**: Authentication and authorization guards
- **decorators/**: Custom parameter and metadata decorators
- **middleware/**: Request processing middleware
- **utils/**: Helper functions and utilities
- **constants/**: Application-wide constants and enums
- **exceptions/**: Custom exception classes
- **logger/**: Logging service and configuration

## When to Add Code Here

Add code to `common` when:
- It's used by multiple modules
- It's not specific to any business domain
- It provides infrastructure-level functionality
- It's a reusable utility or helper

## Examples

- Custom decorators: `@CurrentUser()`, `@Roles()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Interceptors: `TransformInterceptor`, `TimeoutInterceptor`
- Utilities: Date formatting, string manipulation, validation helpers
- Constants: Error codes, status enums, configuration keys
