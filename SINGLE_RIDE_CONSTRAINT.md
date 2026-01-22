# Single Active Ride Constraint - Implementation Summary

## Overview

Implemented validation to ensure **riders and drivers can only have one active ride at a time**, preventing parallel ride conflicts and ensuring proper ride lifecycle management.

---

## What Was Implemented

### 1. **Rider: Cannot Create Multiple Rides** ✅

**File**: [`rides.service.ts`](file:///d:/github/sawari_backend/src/rides/rides.service.ts) - `createRequest()` method

**Validation Added**:
```typescript
// Check if rider already has an active ride
const existingActiveRide = await this.findActiveRide(riderId, UserRole.RIDER);
if (existingActiveRide) {
  throw new BadRequestException(
    'You already have an active ride. Please complete or cancel it before creating a new one.',
  );
}
```

**Active Ride Statuses**: `REQUESTED`, `BIDDING`, `ACCEPTED`, `ARRIVED`, `STARTED`

**User Experience**:
- Rider tries to create a new ride while having an active one
- Backend returns error: "You already have an active ride. Please complete or cancel it before creating a new one."
- Frontend should display this error and navigate rider to their active ride

---

### 2. **Driver: Cannot Accept Multiple Rides Directly** ✅

**File**: [`rides.service.ts`](file:///d:/github/sawari_backend/src/rides/rides.service.ts) - `acceptRide()` method

**Validation Added**:
```typescript
// Check if driver already has an active ride
const existingActiveRide = await this.findActiveRide(driverId, UserRole.DRIVER);
if (existingActiveRide) {
  throw new BadRequestException(
    'You already have an active ride. Please complete or cancel it before accepting a new one.',
  );
}
```

**Active Ride Statuses**: `ACCEPTED`, `ARRIVED`, `STARTED`

**User Experience**:
- Driver tries to accept a ride while already on another ride
- Backend returns error: "You already have an active ride. Please complete or cancel it before accepting a new one."
- Frontend should display error and navigate driver to their active ride

---

### 3. **Bid Acceptance: Validates Driver Availability** ✅

**File**: [`bids.service.ts`](file:///d:/github/sawari_backend/src/bids/bids.service.ts) - `acceptBid()` method

**Validation Added**:
```typescript
// Check if winning driver already has an active ride
const driverActiveRide = await this.rideModel.findOne({
  driverId: winningBid.driverId,
  status: {
    $in: ['ACCEPTED', 'ARRIVED', 'STARTED'],
  },
});

if (driverActiveRide) {
  throw new BadRequestException(
    'This driver is already on another ride. Please select a different driver.',
  );
}
```

**User Experience**:
- Rider accepts a bid from a driver who just got assigned to another ride
- Backend returns error: "This driver is already on another ride. Please select a different driver."
- Frontend should refresh the bid list and show available drivers only

---

## How It Works

### Active Ride Definition

A ride is considered "active" if it has any of these statuses:
- `REQUESTED` - Ride created, waiting for driver
- `BIDDING` - Open for driver bids
- `ACCEPTED` - Driver assigned
- `ARRIVED` - Driver at pickup location
- `STARTED` - Ride in progress

A ride is **NOT active** if it's:
- `COMPLETED` - Successfully finished
- `CANCELLED` - Cancelled by rider or driver

### Validation Points

1. **Ride Creation** (Rider)
   - Endpoint: `POST /rides`
   - Checks: Rider's active rides
   - Prevents: Multiple ride requests

2. **Direct Ride Acceptance** (Driver)
   - Endpoint: `PATCH /rides/:id/accept`
   - Checks: Driver's active rides
   - Prevents: Driver accepting multiple rides

3. **Bid Acceptance** (Rider)
   - Endpoint: `PATCH /bids/:bidId/accept`
   - Checks: Winning driver's active rides
   - Prevents: Assigning busy drivers

---

## Edge Cases Handled

### Race Condition: Multiple Bid Acceptances

**Scenario**: Rider accepts a bid while driver is simultaneously accepting another ride

**Solution**: The `acceptBid()` method checks driver availability **just before** assigning them to the ride. If the driver got assigned to another ride in the meantime, the bid acceptance fails with a clear error message.

### Driver Places Bid While On Active Ride

**Current Behavior**: Drivers can still place bids even if they have an active ride.

**Recommendation**: Add validation in `placeBid()` method to prevent drivers from bidding while on active rides:

```typescript
// In bids.service.ts - placeBid() method
const driverActiveRide = await this.rideModel.findOne({
  driverId,
  status: { $in: ['ACCEPTED', 'ARRIVED', 'STARTED'] },
});

if (driverActiveRide) {
  throw new BadRequestException(
    'You cannot place bids while on an active ride.',
  );
}
```

---

## Frontend Integration

### Error Handling

All three validation points return `BadRequestException` with clear error messages:

```javascript
try {
  await createRide(pickup, drop);
} catch (error) {
  if (error.response?.status === 400) {
    // Show error message
    alert(error.response.data.message);
    
    // Navigate to active ride
    navigateToActiveRide();
  }
}
```

### Recommended UI Flow

**For Riders**:
1. Before showing "Create Ride" screen, fetch active ride: `GET /rides/active`
2. If active ride exists, navigate directly to ride tracking screen
3. Show "Create New Ride" button only when no active ride exists

**For Drivers**:
1. Before showing available rides list, fetch active ride: `GET /rides/active`
2. If active ride exists, navigate directly to active ride screen
3. Show available rides list only when no active ride exists

---

## Testing

### Test Scenarios

1. **Rider Multiple Rides**
   - Create ride A
   - Try to create ride B → Should fail
   - Complete ride A
   - Create ride B → Should succeed

2. **Driver Multiple Rides**
   - Accept ride A
   - Try to accept ride B → Should fail
   - Complete ride A
   - Accept ride B → Should succeed

3. **Bid Acceptance Race Condition**
   - Driver places bid on ride A and B
   - Rider A accepts driver's bid
   - Rider B tries to accept same driver's bid → Should fail

---

## Benefits

✅ **Data Integrity**: Prevents conflicting ride assignments  
✅ **Better UX**: Clear error messages guide users to their active rides  
✅ **Safety**: Ensures drivers focus on one ride at a time  
✅ **Reliability**: Prevents race conditions in bid acceptance  

---

## Summary

The single active ride constraint is now enforced at **three critical points**:
1. Ride creation (riders)
2. Direct ride acceptance (drivers)
3. Bid acceptance (riders selecting drivers)

This ensures the system maintains data integrity and provides a clear, predictable user experience for both riders and drivers.
