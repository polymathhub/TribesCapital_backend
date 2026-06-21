# User Signup Tracking - Complete Flow

## Overview

Every user signup is now **fully recorded in the database** with comprehensive audit logging. This document explains the complete tracking flow.

---

## Where Users Are Recorded

### **1. User Table**
When a user signs up, they're created in the `User` table with:
- ✅ Unique email (enforced)
- ✅ First name, last name
- ✅ Hashed password (bcrypt 12 rounds)
- ✅ Email verification status
- ✅ Created timestamp
- ✅ Active status
- ✅ Assigned role (default: "user")

### **2. Audit Log Table**
Every signup is logged in the `AuditLog` table with:
- ✅ User ID (who registered)
- ✅ Action: `user_registered` or `user_registered_oauth`
- ✅ IP address (where signup came from)
- ✅ User agent (device/browser info)
- ✅ Timestamp
- ✅ Metadata (email, name, roles assigned)

### **3. Role Assignment**
Each user gets default role in `UserRoles` junction table:
- Default: "user" role
- Optional: Admin, moderator, or other custom roles

---

## Signup Flow with Tracking

### **Email-Based Signup**

```
1. User submits registration form
   └─ Email, firstName, lastName, password

2. Validation (performed by NestJS DTO)
   ├─ Email format valid?
   ├─ Password strong? (12+ chars, uppercase, lowercase, number, symbol)
   ├─ Passwords match?
   └─ Email already registered? (DUPLICATE EMAIL LOGGED)

3. User created in database
   └─ Email verified: true (if allowed by config)
   └─ Role: "user"
   └─ Created timestamp recorded

4. ✅ AUDIT LOG ENTRY #1: "user_registered"
   ├─ userId: [new user ID]
   ├─ action: "user_registered"
   ├─ ipAddress: [client IP]
   ├─ userAgent: [browser info]
   ├─ status: "success"
   └─ metadata: { email, firstName, lastName, roles }

5. JWT tokens generated and returned to user
   ├─ Access token (15-minute expiry)
   └─ Refresh token (7-day expiry)

6. ✅ OPTIONAL: If email verification enabled
   └─ Verification email sent
   └─ When user verifies: "email_verified" audit log entry
```

### **Google OAuth Signup**

```
1. User clicks "Sign in with Google"
   └─ Google ID token provided

2. Token verified with Google
   └─ Extract: email, given_name, family_name

3. Check if user exists by email
   └─ If exists: User logged in
   └─ If new: User created

4. ✅ NEW USER AUDIT LOG: "user_registered_oauth"
   ├─ userId: [new user ID]
   ├─ action: "user_registered_oauth"
   ├─ ipAddress: [client IP]
   ├─ userAgent: [browser info]
   └─ metadata: { email, googleId }

5. Email automatically marked verified
   └─ emailVerified: true
   └─ (Google has already verified the email)
```

---

## Failed Signup Tracking

If signup fails, it's STILL LOGGED:

### **Duplicate Email**
```
✅ AUDIT LOG ENTRY: "registration_attempted"
├─ userId: [existing user ID]
├─ action: "registration_attempted"
├─ ipAddress: [client IP]
├─ userAgent: [browser info]
├─ status: "failure"
└─ metadata: { reason: "Email already registered" }
```

### **Password Mismatch**
```
❌ Rejected before database (validation layer)
└─ No log entry (no duplicate risk)
```

---

## Database Schema

### **User Table**
```sql
SELECT 
  id,
  email,
  firstName,
  lastName,
  emailVerified,
  isActive,
  createdAt,
  updatedAt
FROM "User"
WHERE createdAt >= NOW() - INTERVAL '24 hours'
ORDER BY createdAt DESC;
```

### **AuditLog Table**
```sql
SELECT 
  userId,
  action,
  resource,
  ipAddress,
  userAgent,
  status,
  metadata,
  createdAt
FROM "AuditLog"
WHERE action IN ('user_registered', 'user_registered_oauth', 'registration_attempted')
ORDER BY createdAt DESC;
```

### **View All Signups Today**
```sql
SELECT 
  u.id,
  u.email,
  u.firstName,
  u.lastName,
  u."createdAt",
  al.action,
  al.ipAddress,
  al.metadata
FROM "User" u
LEFT JOIN "AuditLog" al ON u.id = al.userId AND al.action IN ('user_registered', 'user_registered_oauth')
WHERE DATE(u."createdAt") = CURRENT_DATE
ORDER BY u."createdAt" DESC;
```

