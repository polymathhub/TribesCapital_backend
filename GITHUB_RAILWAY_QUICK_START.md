# GitHub Push & Railway Deployment Quick Start

## Your GitHub Details
- **Username**: polymathhub
- **Email**: olaitanpetertolu@gmail.com

## Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `TribesCapital_backend` (or your preferred name)
3. **Description**: "TribesCapital - Clean Energy Investment Platform | Mobile-first responsive design with full-stack architecture"
4. **Visibility**: ⚫ Public
5. **Click**: "Create repository"

⚠️ **Do NOT initialize with README, .gitignore, or license** (we already have these)

## Step 2: Push to GitHub

```bash
cd c:\Users\HomePC\Downloads\TribesCapital_backend-master\TribesCapital_backend-master

# Add GitHub remote (replace REPO_NAME with your repo name)
git remote add origin https://github.com/polymathhub/REPO_NAME.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 3: Verify on GitHub

Visit `https://github.com/polymathhub/REPO_NAME` and verify:
- ✅ All files are uploaded
- ✅ 111 files changed
- ✅ Commits visible (2 commits total)
- ✅ README files visible

## Step 4: Deploy on Railway

### Quick Deploy (Recommended)

1. **Sign up** at [railway.app](https://railway.app) (use your GitHub account for quick auth)
2. **Go to Dashboard** → Click "New Project"
3. **Select** "Deploy from GitHub"
4. **Authorize** Railway to access your GitHub
5. **Select repository** from the list
6. **Railway auto-deploys** to: `https://tribescapital-RANDOM.up.railway.app`

### Configure Environment Variables

After deployment starts, in Railway Dashboard:

1. **Go to** Variables tab
2. **Add these variables**:

```
DATABASE_URL = postgresql://user:password@host:5432/tribes_capital
JWT_SECRET = [see below to generate]
APP_ENVIRONMENT = production
APP_PORT = 3000
CORS_ORIGIN = https://tribescapital-RANDOM.up.railway.app
DB_NAME = tribes_capital
```

**Generate JWT_SECRET** (run in terminal):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Add PostgreSQL Database

1. **In Railway Dashboard** → "New Service" dropdown
2. **Select PostgreSQL** → Add to Project
3. **Automatically creates DATABASE_URL**
4. Run migrations:
   ```bash
   npx railway link  # Connect to your Railway project
   railway run npm run db:push
   ```

## Test Your Deployment

```bash
# Frontend loads
curl https://tribescapital-RANDOM.up.railway.app/

# API works
curl https://tribescapital-RANDOM.up.railway.app/api/auth/login

# View logs
railway logs --follow
```

## Success Indicators ✅

Your deployment is successful when:
- ✅ `https://tribescapital-RANDOM.up.railway.app` loads HTML (not 404)
- ✅ Frontend displays with mobile-responsive layout
- ✅ API returns responses at `/api` routes
- ✅ Database connection successful in logs
- ✅ No errors in Railway logs

## What Gets Deployed

Your deployment includes:

**Backend** (NestJS):
- ✅ Authentication module (JWT)
- ✅ Courses, lessons, events modules
- ✅ Due diligence vault
- ✅ User management
- ✅ Database ORM (Prisma)
- ✅ Static file serving

**Frontend** (React):
- ✅ Mobile-first responsive design
- ✅ Learning Hub with video player
- ✅ Due Diligence Vault
- ✅ Events management
- ✅ Course tracking
- ✅ 3 CSS breakpoints: 320px, 768px, 1024px+

**Optimizations Included**:
- ✅ Code splitting (vendor bundle)
- ✅ Minified assets
- ✅ Gzipped responses (~111KB total)
- ✅ SPA routing fallback
- ✅ Mobile-friendly (44x44px touch targets)
- ✅ Glass-morphic UI design

## Troubleshooting

### "Repository not found" error
```bash
# Verify origin URL
git remote -v

# Should show:
# origin  https://github.com/polymathhub/YOUR_REPO.git (fetch)
# origin  https://github.com/polymathhub/YOUR_REPO.git (push)

# If wrong, update it
git remote set-url origin https://github.com/polymathhub/YOUR_CORRECT_REPO.git
```

### Build fails on Railway
- **Check**: `npm run build` works locally first
- **Solution**: View Railway logs for specific errors
- **Common**: Missing environment variables

### Frontend not displaying
1. Check Railway logs for errors
2. Verify `dist/frontend/index.html` created
3. Test API: `curl https://YOUR_APP.up.railway.app/api/health`

### Database connection error
1. Verify `DATABASE_URL` is set correctly
2. Ensure PostgreSQL is connected
3. Run migrations: `railway run npm run db:push`

## Next Steps

1. Create repository on GitHub
2. Push code to GitHub
3. Deploy on Railway
4. Add custom domain (optional)
5. Set up monitoring (optional)

---

**Everything is ready for production deployment!** 🚀

Questions? Check:
- [Railway Docs](https://docs.railway.app)
- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- [BUILD_AND_DEPLOYMENT.md](./BUILD_AND_DEPLOYMENT.md)
