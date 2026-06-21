# 🚀 Email Architecture & SMTP Integration

## System Overview

**Tribes Capital** uses a clean separation between frontend and backend for email handling:

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  • Email input validation (format check)                         │
│  • Email storage in localStorage                                 │
│  • NO email sending logic (REMOVED/NEVER EXISTED)                │
│  • UI displays messages received from backend                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ (API calls)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (NestJS)                           │
│  • EmailService handles all SMTP operations                      │
│  • Auth endpoints trigger email sending                          │
│  • Email tokens stored in database                               │
│  • Email templates generated server-side                         │
│  • Error handling: graceful failures if email fails              │
└────────────────────────────┬────────────────────────────────────┘
                             │ (SMTP Protocol)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SMTP SERVER (External)                        │
│  • Gmail, SendGrid, AWS SES, Mailgun, etc.                       │
│  • Handles actual email delivery                                 │
│  • Manages bounce/complaint handling                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend: Email Handling

### What Frontend DOES

✅ **Validate Email Format**
```javascript
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
```

✅ **Store Email in localStorage**
```javascript
localStorage.setItem('userEmail', userData.email);
localStorage.setItem('rememberEmail', email);
localStorage.setItem('verificationEmail', email);
```

✅ **Display Messages from Backend**
```javascript
// Receives message: "Check your email for verification link"
// Displays it to user via UI
setNotificationMessage(response.data.message);
```

### What Frontend DOES NOT

❌ No email sending (removed/never existed)
❌ No SMTP connections
❌ No email templates
❌ No email token generation
❌ No email retry logic

---

## Backend: Email Handling (SMTP-Based)

### Email Service Architecture

**File:** `src/modules/auth/services/email.service.ts`

```typescript
@Injectable()
export class EmailService {
  // Initialized with SMTP config from environment
  private transporter: nodemailer.Transporter;
  
  // Sends verification email
  async sendVerificationEmail(data): Promise<boolean>
  
  // Sends password reset email
  async sendPasswordResetEmail(data): Promise<boolean>
  
  // Sends welcome email
  async sendWelcomeEmail(data): Promise<boolean>
  
  // Sends password changed confirmation
  async sendPasswordChangedEmail(data): Promise<boolean>
}
```

### Email Flows

#### 1. Registration → Verification Email

```
User submits registration form
  ↓
POST /api/auth/register
  ↓
Backend validates input
  ↓
Backend generates verification token
  ↓
Backend sends to EMAIL SERVICE
  ↓
EmailService connects to SMTP server
  ↓
SMTP sends verification email
  ↓
Response sent to frontend: "Check your email"
  ↓
User receives email, clicks link
  ↓
Frontend navigates to verify endpoint with token
  ↓
GET /api/auth/verify-email?token=xxx
  ↓
Backend verifies token, marks email verified
  ↓
Backend sends WELCOME EMAIL via EmailService
  ↓
EmailService connects to SMTP server
  ↓
SMTP sends welcome email
```

#### 2. Forgot Password → Reset Email

```
User clicks "Forgot Password"
  ↓
POST /api/auth/forgot-password
  ↓
Backend generates reset token
  ↓
Backend sends to EMAIL SERVICE
  ↓
EmailService connects to SMTP server
  ↓
SMTP sends password reset email
  ↓
Response sent to frontend: "Check your email"
  ↓
User receives email, clicks reset link
  ↓
Frontend navigates to reset page with token
  ↓
POST /api/auth/reset-password
  ↓
Backend verifies token, updates password
  ↓
Backend sends PASSWORD CHANGED EMAIL via EmailService
  ↓
SMTP sends confirmation email
```

---

## Configuration: From Code to SMTP

### 1. Environment Variables

**`.env.local` (Development)**
```env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@tribescapital.com
```

**Railway Dashboard (Production)**
```
EMAIL_ENABLED=true
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-api-key
EMAIL_FROM=noreply@tribescapital.com
```

### 2. Config Loading

**File:** `src/config/email.config.ts`

```typescript
export default registerAs('email', () => ({
  enabled: process.env.EMAIL_ENABLED === 'true',
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
  from: process.env.EMAIL_FROM,
  fromName: process.env.EMAIL_FROM_NAME,
}));
```

### 3. Service Initialization

**EmailService initialization:**

```typescript
constructor(private configService: ConfigService) {
  const emailConfig = this.configService.get('email');
  
  // Connect to SMTP server
  this.transporter = nodemailer.createTransport({
    host: emailConfig.host,        // smtp.sendgrid.net
    port: emailConfig.port,        // 587
    secure: emailConfig.secure,    // false (use STARTTLS)
    auth: {
      user: emailConfig.user,      // apikey
      pass: emailConfig.password,  // SG.xxx
    },
  });
}
```

### 4. Sending Email via SMTP

```typescript
async sendVerificationEmail(data: EmailVerificationEmailData) {
  const html = this.getVerificationEmailTemplate(data);
  
  // Actual SMTP send
  await this.transporter.sendMail({
    from: this.configService.get('email.from'),
    to: data.email,
    subject: 'Verify Your Email Address - Tribes Capital',
    html,  // Pre-generated HTML template
  });
}
```

