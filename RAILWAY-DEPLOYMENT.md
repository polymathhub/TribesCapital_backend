# 🚀 Railway Deployment Guide - Tribes Capital

## Pre-Deployment Checklist

- [x] Database schema complete with all authentication models
- [x] Environment configuration created (`.env.local`)
- [x] Error handling improved (no more generic "server error" messages)
- [x] Startup validation added
- [x] JWT secrets generated

---

## Step 1: Railway Project Setup

### 1.1 Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Select "Deploy from GitHub" or "Deploy from Git"
4. Connect your repository

### 1.2 Add PostgreSQL Service
1. In Railway Dashboard → Project
2. Click **"+ New Service"**
3. Select **"Database"** → **"PostgreSQL"**
4. Railway will auto-create and expose `DATABASE_URL`

---

## Step 2: Environment Variables Configuration

### 2.1 Copy Required Variables
Set these in Railway Dashboard → Your App Service → Variables:

```env
# Application
NODE_ENV=production
APP_NAME=Tribes Capital
APP_PORT=8080

# Database (Auto-provided by Railway PostgreSQL plugin)
# DATABASE_URL=postgresql://user:pass@host:port/dbname
# ^ Railway sets this automatically when you add PostgreSQL

# JWT Secrets (GENERATE THESE!)
JWT_ACCESS_SECRET=<32-char-random-string-here>
JWT_REFRESH_SECRET=<32-char-random-string-here>

# Frontend URL
FRONTEND_URL=https://your-domain.railway.app

# CORS Origins
CORS_ORIGIN=https://your-domain.railway.app

# Email (Optional - set to false if not configuring)
EMAIL_ENABLED=false

# Redis (Optional)
REDIS_ENABLED=false

# Logging
LOG_LEVEL=info
```

### 2.2 Generate JWT Secrets

**PowerShell:**
```powershell
# Generate 2 random secrets
$secret1 = -join (1..64 | ForEach-Object {[char][int](48 + @(0..9) + @(97..102) | Get-Random)})
$secret2 = -join (1..64 | ForEach-Object {[char][int](48 + @(0..9) + @(97..102) | Get-Random)})
Write-Output "JWT_ACCESS_SECRET=$secret1"
Write-Output "JWT_REFRESH_SECRET=$secret2"
```

**Node.js:**
```bash
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 3: Deployment Configuration

### 3.1 Update `package.json` Build Scripts

Your build script should be:
```json
{
  "scripts": {
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "npx nest build",
    "build:frontend": "cd frontend && npm install --omit=dev && npm run build",
    "start": "node dist/main",
    "db:migrate": "prisma migrate dev"
  }
}
```

### 3.2 Create `.railwayapp.json` (Optional but recommended)

Create `railway.json` in project root for deployment customization:

```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 5
  }
}
```

---

## Step 4: Pre-Deployment Database Setup

### 4.1 Create Initial Migrations Locally

Before pushing to Railway:

```bash
# Install dependencies
npm install

# Create migrations from Prisma schema
npx prisma migrate dev --name init

# This creates prisma/migrations/[timestamp]_init/migration.sql
```

### 4.2 Verify Migration Files

Check that `prisma/migrations/` folder has been created:
```
prisma/
├── migrations/
│   └── [timestamp]_init/
│       ├── migration.sql
│       └── migration_lock.toml
├── schema.prisma
└── seed.ts
```

Commit these to git - Railway needs them!

---

## Step 5: Deploy to Railway

### 5.1 Push to GitHub
```bash
git add .
git commit -m "chore: prepare for Railway deployment"
git push origin main
```

### 5.2 Monitor Railway Deployment

1. Go to Railway Dashboard
2. Select your project
3. Click on your app service
4. Watch the **Deployments** tab:
   - **Build Logs** - shows npm install and build progress
   - **Deploy Logs** - shows app startup

### 5.3 What Railway Does Automatically

1. **Build Phase:**
   - Installs dependencies
   - Runs `npm run build` (backend + frontend)
   - Creates production images

2. **Deploy Phase:**
   - Runs database migrations (Prisma)
   - Starts app with `npm start`
   - Exposes on public domain

---

## Step 6: Post-Deployment Verification

### 6.1 Check Health Endpoint

```bash
# Replace with your Railway domain
curl https://tribes-capital-prod.railway.app/api/health

