# OTP Verification Troubleshooting

## Problem
You are receiving `Incorrect OTP` error when trying to start a ride.

## Quick Debugging

Run this script with your Ride ID (from the error log) to see the **actual expected OTP**:

```bash
# Verify the OTP for the specific ride
npx ts-node scripts/check-ride-otp.ts 6971bfc295475ea0e0ac0064
```

*Replace the ID with the one in your error log.*

## Possible Causes

### 1. Rider Has No OTP
If the script shows `EXPECTED OTP: UNDEFINED`, it means the rider account was created **before** we implemented the OTP feature.

**Fix:**
We need to generate OTPs for existing users. I can create a migration script for this if needed.

### 2. Frontend Sending Wrong Data
If the script shows a valid 4-digit OTP (e.g., `1234`), but the API still rejects it:

- Check what the **Driver App** is sending.
- Ensure there is no **whitespace** (e.g., `" 1234 "` vs `"1234"`).
- Ensure the field name matches: `{ "otp": "1234" }`.

### 3. Wrong Rider
Rare, but check if the ride `riderId` matches the user who thinks they are the rider. The script above prints the Rider's Name and Email—verify this is who you expect.

## Manual Database Check

You can also check directly in MongoDB:

```javascript
// Mongo Shell
use sawari_db
db.rides.findOne({ _id: ObjectId("6971bfc295475ea0e0ac0064") })
// Take the riderId from above result
db.users.findOne({ _id: ObjectId("RIDER_ID_HERE") }).riderOtp
```

## How to Fix "Missing OTP" for Existing Users

If you find the rider has no OTP, you can manually set one in MongoDB:

```javascript
db.users.updateOne(
  { _id: ObjectId("RIDER_ID_HERE") },
  { $set: { riderOtp: "1234" } }
)
```

Or ask me to provide a migration script to update all existing riders.
