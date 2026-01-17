# Interceptors

This directory will contain interceptors for request/response transformation and cross-cutting concerns.

## Purpose

Interceptors are powerful tools that can:
- Transform the response before sending it to the client
- Transform the request before it reaches the controller
- Add extra logic before/after method execution
- Handle caching
- Add performance monitoring
- Implement retry logic

## Future Interceptors

When building out the application, you might add:

- **TransformInterceptor**: Wrap all responses in a standard format
  ```json
  {
    "success": true,
    "data": { ... },
    "timestamp": "2024-01-17T00:00:00.000Z"
  }
  ```

- **TimeoutInterceptor**: Automatically timeout long-running requests

- **CacheInterceptor**: Cache responses for improved performance

- **LoggingInterceptor**: Log request/response details

## How Interceptors Work

Interceptors use RxJS operators to transform the request/response stream:

```typescript
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

## Usage

```typescript
// Global (in main.ts)
app.useGlobalInterceptors(new TransformInterceptor());

// Controller level
@UseInterceptors(TransformInterceptor)
export class UsersController {}

// Method level
@UseInterceptors(CacheInterceptor)
@Get()
findAll() {}
```

## Best Practices

- Keep interceptors focused on a single responsibility
- Be mindful of performance impact
- Use interceptors for cross-cutting concerns, not business logic
- Document any data transformation clearly
- Test interceptors thoroughly as they affect all requests
