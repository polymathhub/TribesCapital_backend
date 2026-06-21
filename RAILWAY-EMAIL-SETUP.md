# 🚂 Railway Email/SMTP Configuration

**Quick setup for deploying emails on Railway platform**

---

## Railway Email Setup (5 Steps)

### Step 1: Choose Your Provider

**Recommended for Railway:**
- **SendGrid** (Best reliability, free tier good)
- AWS SES (If already using AWS)
- Mailgun (Good option)

### Step 2: Get SMTP Credentials

#### Option A: SendGrid (Recommended)

```
1. Go to https://sendgrid.com/pricing
2. Sign up for free account
3. Go to Settings → API Keys
4. Create new API Key
5. Copy full key (looks like: SG.xxxxxxxxxxxxx)
```

#### Option B: AWS SES

```
1. Go to AWS Console
2. Services → SES
3. Verify sender email
4. Request production access
5. Create SMTP credentials
```

#### Option C: Gmail

```
1. https://myaccount.google.com/apppasswords
2. Generate app password
3. Copy 16-character password (spaces removed)
```

### Step 3: Go to Railway Dashboard

```
1. https://railway.app
2. Select your project
3. Select your app service
4. Click "Variables" tab
5. Add the variables below
```

### Step 4: Set Environment Variables

#### For SendGrid (Recommended)

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-full-api-key-here
EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=Tribes Capital
```

#### For AWS SES

```env
EMAIL_ENABLED=true
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-ses-username
EMAIL_PASSWORD=your-ses-password
EMAIL_FROM=noreply@your-verified-domain.com
EMAIL_FROM_NAME=Tribes Capital
```

#### For Gmail

```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Tribes Capital
```

### Step 5: Deploy & Test

```bash
# 1. Commit changes locally
git add .
git commit -m "chore: enable email for production"

# 2. Push to GitHub (Railway auto-deploys)
git push origin main

# 3. Watch deployment in Railway Dashboard
# Monitor Deployments → Latest → View Logs

# 4. Test email after deployment
curl -X POST https://your-domain.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "TestPassword123!",
    "passwordConfirmation": "TestPassword123!"
  }'

# 5. Check email inbox for verification link
```

---

## Verify Email is Working

### Check 1: Look for Log Message

```
Railway Dashboard → Deployments → Latest → View Logs

Look for:
✅ Email service initialized: smtp.sendgrid.net:587
```

### Check 2: Test Endpoint

```bash
# Register test user
curl -X POST https://your-domain/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "TestPassword123!",
    "passwordConfirmation": "TestPassword123!"
  }'

# Should receive verification email
# Check spam folder if not received
```

### Check 3: Provider Dashboard

- **SendGrid:** Dashboard → Statistics → Email Activity
- **AWS SES:** AWS Console → Sending Statistics
- **Gmail:** Gmail account → Mail activity

---

## Common Issues on Railway

### Issue: "Invalid credentials"

```
Cause: Wrong EMAIL_USER or EMAIL_PASSWORD
Fix: 
  1. Go to provider dashboard
  2. Verify credentials
  3. Update in Railway Variables
  4. Redeploy
```

### Issue: "Cannot connect to SMTP"

```
Cause: Wrong EMAIL_HOST or EMAIL_PORT
Fix: 
  1. Verify provider's SMTP host/port
  2. Update variables
  3. Check internet (Railway has internet)
  4. Redeploy
```

### Issue: "Email not received"

```
Cause: Multiple possibilities
Fix:
  1. Check spam folder
  2. Verify sender email is correct
  3. Check provider's sending limits
  4. Try with different email address
  5. Check provider dashboard for delivery status
```

### Issue: "Email sending but marked as spam"

```
Cause: Sender not verified/domain not configured
Fix:
  1. For SendGrid: Verify domain in dashboard
  2. For AWS SES: Verify sender email
  3. For Gmail: Use verified Google account
  4. Add SPF/DKIM records if using custom domain