---

## Email Triggers in Authentication

### Auth Endpoints That Send Email

| Endpoint | Email Type | When |
|----------|-----------|------|
| `POST /api/auth/register` | Verification | After successful registration |
| `GET /api/auth/verify-email?token=xxx` | Welcome | After email verified |
| `POST /api/auth/forgot-password` | Password Reset | User requests password reset |
| `POST /api/auth/reset-password` | Password Changed | After password successfully reset |
| `POST /api/auth/resend-verification` | Verification | User requests new verification email |

---

## Error Handling: Graceful SMTP Failures

### If Email Sending Fails

```typescript
try {
  await this.emailService.sendVerificationEmail({...});
} catch (err) {
  // Log error for debugging
  this.logger.error('Failed to send verification email', err);
  
  // DON'T throw - continue with registration
  // User can request resend later
  
  // Return success to frontend
  return { accessToken, refreshToken, user };
}
```

**Benefits:**
- User can still register even if email fails
- No blocking on email service
- User can resend verification email later
- Better user experience

---

## Email Template System

### How Templates Work

1. **Trigger:** Auth action (register, reset password)
2. **Call EmailService method:** `sendVerificationEmail(data)`
3. **Generate HTML:** `getVerificationEmailTemplate(data)`
4. **Send via SMTP:** `transporter.sendMail(...)`

### Example: Verification Email Template

```typescript
private getVerificationEmailTemplate(data: EmailVerificationEmailData): string {
  return `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif;">
    <h1>Welcome ${data.firstName}!</h1>
    <p>Please verify your email address:</p>
    <a href="${data.verificationLink}" style="...">
      Verify Email
    </a>
    <p style="color: #999; font-size: 12px;">
      This link expires in ${data.expiresIn}
    </p>
  </body>
</html>
  `;
}
```

---

## SMTP Provider Comparison

| Provider | Setup Time | Cost | Limit | Best For |
|----------|-----------|------|-------|----------|
| **Gmail** | 10 min | FREE | 500/day | Development |
| **SendGrid** | 15 min | FREE (100/day) | Unlimited paid | Production |
| **AWS SES** | 20 min | FREE (50k/day, 12mo) | Very High | Enterprise |
| **Mailgun** | 15 min | FREE (5k/mo) | Unlimited paid | Scaling |

---

## Monitoring Email

### Check If Email Service Is Ready

**Look for startup log:**
```
✅ Email service initialized: smtp.sendgrid.net:587
```

### Monitor Email Sending

**In application logs:**
```
✓ Verification email sent to user@example.com
✓ Welcome email sent to user@example.com
✓ Password reset email sent to user@example.com
```

### Check Provider Dashboards

- **Gmail:** Mail activity in browser
- **SendGrid:** Dashboard → Statistics
- **AWS SES:** AWS Console → SES → Sending Statistics
- **Mailgun:** Dashboard → Logs

---

## Security: Email & SMTP

### Data Protection

- ✅ Email addresses hashed in tokens
- ✅ Tokens single-use (marked used immediately)
- ✅ Tokens expire (24 hours for verification, 1 hour for reset)
- ✅ No sensitive data in email body
- ✅ Links include expiry info

### Transport Security

- ✅ STARTTLS encryption (port 587)
- ✅ TLS encryption (port 465)
- ✅ Authentication required
- ✅ No plain text passwords in logs

### SMTP Best Practices

- ✅ Use app-specific passwords (not main account)
- ✅ Keep credentials in environment variables
- ✅ Rotate API keys periodically
- ✅ Monitor failed sends
- ✅ Handle bounces/complaints

---

## Testing Email

### Manual Test

```bash
# 1. Start development server
npm run start:dev

# 2. Register new user (should receive verification email)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@gmail.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "TestPassword123!",
    "passwordConfirmation": "TestPassword123!"
  }'

# 3. Check email inbox for verification link
# 4. Click link to verify
# 5. Should receive welcome email
```

### Automated Testing (Future)

```typescript
// Example test
describe('Email Service', () => {
  it('should send verification email', async () => {
    await emailService.sendVerificationEmail({
      email: 'test@example.com',
      firstName: 'Test',
      verificationLink: 'https://app.com/verify',
      expiresIn: '24 hours'
    });
    // Verify email was sent
  });
});
```

---

## Deployment Checklist

- [ ] Update `.env.local` or Railway Variables with SMTP config
- [ ] Test locally: `npm run start:dev`
- [ ] Verify email received at test address
- [ ] Deploy to Railway
- [ ] Set EMAIL_ENABLED=true in Railway Variables
- [ ] Test production registration
- [ ] Monitor logs for email errors
- [ ] Check provider dashboard for delivery status

---

## Summary

**Frontend:** Email validation & UI only ✅
**Backend:** All SMTP operations via EmailService ✅
**Email:** Sent via external SMTP provider ✅
**Error Handling:** Graceful, non-blocking ✅
**Configuration:** Environment-based, secure ✅
**Monitoring:** Logged and trackable ✅

**System is production-ready!** 🚀

---

**Status:** ✅ Fully SMTP Integrated
**Last Updated:** 2024-06-21
**Version:** 1.0.0