---

## API Response Examples

### **Successful Signup Response (201 Created)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cuid123456789",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": null,
    "bio": null,
    "isActive": true,
    "emailVerified": true,
    "roles": [
      {
        "id": "role123",
        "name": "user"
      }
    ]
  }
}
```

✅ **User is now in database**  
✅ **Audit log created**  
✅ **Role assigned**  

### **Duplicate Email Response (409 Conflict)**

```json
{
  "statusCode": 409,
  "message": "Email already registered",
  "timestamp": "2026-06-21T12:34:56.789Z"
}
```

⚠️ **Failed attempt logged in audit trail**  

---

## Verification Commands

### **List All Users Registered Today**

```bash
# Via Prisma Studio
npx prisma studio

# Then navigate to User table, filter by createdAt >= today

# Or via SQL (if you have database access)
psql postgresql://user:pass@host/db
SELECT id, email, firstName, lastName, createdAt FROM "User" 
WHERE DATE(createdAt) = CURRENT_DATE 
ORDER BY createdAt DESC;
```

### **List All Signup Audit Logs**

```bash
# Via Prisma Studio
# Navigate to AuditLog table, filter by action = 'user_registered'

# Or via SQL
SELECT userId, action, status, metadata, createdAt, ipAddress 
FROM "AuditLog" 
WHERE action IN ('user_registered', 'user_registered_oauth', 'registration_attempted')
ORDER BY createdAt DESC;
```

### **Track Specific User Signup**

```bash
# Backend logs (Docker/Railway logs)
# Look for: "User registered: user@example.com"
# Look for: Audit log with "user_registered" action
```

---

## What Gets Tracked Per Signup

| Field | Tracked | Storage |
|-------|---------|---------|
| **Email** | ✅ | User table + AuditLog |
| **Password** | ✅ (hashed) | User table only |
| **Name** | ✅ | User table + AuditLog |
| **IP Address** | ✅ | AuditLog only |
| **User Agent** | ✅ | AuditLog only |
| **Device/Browser** | ✅ | Extracted from User Agent |
| **Timestamp** | ✅ | User table + AuditLog |
| **Role Assigned** | ✅ | UserRoles table + AuditLog |
| **Auth Method** | ✅ | AuditLog (email vs OAuth) |
| **Failure Reason** | ✅ | AuditLog (if failed) |

---

## Security Features

### **Email Uniqueness**
- ✅ Database constraint: `UNIQUE(email)`
- ✅ Duplicate signup attempts logged
- ✅ User can't register twice with same email

### **Password Security**
- ✅ Bcrypt hashing with 12 rounds
- ✅ Strong password requirements enforced
- ✅ Passwords never logged in audit trail

### **IP Tracking**
- ✅ Every signup includes source IP
- ✅ Can identify suspicious patterns
- ✅ Rate limiting can be implemented

### **Audit Trail**
- ✅ Immutable logs for compliance
- ✅ Tracks both success and failures
- ✅ Includes authentication method

---

## Monitoring Signup Health

### **Check Recent Signups (Last 24 Hours)**

```bash
curl -X GET https://your-domain.com/api/health

# Backend logs should show:
# ✓ Database connected
# ✓ Startup validation passed
```

### **Monitor via Database**

Using Prisma Studio (local development):
```bash
npx prisma studio
```
- Open `User` table → sort by `createdAt DESC`
- Open `AuditLog` table → filter `action = "user_registered"`

Using Railway Database UI:
1. Go to Railway Dashboard
2. Select PostgreSQL service
3. Open "Connect" → "Database Client" or use browser
4. Run queries above

---

## Troubleshooting

| Issue | Check | Solution |
|-------|-------|----------|
| **User not in database after signup** | Check logs for errors | Verify DATABASE_URL set correctly |
| **Audit log missing** | Check AuditLog table | Audit service might have failed silently |
| **Duplicate email still created** | Check unique constraint | Verify Prisma migrations applied |
| **Wrong role assigned** | Check UserRoles table | Verify role setup in database |
| **Can't see IP address in logs** | Check audit logs | Verify IP passed from controller |

---

## Summary

✅ **All signups recorded in User table**  
✅ **All signup events logged in AuditLog**  
✅ **IP addresses tracked**  
✅ **Authentication method recorded (email vs OAuth)**  
✅ **Failed attempts logged**  
✅ **User roles assigned and tracked**  
✅ **Complete audit trail for compliance**  

**Every signup is now fully tracked and auditable!** 🎉
