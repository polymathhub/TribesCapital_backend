# 📧 SMTP Email Configuration Guide

**Tribes Capital Backend** - Complete email setup for production

---

## Quick Start

### Enable Email Sending

1. **In `.env.local` (or Railway Variables):**
   ```env
   EMAIL_ENABLED=true
   ```

2. **Choose your SMTP provider** (see options below)

3. **Update credentials** in `.env.local`

4. **Test:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "firstName": "Test",
       "lastName": "User",
       "password": "TestPassword123!",
       "passwordConfirmation": "TestPassword123!"
     }'
   # You should receive a verification email
   ```

---

## Email Providers Setup

### Option 1: Gmail SMTP (Recommended for Small Projects)

**Best for:** Development, small deployments, testing
**Limit:** 500 emails/day (free tier)
**Cost:** FREE

#### Setup Steps:

1. **Go to Google Account Security:**
   - https://myaccount.google.com/security

2. **Enable 2-Factor Authentication:**
   - If not already enabled

3. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google generates a 16-character password
   - Copy this password

4. **Update `.env.local`:**
   ```env
   EMAIL_ENABLED=true
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   EMAIL_FROM=noreply@tribescapital.com
   EMAIL_FROM_NAME=Tribes Capital
   ```

5. **Test:**
   ```bash
   npm run start:dev
   # Register new user → should receive verification email
   ```

**Troubleshooting:**
- Error: "Invalid login" → Check app password is correct (16 chars)
- Error: "ECONNREFUSED" → Check internet connection
- Email not received → Check Gmail spam folder

---

### Option 2: SendGrid SMTP (Recommended for Production)

**Best for:** Production deployments, high reliability
**Limit:** 100 emails/day (free tier), unlimited paid
**Cost:** FREE tier available, paid tiers start at $9.95/month

#### Setup Steps:

1. **Create SendGrid Account:**
   - Go to https://sendgrid.com/pricing
   - Sign up for free tier

2. **Generate API Key:**
   - Dashboard → Settings → API Keys
   - Create new key with "Mail Send" access
   - Copy the full API key

3. **Create Sender Email:**
   - Dashboard → Sender Authentication
   - Add your domain (e.g., tribescapital.com)
   - Or use the default sender email

4. **Update `.env.local`:**
   ```env
   EMAIL_ENABLED=true
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.your-full-api-key-here
   EMAIL_FROM=noreply@tribescapital.com
   EMAIL_FROM_NAME=Tribes Capital
   ```

5. **Test:**
   ```bash
   npm run start:dev
   # Register new user → should receive email via SendGrid
   ```

**Troubleshooting:**
- Error: "Invalid credentials" → Check username is exactly "apikey"
- Error: "550 Unauthenticated senders not allowed" → Add sender email to SendGrid

---

### Option 3: AWS SES (Recommended for High Volume)

**Best for:** Large deployments, high email volume
**Limit:** 50,000 emails/day (free tier)
**Cost:** FREE tier for first 12 months

#### Setup Steps:

1. **Create AWS Account:**
   - Go to https://console.aws.amazon.com

2. **Request Production Access:**
   - SES Dashboard → Account Dashboard → Sending limits
   - Request limit increase if needed

3. **Verify Sender Email:**
   - SES Dashboard → Verified Identities
   - Add your sender email (e.g., noreply@tribescapital.com)
   - Verify the link in your email

4. **Create SMTP Credentials:**
   - SES Dashboard → Account Settings → SMTP Settings
   - Click "Create My SMTP Credentials"
   - Save the username and password

5. **Find SMTP Endpoint:**
   - SES Dashboard → Account Settings → SMTP Settings
   - Note your region (e.g., us-east-1)

6. **Update `.env.local`:**
   ```env
   EMAIL_ENABLED=true
   EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=AKIA...
   EMAIL_PASSWORD=your-generated-smtp-password
   EMAIL_FROM=noreply@tribescapital.com
   EMAIL_FROM_NAME=Tribes Capital
   ```

7. **Test:**
   ```bash
   npm run start:dev
   # Register new user → should receive email via AWS SES
   ```

**Troubleshooting:**
- Error: "Account not in Production Access" → Request limit increase in AWS
- Error: "InvalidParameterValue" → Verify sender email in SES dashboard

---

### Option 4: Mailgun SMTP

**Best for:** Simple setup, developer-friendly
**Limit:** 5,000 emails/month (free tier)
**Cost:** FREE tier available, paid plans available

#### Setup Steps:

1. **Create Mailgun Account:**
   - Go to https://mailgun.com

2. **Create Domain:**
   - Dashboard → Domains → Add New Domain
   - Add your domain (e.g., tribescapital.com)
   - Or use sandbox domain (provided)

3. **Get SMTP Credentials:**
   - Click on your domain
   - Scroll to SMTP Settings
   - Copy username and password

4. **Update `.env.local`:**
   ```env
   EMAIL_ENABLED=true
   EMAIL_HOST=smtp.mailgun.org
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=postmaster@sandbox-your-domain.mailgun.org
   EMAIL_PASSWORD=your-mailgun-password
   EMAIL_FROM=noreply@tribescapital.com
   EMAIL_FROM_NAME=Tribes Capital
   ```

5. **Test:**
   ```bash
   npm run start:dev
   # Register new user → should receive email via Mailgun
   ```

---

## Email Flows in Application

### 1. User Registration
```
User signs up
↓
Backend verifies password format
↓
Backend generates verification token
↓
SMTP sends verification email to user
↓
User clicks link in email
↓
Backend verifies token & marks email as verified
↓
User logged in
```

### 2. Password Reset
```
User clicks "Forgot Password"
↓
Backend generates password reset token
↓
SMTP sends reset link to email
↓
User clicks link
↓
User enters new password
↓
Backend verifies token & updates password
↓
SMTP sends password changed confirmation email
```

### 3. Welcome Email
```
User completes email verification
↓
SMTP sends welcome email
```

---

## Environment Variables Reference

```env
# Enable/Disable Email Sending
EMAIL_ENABLED=true|false

