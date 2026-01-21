# Configure Railway to Deploy from Dev Branch

## ✅ Dev Branch Successfully Pushed

Your `dev` branch has been successfully pushed to GitHub with all your code from the `navneet` branch, including the Railway deployment fixes.

## Configure Railway to Use Dev Branch

### Option 1: Via Railway Dashboard (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Click on **Settings** (or the service settings)
4. Scroll to **Source** section
5. Under **Branch**, change from `main` or `master` to **`dev`**
6. Click **Save** or **Update**
7. Railway will automatically trigger a new deployment from the `dev` branch

### Option 2: Via railway.toml (Already Configured)

The `railway.toml` file doesn't specify a branch, so Railway will use whatever branch you configure in the dashboard.

## Verify Configuration

After changing the branch in Railway:

1. Check the **Deployments** tab
2. You should see a new deployment triggered
3. The deployment should show it's building from the `dev` branch
4. Monitor the build logs for any errors

## Environment Variables Reminder

Make sure these are set in Railway Dashboard → **Variables**:

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_secret_key
CORS_ORIGINS=your_frontend_url
```

## Next Steps

1. ✅ Dev branch pushed to GitHub
2. ⏳ Configure Railway to use `dev` branch (see above)
3. ⏳ Set environment variables in Railway
4. ⏳ Monitor deployment
5. ⏳ Test the deployed application

## Future Workflow

Now that you have the `dev` branch set up:

```bash
# Work on navneet branch
git checkout navneet
# Make changes...
git add .
git commit -m "your changes"

# Push to dev for Railway deployment
git checkout dev
git merge navneet
git push origin dev

# Railway will automatically deploy!
```

Or simply:

```bash
# From navneet branch
git push origin navneet:dev --force

# This pushes navneet to dev directly
```