# Expected response:
{
  "statusCode": 200,
  "data": {
    "message": "Application is running",
    "uptime": 1234.567,
    "environment": "production"
  }
}
```

### 6.2 Check Frontend

```bash
curl https://tribes-capital-prod.railway.app/

# Should return HTML (index.html from frontend build)
```

### 6.3 Test Authentication

```bash
curl -X POST https://tribes-capital-prod.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "YourPassword123!"
  }'
```

---

## Troubleshooting

### ❌ "Internal Server Error" on Deploy

**Check:** Railway Deployment Logs
```
1. Dashboard → Deployments → Latest → View Logs
2. Look for: "Missing environment variable: JWT_ACCESS_SECRET"
```

**Fix:** Add missing variables to Railway dashboard Variables tab

---

### ❌ "Database Connection Failed"

**Check:** PostgreSQL plugin is added
```
1. Dashboard → Services
2. Should see PostgreSQL service listed
3. Variables should include DATABASE_URL
```

**Fix:** Add PostgreSQL from "New Service" → Database

---

### ❌ "Frontend Not Loading" (404 on /)

**Check:** Build logs succeeded
```
1. Deployments → Latest → Build Logs
2. Look for "npm run build:frontend" completing
```

**Fix:** 
- Ensure `frontend/dist/index.html` exists
- Check `dist/frontend` path in ServeStaticModule

---

### ❌ "Migrations Failed"

**Check:** Migration files exist in git
```
git status | grep prisma/migrations
```

**Fix:**
```bash
# Create migrations locally first
npx prisma migrate dev --name init
git add prisma/migrations/
git push origin main
# Then redeploy
```

---

## Database Management

### View Database on Railway

```bash
# From Railway Dashboard:
1. Select PostgreSQL service
2. Click "Connect" → "Database"
3. Get connection string
4. Connect with psql or DBeaver
```

### Run Migrations Manually

If migrations don't run automatically:

```bash
# Get into Railway environment
railway shell

# Run migrations
npx prisma migrate deploy
```

---

## Performance Optimization

### 1. Enable Connection Pooling (Recommended for Production)

Update `DATABASE_URL` in Railway:

```env
# Before:
DATABASE_URL=postgresql://user:pass@localhost/db

# After (with pgBouncer):
DATABASE_URL=postgresql://user:pass@localhost/db?schema=public&connection_limit=10
```

### 2. Configure Node Memory

Set in Railway Variables:
```env
NODE_OPTIONS=--max_old_space_size=512
```

### 3. Database Backups

Railway PostgreSQL includes automatic backups. Check:
- Dashboard → PostgreSQL service → Backups tab

---

## Monitoring & Logs

### View Application Logs

```
Railway Dashboard → Your App → Logs
```

### Recommended Log Levels

Development: `LOG_LEVEL=debug`
Production: `LOG_LEVEL=info`

---

## Security Checklist

- [x] JWT secrets are strong (32+ chars, random)
- [x] DATABASE_URL uses HTTPS (postgresql://, not postgres://)
- [x] CORS_ORIGIN restricted to your domain
- [x] NODE_ENV=production
- [x] Email service disabled (no credentials needed)
- [x] Global exception filter doesn't leak sensitive info

---

## Rollback Strategy

If deployment fails:

1. **Immediate Rollback** (Previous version)
   ```
   Railway Dashboard → Deployments → Click previous version
   ```

2. **Database Rollback** (if migrations break)
   ```bash
   npx prisma migrate resolve --rolled-back "[timestamp]_migration_name"
   git push
   # Redeploy
   ```

---

## Support URLs

- **Health Check:** `/api/health`
- **Swagger Docs:** `/api/docs`  
- **Frontend:** `/`

---

## Next Steps

1. ✅ Set all environment variables
2. ✅ Commit and push to GitHub
3. ✅ Monitor Railway deployment
4. ✅ Verify health endpoint
5. ✅ Test login flow
6. ✅ Monitor logs for issues
7. ✅ Set up monitoring alerts (optional)

**Expected Deploy Time:** 3-5 minutes

Good luck! 🚀
