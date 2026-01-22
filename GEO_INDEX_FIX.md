# Fix MongoDB Geo Index Error

## Problem
```
$geoNear requires a geo index to run, but sawari_db.driver_profiles does not exist
```

The MongoDB collection `driver_profiles` needs a geospatial index for location-based queries (finding nearby drivers).

## Quick Fix - Restart Backend

The schema has been updated to explicitly create the index. Simply **restart your backend**:

```bash
# Stop the current process (Ctrl+C)
# Then restart
yarn start:dev
```

The index will be automatically created on startup.

## Alternative: Manual Index Creation

If you prefer to create the index manually without restarting:

### Option 1: MongoDB Shell (mongosh)

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use sawari_db

# Create 2dsphere index
db.driver_profiles.createIndex({ currentLocation: "2dsphere" })

# Verify index was created
db.driver_profiles.getIndexes()
```

### Option 2: MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to `sawari_db` → `driver_profiles`
4. Click "Indexes" tab
5. Click "Create Index"
6. Enter: `{ "currentLocation": "2dsphere" }`
7. Click "Create Index"

### Option 3: Run the Index Script

```bash
# From the backend directory
npx ts-node scripts/create-geo-index.ts
```

## Verification

After creating the index (or restarting), test the nearby drivers endpoint:

```bash
GET http://localhost:3000/location/nearby?lat=30.681321&lng=76.607743
```

## What Was Fixed

Updated `driver-profile.schema.ts` to explicitly create the 2dsphere index:

```typescript
DriverProfileSchema.index({ currentLocation: '2dsphere' });
```

This ensures MongoDB can perform geospatial queries using `$geoNear` aggregation.
