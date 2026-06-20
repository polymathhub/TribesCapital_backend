# Production Setup Guide for Railway

## Required Environment Variables (Set on Railway Dashboard)

### Security (JWT Authentication)
```
JWT_ACCESS_SECRET=<base64-random-string>     # 15-minute token lifetime
JWT_REFRESH_SECRET=<base64-random-string>    # 7-day token lifetime
```

### Database (PostgreSQL)
```
DATABASE_URL=postgresql://user:password@host:port/dbname
```

Railway will automatically provide this when you add PostgreSQL plugin.

### Application
```
NODE_ENV=production
APP_PORT=8080
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

## Setup Steps

### 1. Add PostgreSQL Plugin
1. Go to Railway Dashboard
2. Project → Add Service → PostgreSQL
3. Copy the `DATABASE_URL` from PostgreSQL service variables

### 2. Set Environment Variables
1. Go to your app service
2. Click "Variables" tab
3. Add all required variables above
4. Add `DATABASE_URL` from PostgreSQL plugin

### 3. Database Migration
Railway will run migrations automatically on deploy. No manual action needed.

## How It Works in Production

1. **Build Phase**
   - Backend compiled: TypeScript → JavaScript (dist/)
   - Frontend built: React + Vite (frontend/dist/)
   - Both combined in production image

2. **Start Phase**
   - Environment validated (all required vars present)
   - Database connection tested
   - Static frontend served from `/`
   - API available at `/api`

3. **Frontend Architecture**
   - ServeStaticModule serves static files from `frontend/dist/`
   - SpaFallbackController handles React Router (all non-API routes → index.html)
   - Client-side routing works seamlessly

## Health Checks

```bash
# API Health (should return 200 with app object)
curl https://yourdomain.com/api/health

# Frontend (should return HTML)
curl https://yourdomain.com/
```

## Troubleshooting

### 500 Error on Root Path
- Check environment variables are set
- Verify DATABASE_URL is correct
- Check build logs: Deployments → Latest → Build Logs

### Frontend Not Loading
- Verify frontend built successfully (check build logs)
- Check `frontend/dist/index.html` exists
- Check ServeStaticModule path is correct

### Authentication Failing
- Verify JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are set
- Ensure tokens are being sent with Authorization header
- Check CORS_ORIGIN includes your frontend domain

## Generated Secrets (use these as examples)

To generate secure random secrets locally:
```powershell
# PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))
```

Run this twice to get 2 different secrets for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.
