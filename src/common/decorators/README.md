# Custom Decorators

This directory will contain custom decorators for cleaner, more expressive code.

## Purpose

Custom decorators provide a clean way to:
- Extract data from requests (user, headers, query params)
- Add metadata to routes (roles, permissions, rate limits)
- Reduce boilerplate code
- Improve code readability
- Enable reusable patterns

## Future Decorators

When building authentication and business logic, you'll add:

### Parameter Decorators

Extract data from the request:

- **@CurrentUser()**: Get the authenticated user
  ```typescript
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return user;
  }
  ```

- **@CurrentUserId()**: Get just the user ID
  ```typescript
  @Post('rides')
  createRide(@CurrentUserId() userId: string, @Body() dto: CreateRideDto) {
    return this.ridesService.create(userId, dto);
  }
  ```

- **@RealIP()**: Get the real IP address (behind proxies)
  ```typescript
  @Post('login')
  login(@RealIP() ip: string, @Body() dto: LoginDto) {
    return this.authService.login(dto, ip);
  }
  ```

### Metadata Decorators

Add metadata to routes:

- **@Roles()**: Specify required roles
  ```typescript
  @Roles('admin', 'driver')
  @Get('admin/stats')
  getStats() {}
  ```

- **@Public()**: Mark route as public (skip authentication)
  ```typescript
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {}
  ```

- **@RateLimit()**: Custom rate limiting per endpoint
  ```typescript
  @RateLimit({ ttl: 60, limit: 5 })
  @Post('send-otp')
  sendOtp() {}
  ```

## How to Create Decorators

### Parameter Decorator Example

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Attached by auth guard
  },
);
```

### Metadata Decorator Example

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

## Best Practices

- Name decorators clearly and consistently
- Document decorator behavior and usage
- Keep decorators simple and focused
- Use TypeScript types for type safety
- Combine decorators with guards for powerful patterns
- Test decorators thoroughly
