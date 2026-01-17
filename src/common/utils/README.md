# Utilities

This directory contains helper functions and utilities used throughout the application.

## Purpose

Utilities are pure functions that provide common functionality without side effects. They help:
- Reduce code duplication
- Improve code readability
- Centralize common logic
- Make testing easier

## Future Utilities

When building the application, you might add:

- **date.util.ts**: Date formatting and manipulation
  ```typescript
  export function formatDate(date: Date): string;
  export function addDays(date: Date, days: number): Date;
  export function isExpired(expiryDate: Date): boolean;
  ```

- **string.util.ts**: String manipulation helpers
  ```typescript
  export function slugify(text: string): string;
  export function truncate(text: string, length: number): string;
  export function maskEmail(email: string): string;
  ```

- **validation.util.ts**: Custom validation helpers
  ```typescript
  export function isValidPhoneNumber(phone: string): boolean;
  export function isValidCoordinates(lat: number, lng: number): boolean;
  ```

- **distance.util.ts**: Geospatial calculations
  ```typescript
  export function calculateDistance(from: Coordinates, to: Coordinates): number;
  export function isWithinRadius(point: Coordinates, center: Coordinates, radius: number): boolean;
  ```

- **price.util.ts**: Pricing calculations
  ```typescript
  export function calculateRidePrice(distance: number, duration: number): number;
  export function applyDiscount(price: number, discountPercent: number): number;
  ```

## Best Practices

- Keep utilities pure (no side effects)
- Make utilities testable (easy to unit test)
- Document parameters and return values
- Use TypeScript types for type safety
- Group related utilities in the same file
- Export individual functions, not classes
- Avoid dependencies on other modules when possible
