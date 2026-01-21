# Railway 404 Errors - Diagnostic Guide

## Problem

All endpoints on Railway are returning 404 "NOT_FOUND" errors:
- `https://clever-magic-production.up.railway.app/` → 404
- `https://clever-magic-production.up.railway.app/api/v1` → 404  
- `https://clever-magic-production.up.railway.app/api/v1/health` → 404
- `https://clever-magic-production.up.railway.app/api/v1/auth/register/rider` → 404

## Root Cause Analysis

When **ALL** endpoints return 404, it means the NestJS application is **NOT running** on Railway. The 404 is coming from Railway's proxy, not from your application.

### Possible Causes:

1. **Application Crash on Startup** (Most Likely)
   - Missing environment variables
   - Database connection failure
   - Build/runtime errors

2. **Port Binding Issue**
   - Already fixed with `0.0.0.0` binding

3. **Build Failure**
   - Dependencies not installing
   - TypeScript compilation errors

## How to Diagnose

### Step 1: Check Railway Deployment Logs

This is the MOST IMPORTANT step:

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click on your project
3. Click on **Deployments** tab
4. Click on the latest deployment
5. Look at the **Build Logs** and **Deploy Logs**

### What to Look For in Logs:

#### ✅ Successful Startup Logs Should Show:
```
🚀 Application is running on: http://localhost:3000/api/v1
📚 Environment: production
🏥 Health check: http://localhost:3000/api/v1/health
```

#### ❌ Common Error Patterns:

**1. Missing Environment Variables:**
```
Error: Missing required environment variable: MONGODB_URI
```
**Fix**: Add the variable in Railway Dashboard → Variables

**2. Database Connection Error:**
```
MongooseError: Could not connect to any servers in your MongoDB Atlas cluster
```
**Fix**: 
- Verify `MONGODB_URI` is correct
- Add `0.0.0.0/0` to MongoDB Atlas IP whitelist

**3. ES Module Error (Already Fixed):**
```
Error [ERR_REQUIRE_ESM]: require() of ES Module
```
**Fix**: Already fixed with uuid downgrade

**4. Port Binding Timeout:**
```
Error: Application failed to respond to health checks
```
**Fix**: Already fixed with `0.0.0.0` binding

## Required Environment Variables

Make sure these are set in Railway Dashboard → **Variables**:

### Critical (App Won't Start Without These):
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sawari_db
JWT_ACCESS_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-secret-key-min-32-chars
```

### Optional (Have Defaults):
```env
PORT=(auto-provided by Railway, don't set this)
API_PREFIX=api
API_VERSION=v1
CORS_ORIGINS=*
LOG_LEVEL=info
SWAGGER_ENABLED=false
```

## Step-by-Step Fix

### 1. Check Railway Logs First
**This is the most important step!** The logs will tell you exactly what's wrong.

### 2. Verify Environment Variables
Go to Railway Dashboard → Variables and ensure all critical variables are set.

### 3. Check MongoDB Connection
- Verify `MONGODB_URI` is correct
- In MongoDB Atlas → Network Access → Add `0.0.0.0/0` to IP whitelist

### 4. Redeploy with Latest Code

The code changes I made need to be deployed:
- Added `@Public()` decorators to health and root endpoints
- Created `/ping` diagnostic endpoint

To deploy:
```bash
git add .
git commit -m "fix: make health and root endpoints public"
git push origin dev
```

Railway will automatically redeploy.

### 5. Test After Deployment

Once redeployed, test these endpoints:

```bash
# Test root
curl https://clever-magic-production.up.railway.app/api/v1

# Test ping (new diagnostic endpoint)
curl https://clever-magic-production.up.railway.app/api/v1/ping

# Test health
curl https://clever-magic-production.up.railway.app/api/v1/health
```

## Quick Checklist

- [ ] Check Railway deployment logs for errors
- [ ] Verify all environment variables are set in Railway
- [ ] Confirm MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- [ ] Push latest code changes to dev branch
- [ ] Wait for Railway to redeploy
- [ ] Test endpoints again

## Most Likely Issue

Based on the symptoms, the **#1 most likely issue** is:

**Missing or incorrect `MONGODB_URI` environment variable in Railway**

The application tries to connect to MongoDB on startup. If it can't connect, it crashes before registering any routes, which causes all endpoints to return 404.

### How to Fix:
1. Go to Railway Dashboard → Your Project → **Variables**
2. Add or verify `MONGODB_URI` with your MongoDB Atlas connection string
3. Format: `mongodb+srv://username:password@cluster.mongodb.net/database_name`
4. Save and wait for automatic redeploy

## Need More Help?

Share the Railway deployment logs (from Dashboard → Deployments → Latest → Logs) to get specific guidance on the error.
