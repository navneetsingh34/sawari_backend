# Constants

This directory contains application-wide constants, enums, and configuration values.

## Purpose

Constants provide:
- Single source of truth for fixed values
- Type-safe enums for status codes and categories
- Centralized configuration values
- Better maintainability (change in one place)

## Future Constants

When building the application, you'll add:

- **ride-status.constant.ts**: Ride lifecycle statuses
  ```typescript
  export enum RideStatus {
    REQUESTED = 'REQUESTED',
    ACCEPTED = 'ACCEPTED',
    DRIVER_ARRIVED = 'DRIVER_ARRIVED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
  }
  ```

- **user-roles.constant.ts**: User role definitions
  ```typescript
  export enum UserRole {
    RIDER = 'RIDER',
    DRIVER = 'DRIVER',
    ADMIN = 'ADMIN',
  }
  ```

- **payment-methods.constant.ts**: Payment method types
  ```typescript
  export enum PaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
    WALLET = 'WALLET',
    UPI = 'UPI',
  }
  ```

- **vehicle-types.constant.ts**: Vehicle categories
  ```typescript
  export enum VehicleType {
    BIKE = 'BIKE',
    AUTO = 'AUTO',
    MINI = 'MINI',
    SEDAN = 'SEDAN',
    SUV = 'SUV',
  }
  ```

- **app.constant.ts**: Application-level constants
  ```typescript
  export const APP_CONSTANTS = {
    MAX_RIDE_SEARCH_RADIUS: 5000, // meters
    RIDE_TIMEOUT: 300, // seconds
    OTP_EXPIRY: 600, // seconds
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
  };
  ```

## Best Practices

- Use UPPER_SNAKE_CASE for constant values
- Use PascalCase for enums
- Group related constants together
- Export as const for immutability
- Document units (meters, seconds, bytes)
- Use TypeScript enums for type safety
- Avoid magic numbers in code - define them here