# SMTP Server Configuration
EMAIL_HOST=smtp.provider.com
EMAIL_PORT=587
EMAIL_SECURE=false              # true for port 465 (TLS), false for 587 (STARTTLS)

# SMTP Authentication
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password

# Sender Details
EMAIL_FROM=noreply@tribescapital.com
EMAIL_FROM_NAME=Tribes Capital

# Email Token Expiry (seconds)
EMAIL_VERIFICATION_EXPIRY=86400  # 24 hours
PASSWORD_RESET_EXPIRY=3600       # 1 hour
```

---

## Email Template System

### Current Templates

The email service provides these email templates:

1. **Verification Email**
   - Sent on registration
   - Contains verification link
   - 24-hour expiry

2. **Password Reset Email**
   - Sent on forgot password
   - Contains reset link
   - 1-hour expiry

3. **Welcome Email**
   - Sent after email verification
   - Welcome message

4. **Password Changed Email**
   - Sent after password reset
   - Security confirmation

### Email Service Methods

```typescript
// Verification email
await emailService.sendVerificationEmail({
  email: 'user@example.com',
  firstName: 'John',
  verificationLink: 'https://app.com/verify?token=xxx',
  expiresIn: '24 hours'
});

// Password reset email
await emailService.sendPasswordResetEmail({
  email: 'user@example.com',
  firstName: 'John',
  resetLink: 'https://app.com/reset-password?token=xxx',
  expiresIn: '1 hour'
});

// Welcome email
await emailService.sendWelcomeEmail({
  email: 'user@example.com',
  firstName: 'John'
});

// Password changed confirmation
await emailService.sendPasswordChangedEmail({
  email: 'user@example.com',
  firstName: 'John'
});
```

---

## Testing Email Configuration

### 1. Test Locally

```bash
# Start dev server
npm run start:dev

# Register new user (should receive verification email)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@gmail.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "TestPassword123!",
    "passwordConfirmation": "TestPassword123!"
  }'
```

### 2. Check Email Service Status

```
Look for log message:
✅ Email service initialized: smtp.provider.com:587
```

### 3. Verify Email Received

- Check inbox (not spam folder)
- Verify links are clickable
- Check that sender address matches EMAIL_FROM

### 4. Test Other Flows

**Forgot Password:**
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@gmail.com"}'
```

---

## Production Deployment

### Railway Deployment

1. **Set Variables in Railway Dashboard:**

   Go to Railway → Your Project → Your App Service → Variables

   ```env
   EMAIL_ENABLED=true
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.your-api-key
   EMAIL_FROM=noreply@tribescapital.com
   EMAIL_FROM_NAME=Tribes Capital
   ```

2. **Deploy:**
   ```bash
   git push origin main
   # Railway auto-deploys with new environment variables
   ```

3. **Verify:**
   ```bash
   curl -X POST https://your-domain/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "testuser@example.com",
       "firstName": "Test",
       "lastName": "User",
       "password": "TestPassword123!",
       "passwordConfirmation": "TestPassword123!"
     }'
   # Should receive email at testuser@example.com
   ```

---

## Monitoring & Troubleshooting

### Check Email Service Status

```
Look in application logs for:
✅ Email service initialized: smtp.provider.com:587
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid credentials" | Wrong password/username | Verify in provider dashboard |
| "ECONNREFUSED" | Cannot connect to SMTP server | Check hostname, port, internet connection |
| "530 Authentication required" | Not authenticated | Check EMAIL_USER and EMAIL_PASSWORD |
| "550 Sender not authorized" | Email not verified | Verify sender email in provider |
| "No response from server" | Server down/blocked | Check provider status page |

### Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
```

View detailed email service logs in app output.

---

## Email Headers & Security

All emails include:

- Sender verification
- Authentication
- Timestamp
- Token expiry information
- Security warnings where appropriate

---

## GDPR & Privacy Compliance

- Email addresses hashed when stored in tokens
- Tokens single-use (marked as used)
- Tokens expire automatically
- No email tracking pixels
- Minimal user data in emails

---

## Best Practices

### Development
- Use Gmail free tier
- Test with personal email address
- Check spam folder for emails

### Staging
- Use SendGrid free tier
- Test with multiple email addresses
- Monitor delivery rates

### Production
- Use dedicated email provider (SendGrid, AWS SES, Mailgun)
- Monitor delivery metrics
- Set up bounce/complaint handling
- Keep API keys secure (use environment variables)
- Monitor sender reputation

---

## Support & Resources

- **Gmail Setup:** https://support.google.com/mail/answer/185833
- **SendGrid Setup:** https://docs.sendgrid.com/for-developers
- **AWS SES Setup:** https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html
- **Mailgun Setup:** https://documentation.mailgun.com/en/latest/quickstart-sending.html

---

**Status:** ✅ Ready for Configuration
**Last Updated:** 2024-06-21
**Version:** 1.0.0
