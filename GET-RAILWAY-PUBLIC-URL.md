# 🔧 Getting Railway Public Database URL

The error `Can't reach database server at postgres.railway.internal:5432` means we're using an internal Railway address that only works within Railway's network.

## ✅ How to Get Your Public Railway Database URL

### Step 1: Go to Railway Dashboard
- Open: https://railway.app/dashboard
- Login with your account

### Step 2: Select Your Project
- Click on your **TribesCapital** project
- Look for your **PostgreSQL** plugin/service

### Step 3: Click on PostgreSQL Service
- You should see a box showing your database details
- Look for the "Connect" or credentials section

### Step 4: Find the Public URL
You should see different connection options:
- **Internal Address**: `postgres.railway.internal:5432` (doesn't work locally)
- **Public Domain**: `something.railway.app:XXXX` (this is what we need!)

OR look for:
- **DATABASE_URL** in "Raw Connection String" or "Environment Variables"

### Step 5: Copy the Public Connection String
It should look like ONE of these formats:

```
# Format A: Full Connection String
postgresql://postgres:PASSWORD@public.railway.app:5432/railway

# Format B: Just the host
postgres://postgres:PASSWORD@xxxx.railway.app:5432/railway
```

---

## 🚨 Common Issues

### Issue 1: Only seeing internal address
**Solution**: Railway might not have a public domain enabled. You can:
1. Click "Generate Domain" or "Enable Public Access"
2. OR ask Railway support to enable public access to your database

### Issue 2: Can't find the URL
**Solution**: Look for these sections in Railway dashboard:
- "Connect" tab
- "Raw Connection String"
- "Environment Variables"
- "Postgres" plugin details

---

## 📋 Once You Have the Public URL

Send me the **public** database URL and I'll:
1. ✅ Update your .env file
2. ✅ Run `npx prisma db push` to create all tables
3. ✅ Start the backend
4. ✅ Test signup and login flow
5. ✅ Verify email sending works

---

## 🔐 Important Security Notes
- The public URL might have a different hostname like `xxxx.railway.app`
- Your password should be embedded in the URL
- Keep this URL secret (treat like a password)
- Never commit to GitHub!

---

## 💡 Example of What We're Looking For
```
postgresql://postgres:MySecurePassword123@railway-postgres-prod-1a2b.railway.app:5432/railway
```

Once you have this, reply with it and I'll set everything up!