```

---

## Email Endpoints on Railway

Once deployed, these endpoints are available:

### Register (Sends Verification Email)
```bash
POST https://your-domain.railway.app/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePassword123!",
  "passwordConfirmation": "SecurePassword123!"
}
```

### Forgot Password (Sends Reset Email)
```bash
POST https://your-domain.railway.app/api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Resend Verification (Sends Verification Email)
```bash
POST https://your-domain.railway.app/api/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

---

## Monitoring Email on Railway

### Real-time Logs

```
Railway Dashboard → Your App → Logs (tab)
- Shows all application output
- Email service logs appear here
- Errors logged in red
```

### Email Delivery Metrics

**SendGrid:**
```
https://app.sendgrid.com/statistics
- Track deliveries
- Monitor bounces
- Check complaint rates
```

**AWS SES:**
```
AWS Console → SES → Sending Statistics
- Bounces
- Complaints
- Delivery rate
```

**Gmail:**
```
Gmail settings → Access and security
- Last account activity
- Connected apps
```

---

## Best Practices for Railway

### 1. Security

- ✅ Never commit credentials to git
- ✅ Use environment variables only
- ✅ Rotate API keys periodically
- ✅ Use app-specific passwords (not main account)

### 2. Reliability

- ✅ Monitor email delivery metrics
- ✅ Set up alerts in provider dashboard
- ✅ Have backup SMTP provider configured
- ✅ Test periodically

### 3. Cost Optimization

- ✅ Use free tier if available
- ✅ Monitor usage
- ✅ Choose provider based on volume
- ✅ Consider bundled services

### 4. Performance

- ✅ Email sending is non-blocking (doesn't stop user flow)
- ✅ Errors don't crash application
- ✅ User experience not affected by email failures

---

## Switching Providers on Railway

**If you want to change providers:**

```bash
# 1. Go to Railway dashboard
# 2. Click Variables tab
# 3. Update the email provider variables:
#    - EMAIL_HOST
#    - EMAIL_PORT
#    - EMAIL_USER
#    - EMAIL_PASSWORD
# 4. Save (auto-redeploys)
# 5. Test new provider
```

Example: Switch from Gmail to SendGrid
```
Before:
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-password

After:
EMAIL_HOST=smtp.sendgrid.net
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-api-key
```

---

## Email Volume Limits

### Development/Testing
```
Gmail: 500/day (free tier)
SendGrid: 100/day (free tier)
AWS SES: 200 (test mode) → 50,000/day (production)
Mailgun: 5,000/month (free tier)
```

### Production Scaling
```
Gmail: 500/day (limited)
SendGrid: Unlimited (upgrade plan)
AWS SES: Unlimited (need higher limit)
Mailgun: Unlimited (upgrade plan)
```

---

## Troubleshooting Checklist

- [ ] EMAIL_ENABLED=true in Railway Variables
- [ ] EMAIL_HOST set to correct provider
- [ ] EMAIL_USER and EMAIL_PASSWORD correct
- [ ] Application redeployed after variable changes
- [ ] Checked email inbox (including spam)
- [ ] Verified provider credentials in dashboard
- [ ] Checked application logs in Railway
- [ ] Provider dashboard shows delivery status
- [ ] Tried with different test email address
- [ ] Confirmed internet connectivity works

---

## Support Resources

- **SendGrid:** https://sendgrid.com/docs
- **AWS SES:** https://docs.aws.amazon.com/ses/
- **Gmail:** https://support.google.com/mail/answer/185833
- **Mailgun:** https://documentation.mailgun.com

---

## Quick Reference

### SendGrid (Easiest Setup)
```
Time to setup: 5 minutes
Cost: FREE tier (100/day)
Quality: Excellent
Recommended: YES ✅
```

### AWS SES (Most Reliable)
```
Time to setup: 10 minutes
Cost: FREE tier (50k/day first year)
Quality: Excellent
Recommended: For high volume
```

### Gmail (Easiest to test)
```
Time to setup: 3 minutes
Cost: FREE
Quality: Good
Recommended: Development only
```

---

## Next Steps

1. ✅ Choose provider (SendGrid recommended)
2. ✅ Get SMTP credentials
3. ✅ Go to Railway dashboard
4. ✅ Add variables to your app service
5. ✅ Deploy (git push)
6. ✅ Test registration
7. ✅ Verify email received ✅

**Expected Time:** 15 minutes
**Difficulty:** Easy
**Status:** Ready to deploy

---

**Last Updated:** 2024-06-21
**For Railway:** ✅ Production Ready
