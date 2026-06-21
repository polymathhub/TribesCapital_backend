# 📧 Quick SMTP Setup Guide

## For Impatient Developers (5-Minute Setup)

### Quick Start

**Choose your provider:**

#### Gmail (Fastest - 3 minutes)
```bash
# 1. Get app password from Google
https://myaccount.google.com/apppasswords

# 2. Update .env.local
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx

# 3. Restart server
npm run start:dev

# 4. Test
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","firstName":"Test","lastName":"User","password":"TestPassword123!","passwordConfirmation":"TestPassword123!"}'

# 5. Check Gmail inbox for verification email
```

#### SendGrid (Production - 5 minutes)
```bash
# 1. Create account
https://sendgrid.com/pricing

# 2. Generate API key
Dashboard → Settings → API Keys → Create

# 3. Update .env.local
EMAIL_ENABLED=true
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-full-api-key

# 4. Restart server
npm run start:dev

# 5. Test same as above
```

---

## What Was Done

✅ **Removed:** Frontend email sending logic (never existed - only validation)
✅ **Configured:** Backend SMTP service (EmailService with Nodemailer)
✅ **Set up:** Environment variables for SMTP providers
✅ **Created:** Complete documentation for all providers
✅ **Enabled:** Email verification on registration
✅ **Enabled:** Password reset emails
✅ **Enabled:** Welcome emails
✅ **Enabled:** Password changed confirmations

---

## Files Updated

```
✨ Created:
  ├── SMTP-SETUP.md              (Complete SMTP setup guide)
  ├── EMAIL-ARCHITECTURE.md      (System architecture explanation)
  └── SMTP-QUICK-REFERENCE.md   (This file)

🔧 Modified:
  ├── .env.local                 (SMTP configuration ready)
  ├── .env.example              (Provider examples)
  └── src/config/email.config.ts (Already configured)
```

---

## Email Flow

```
User Registration
  ↓
Backend validates input
  ↓
Generate verification token
  ↓
Call EmailService.sendVerificationEmail()
  ↓
EmailService connects to SMTP server
  ↓
SMTP sends email
  ↓
User receives verification link in email
  ↓
User clicks link
  ↓
Backend verifies token
  ↓
Send welcome email via SMTP
  ↓
User logged in ✅
```

---

## Environment Variables

```env
# Enable email sending
EMAIL_ENABLED=true

# SMTP Server (choose one provider)
EMAIL_HOST=smtp.gmail.com          # Gmail
# EMAIL_HOST=smtp.sendgrid.net     # SendGrid
# EMAIL_HOST=email-smtp.region...  # AWS SES

EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@tribescapital.com
EMAIL_FROM_NAME=Tribes Capital
```

---

## Common Issues

| Issue | Fix |
|-------|-----|
| "Invalid credentials" | Check username/password in provider dashboard |
| "Cannot connect" | Check internet, verify SMTP host/port |
| "Email not received" | Check spam folder, verify sender email |
| "500 error" | Check EMAIL_ENABLED=true and restart server |

---

## Test Commands

```bash
# Register (sends verification email)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "Password123!",
    "passwordConfirmation": "Password123!"
  }'

# Forgot password (sends reset email)
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Resend verification
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## For Production (Railway)

1. Go to Railway Dashboard
2. Select your app service
3. Click Variables
4. Add:
   ```
   EMAIL_ENABLED=true
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.your-api-key
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Your App Name
   ```
5. Deploy
6. Test registration - should receive email

---

## What's NOT Changed

- ✅ Frontend still validates email format
- ✅ Frontend still stores email in localStorage
- ✅ Frontend sends API requests normally
- ✅ Backend auth logic unchanged
- ✅ Database schema unchanged
- ❌ NO code removed from frontend (was never sending emails anyway)
- ❌ NO breaking changes

---

## Next Steps

1. Choose SMTP provider (Gmail for dev, SendGrid for production)
2. Update `.env.local` with credentials
3. Restart server
4. Test registration
5. Check email inbox
6. Done! ✅

---

**Status:** Ready to use
**Setup Time:** 5-10 minutes
**Difficulty:** Easy

For detailed setup, see [SMTP-SETUP.md](./SMTP-SETUP.md)
