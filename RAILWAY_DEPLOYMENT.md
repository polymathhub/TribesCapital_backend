# Railway Deployment Guide for TribesCapital

## Overview

This guide walks you through deploying TribesCapital to Railway, a modern cloud platform for deploying applications with minimal configuration.

## Prerequisites

1. **GitHub Account**: Repository pushed to GitHub
2. **Railway Account**: Create free account at [railway.app](https://railway.app)
3. **Environment Variables**: Database and API configuration ready

## Step 1: Push to GitHub

```bash
# Navigate to project directory
cd /path/to/TribesCapital_backend-master

# Add GitHub remote (replace polymathhub with your username)
git remote add origin https://github.com/polymathhub/TribesCapital_backend.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `TribesCapital_backend`
3. **Description**: "TribesCapital - Clean Energy Investment Platform"
4. **Visibility**: Public (for Railway)
5. Create repository

Then push:
```bash
git push -u origin main
```

## Step 3: Deploy on Railway

### Option A: Railway CLI (Recommended)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize Railway project
railway init

# 4. Add environment variables
railway variables set DATABASE_URL="your_database_url"
railway variables set JWT_SECRET="your_jwt_secret"
railway variables set APP_ENVIRONMENT="production"
railway variables set CORS_ORIGIN="https://your-railway-app.up.railway.app"

# 5. Deploy
railway up
```

### Option B: Railway Web Dashboard

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Authorize GitHub and select your repository
5. Railway auto-detects Node.js and deploys
6. Add environment variables in the web dashboard

## Step 4: Configure Environment Variables

In Railway dashboard, add:

```
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
JWT_SECRET=[generate-secure-32-char-string]
APP_ENVIRONMENT=production
APP_PORT=3000
DB_HOST=[database-host]
DB_PORT=5432
DB_USERNAME=[database-user]
DB_PASSWORD=[database-password]
DB_NAME=tribes_capital
CORS_ORIGIN=https://[your-app].up.railway.app
```

## Step 5: Set Up PostgreSQL Database

### Option A: Railway PostgreSQL Plugin

1. In Railway Dashboard, click **"Add a Service"**
2. Select **PostgreSQL**
3. Railway auto-creates DATABASE_URL
4. Run migrations:
   ```bash
   railway run npm run db:push
   ```

### Option B: External Database

Use any PostgreSQL provider:
- AWS RDS
- Google Cloud SQL
- Azure Database
- Supabase
- Railway PostgreSQL

Then set `DATABASE_URL` environment variable.

## Step 6: Generate Secure Secrets

### Generate JWT_SECRET
```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -base64 32
```

Copy the output and add to Railway environment variables.

## Step 7: Verify Deployment

```bash
# Check deployment status
railway logs

# Test frontend
curl https://[your-app].up.railway.app

# Test API
curl https://[your-app].up.railway.app/api/health

# Run migrations if needed
railway run npm run db:push
```

## Step 8: Connect Custom Domain (Optional)

1. Railway Dashboard → Settings → Custom Domain
2. Add your domain (e.g., api.tribescapital.com)
3. Update DNS records as shown
4. Wait 5-10 minutes for SSL certificate

## Troubleshooting

### Build Fails

**Error**: `npm: command not found`
- **Solution**: Railway uses nixpacks which auto-detects Node.js. Ensure `package.json` exists in root.

**Error**: `Prisma migration failure`
- **Solution**: Run migrations in Railway terminal:
  ```bash
  railway run npm run db:push
  ```

### Port Issues

- Railway dynamically assigns ports
- Server must read `process.env.PORT` or use default 3000
- ✅ Already configured in `src/main.ts`

### Frontend Not Displaying

- Verify `dist/frontend/index.html` exists after build
- Check `src/app.module.ts` has correct ServeStaticModule path
- View build logs: `railway logs`

### Database Connection Error

1. Verify `DATABASE_URL` is set correctly
2. Test connection:
   ```bash
   railway run psql $DATABASE_URL
   ```
3. Check database exists: `\l`

### CORS Errors

- Update `CORS_ORIGIN` environment variable with Railway app URL
- Verify `src/main.ts` enables CORS with this origin
- Clear browser cache and hard refresh

## Production Checklist

- [ ] Repository pushed to GitHub
- [ ] Database created and connected
- [ ] All environment variables configured
- [ ] Migrations run successfully (`npm run db:push`)
- [ ] Frontend builds and displays at root URL (`/`)
- [ ] API responds at `/api` routes
- [ ] JWT authentication working
- [ ] Error logging configured
- [ ] SSL certificate issued (automatic)
- [ ] Monitoring/alerts set up (optional)

## Monitoring & Logs

### View Logs
```bash
railway logs --follow
```

### View Metrics
Railway Dashboard → Metrics tab shows:
- CPU usage
- Memory usage
- Network I/O
- Request rate

### Error Tracking

Add error tracking service (optional):
```bash
# Sentry
npm install @sentry/node @sentry/tracing
```

Configure in `src/main.ts`:
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.APP_ENVIRONMENT,
});
```

## Scale & Performance

### Horizontal Scaling
Railway automatically scales based on:
- Memory usage
- CPU usage
- Request rate

### Optimize for Production

Current optimizations:
- ✅ Vite code splitting (vendor bundle)
- ✅ Frontend minification
- ✅ Backend compilation
- ✅ SPA routing fallback
- ✅ Mobile-first responsive design

## Cost Estimation

Railway free tier includes:
- 5GB bandwidth
- $5/month platform credit
- PostgreSQL: $0.25/GB/month
- Compute: $0.000115/CPU-ms

Example monthly cost:
- Basic app: $5-10/month
- Medium app: $15-30/month

## Next Steps

1. Push to GitHub: `git push origin main`
2. Create Railway account: [railway.app](https://railway.app)
3. Connect repository in Railway Dashboard
4. Configure environment variables
5. Deploy and monitor

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **NestJS Docs**: [nestjs.com](https://nestjs.com)
- **React Docs**: [react.dev](https://react.dev)

---

**Your application is now ready for Railway deployment!** 🚀
