# Guards

This directory will contain guards for authentication and authorization.

## Purpose

Guards determine whether a request should be handled by the route handler or not. They are primarily used for:
- Authentication: Is the user logged in?
- Authorization: Does the user have permission to access this resource?
- Rate limiting: Has the user exceeded their request quota?
- Feature flags: Is this feature enabled for this user?

## Future Guards

When implementing authentication and authorization, you'll add:

- **JwtAuthGuard**: Validates JWT tokens and authenticates users
  ```typescript
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return user;
  }
  ```

- **RolesGuard**: Checks if user has required roles
  ```typescript
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'driver')
  @Get('admin/users')
  getAllUsers() {}
  ```

- **DriverGuard**: Ensures user is a verified driver

- **RiderGuard**: Ensures user is a verified rider

## How Guards Work

1. Guard's `canActivate()` method is called before the route handler
2. Guard returns `true` (allow) or `false` (deny)
3. If denied, NestJS throws a ForbiddenException
4. If allowed, request proceeds to the route handler

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;
    
    if (!token) {
      throw new UnauthorizedException();
    }
    
    // Validate token and attach user to request
    return true;
  }
}
```

## Usage

```typescript
// Global (in main.ts)
app.useGlobalGuards(new RolesGuard());

// Controller level
@UseGuards(JwtAuthGuard)
export class UsersController {}

// Method level
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete(':id')
deleteUser() {}
```

## Best Practices

- Guards should only handle authorization logic
- Keep guards simple and focused
- Use custom decorators with guards for better DX
- Chain guards in order: authentication → authorization
- Throw appropriate exceptions (UnauthorizedException, ForbiddenException)
- Cache expensive authorization checks when possible
