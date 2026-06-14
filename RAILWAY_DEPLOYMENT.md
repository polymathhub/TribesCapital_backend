# Railway Deployment Guide for Tribes Capital Backend

## Prerequisites

- Railway.app account (free tier available)
- GitHub repository with this code
- PostgreSQL database (Railway provides)
- Redis optional (Railway provides)

## 1. Initial Setup on Railway

### Step 1: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account
5. Select this repository

### Step 2: Add PostgreSQL Database

1. In Railway dashboard, click "New"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway auto-generates: `DATABASE_URL`

### Step 3: Add Redis (Optional - for caching)

1. In Railway dashboard, click "New"
2. Select "Database"
3. Choose "Redis"
4. Railway auto-generates connection variables

## 2. Environment Variables

### Add to Railway Environment

Go to your Railway project → Variables → Add these:

**Authentication:**
```
JWT_ACCESS_SECRET=<generate-with-node-crypto>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=<generate-with-node-crypto>
JWT_REFRESH_EXPIRY=7d
```

**Google OAuth:**
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URL=https://your-railway-domain.railway.app/auth/google
```

**Email Service:**
```
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@tribescapital.com
```

**CORS:**
```
CORS_ORIGIN=https://your-frontend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

**Application:**
```
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### Generate Secure Secrets

Run this in terminal:
```bash
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to Railway variables.

## 3. Build and Deploy Configuration

Railway automatically detects Node.js and uses `Procfile`:

```
web: npm run start:prod
```

### package.json Scripts (Already Configured)

```json
{
  "scripts": {
    "build": "npm run build:backend",
    "build:backend": "nest build",
    "start:prod": "node dist/main",
    "start:dev": "nest start --watch",
    "db:migrate": "prisma migrate deploy",
    "db:push": "prisma db push"
  }
}
```

## 4. Database Migrations

### Option A: Automatic (Recommended)

Create `railway.json` with deploy hook:

```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm run db:migrate && npm run start:prod",
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 3
  }
}
```

### Option B: Manual Migration

1. Connect to Railway PostgreSQL:
```bash
railway run psql $DATABASE_URL
```

2. Run migrations:
```bash
npm run db:migrate
```

## 5. First Deployment Steps

### Step 1: Commit and Push

```bash
git add .
git commit -m "Configure for Railway deployment"
git push origin main
```

### Step 2: Railway Auto-Deploy

Railway automatically:
- Detects Node.js app
- Installs dependencies: `npm install`
- Builds: `npm run build`
- Starts: via Procfile

### Step 3: Monitor Deployment

In Railway dashboard:
- View logs in real-time
- Check deployment status
- View errors if any

### Step 4: Verify Health

```bash
curl https://your-railway-domain.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-06-14T14:00:00Z"
}
```

## 6. Scaling and Performance

### Memory

Default: 512 MB (free tier)

For production, increase to:
- **2 GB:** 100-500 concurrent users
- **4 GB:** 500-2000 concurrent users
- **8 GB:** 2000+ concurrent users

### Networking

Railway provides:
- Automatic SSL/TLS
- DDoS protection
- CDN (paid tier)

## 7. Monitoring and Logs

### View Logs

Railway dashboard → Logs tab shows:
- Application errors
- Database queries
- Authentication events

### Set Up Alerts

1. Go to project settings
2. Add email/Slack notifications
3. Alert on: Crashes, high memory, failed deploys

### Metrics to Monitor

- Response time (should be <200ms)
- Error rate (should be <1%)
- Database connections (max: 20)
- Memory usage (should be <80%)

## 8. Common Issues & Solutions

### Issue: "Cannot find module"
**Solution:** Ensure all dependencies in `package.json` are declared

### Issue: "Database connection failed"
**Solution:** 
1. Check `DATABASE_URL` is set in Railway
2. Run migrations: `railway run npm run db:migrate`
3. Verify PostgreSQL service is running

### Issue: "Email sending fails"
**Solution:**
1. Check Gmail app password (not regular password)
2. Enable "Less secure app access" if using Gmail
3. Test with: `railway run npm test -- email.service.spec.ts`

### Issue: "Google OAuth not working"
**Solution:**
1. Verify `GOOGLE_CLIENT_ID` matches Google Console
2. Add Railway domain to authorized origins in Google Console
3. Check `GOOGLE_REDIRECT_URL` is correct

### Issue: "CORS errors"
**Solution:**
1. Update `CORS_ORIGIN` to match frontend domain
2. Restart service: Railway dashboard → Restart

## 9. Production Checklist

- [ ] All environment variables set in Railway
- [ ] PostgreSQL database created and migrated
- [ ] Google OAuth credentials configured
- [ ] Email service tested (send test email)
- [ ] CORS origin set to production domain
- [ ] JWT secrets are 32+ characters and random
- [ ] Redis configured (if using caching)
- [ ] SSL certificate (automatic via Railway)
- [ ] Database backups enabled
- [ ] Monitoring and alerts configured
- [ ] Logs are being captured
- [ ] Health check endpoint responding
- [ ] API tested with production domain

## 10. Deployment Environment

### Current Configuration

```
Build: nixpacks
Start: npm run start:prod
Database: PostgreSQL (Railway)
Cache: Redis (Railway) - Optional
File Storage: AWS S3
```

### Runtime

- Node.js: Latest LTS
- npm: Automatically managed
- Process Manager: None (Railway manages)

## 11. Zero-Downtime Deployments

Railway handles automatically:
1. New container spins up
2. Health check verifies readiness
3. Traffic switches to new container
4. Old container terminates
5. Total downtime: ~10 seconds

## 12. Cost Optimization

### Free Tier
- 512 MB RAM
- 100 GB bandwidth/month
- Perfect for development/testing

### Hobby Tier ($5/month per service)
- 1 GB RAM
- 1000 GB bandwidth/month
- Good for small production

### Standard Tier ($20+/month per service)
- 4+ GB RAM
- Unlimited bandwidth
- Production ready

## 13. Backup and Recovery

### Automatic Backups

Railway automatically backs up PostgreSQL:
- Daily backups
- 30-day retention
- Restore via dashboard

### Manual Backup

```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

### Restore from Backup

```bash
railway run psql $DATABASE_URL < backup.sql
```

## 14. Post-Deployment

### Monitoring

```bash
# Check application status
railway status

# View logs
railway logs

# SSH into container (if needed)
railway shell
```

### Updates

To deploy new version:
1. Push to GitHub
2. Railway auto-detects changes
3. Automatic rebuild and deploy
4. Old container terminates

## 15. Support and Documentation

- Railway Docs: https://docs.railway.app
- NestJS: https://docs.nestjs.com
- Prisma: https://www.prisma.io/docs
- PostgreSQL: https://www.postgresql.org/docs

## Quick Commands

```bash
# Deploy
git push origin main

# SSH into Railway container
railway shell

# View logs
railway logs -f

# Restart service
railway restart

# Check environment variables
railway variables

# Run database migrations
railway run npm run db:migrate

# View service status
railway status
```

## Support

For issues:
1. Check Railway dashboard logs
2. Review this guide's "Common Issues" section
3. Contact Railway support: https://railway.app/support
4. Check application logs for detailed errors

## Success Indicators

✅ After successful deployment, you should see:
- All environment variables loaded
- Database migrations completed
- Application started without errors
- Health endpoint responding
- Logs showing incoming requests
- Users able to sign in
- OAuth working (if configured)

---

**Last Updated:** 2026-06-14
**Status:** Production Ready
