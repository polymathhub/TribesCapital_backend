# Google OAuth Implementation Guide

## Overview

This guide explains how to implement Google OAuth authentication for both the backend and frontend.

## Backend Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URL=http://localhost:5173/auth/callback
```

**Important:** The `GOOGLE_CLIENT_ID` must match the client ID configured in your Google Cloud Console and the one you use in the frontend Google Sign-In configuration.

### 2. Backend Flow

The endpoint `POST /auth/google` handles the OAuth callback:

```
Frontend (Google Sign-In) 
  ↓ (idToken + accessToken)
Backend (POST /auth/google)
  ↓
Token Verification (validates signature with Google's public keys)
  ↓
User Lookup/Creation
  ↓
JWT Token Generation
  ↓
Response (accessToken + refreshToken + user)
```

### 3. Backend Process Details

#### Token Verification
- Fetches Google's public keys from https://www.googleapis.com/oauth2/v1/certs
- Validates JWT signature using RS256 algorithm
- Verifies token expiration
- Confirms email is verified by Google
- Validates token audience against Google Client ID
- Validates token issuer is Google

#### User Management
- **New User:** Creates account with auto-verified email, random password
- **Existing User (no Google ID):** Links Google account to existing user
- **Existing User (different Google ID):** Returns error (security measure)

#### Login Tracking
- Updates `lastLogin`, `lastLoginIp`, `lastLoginUserAgent`
- Clears failed login attempts and lockouts
- Creates audit log entry

## Frontend Setup

### 1. Install Google Sign-In Library

```html
<!-- Add to index.html -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### 2. Initialize Google Sign-In

```javascript
// In your authentication setup
window.google.accounts.id.initialize({
  client_id: 'your-client-id.apps.googleusercontent.com',
  callback: handleCredentialResponse,
  ux_mode: 'popup', // or 'redirect'
});

// Display the Google Sign-In button
window.google.accounts.id.renderButton(
  document.getElementById('google-signin-button'),
  {
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
  }
);
```

### 3. Handle Sign-In Response

```javascript
async function handleCredentialResponse(response) {
  try {
    // Send ID token to backend
    const authResponse = await fetch('http://localhost:3000/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: response.credential,
        accessToken: response.accessToken || '',
      }),
    });

    if (!authResponse.ok) {
      const error = await authResponse.json();
      console.error('OAuth failed:', error);
      return;
    }

    const data = await authResponse.json();

    // Store tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    // Update user state
    setUser(data.user);

    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    console.error('OAuth error:', error);
  }
}
```

### 4. Add Google Sign-In Button to Auth Page

```jsx
// AuthPage.jsx
import { useEffect, useRef } from 'react';

export function AuthPage() {
  const googleButtonRef = useRef();

  useEffect(() => {
    if (window.google && googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
      });
    }
  }, []);

  return (
    <div>
      {/* Traditional login form */}
      {/* ... */}

      {/* Google Sign-In Button */}
      <div
        ref={googleButtonRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '20px',
        }}
      />
    </div>
  );
}
```

## Security Considerations

### 1. Token Verification
- ✅ Validates JWT signature using Google's public keys
- ✅ Checks token expiration
- ✅ Verifies token audience (Client ID)
- ✅ Confirms email verified by Google
- ✅ Caches public keys for performance (1-hour TTL)

### 2. Account Linking
- ⚠️ Prevents linking different Google accounts to same email
- ✅ Supports linking Google to existing email accounts
- ✅ Tracks Google ID linking in audit logs

### 3. Email Security
- ✅ Auto-verifies emails from Google (Google has already verified)
- ✅ Stores lowercase email for consistency
- ✅ Prevents account enumeration

### 4. Rate Limiting
- Consider adding rate limiting to `/auth/google` endpoint
- Current implementation: No built-in rate limit (recommended: 10 requests/min per IP)

## Testing

### Manual Testing

1. **Frontend Test**
   ```bash
   # Start frontend
   cd frontend
   npm install
   npm run dev
   ```

2. **Backend Test**
   ```bash
   # Start backend
   npm run start:dev
   ```

3. **Test OAuth Flow**
   - Navigate to http://localhost:5173
   - Click Google Sign-In button
   - Sign in with Google account
   - Check browser console for tokens
   - Verify redirect to dashboard

### Curl Testing

```bash
# Get a valid Google ID token first (from Google Sign-In on frontend)
# Then test backend

curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "your-id-token-here",
    "accessToken": "your-access-token-here"
  }'
```

## Troubleshooting

### "Invalid token audience"
- **Cause:** Frontend client ID doesn't match backend `GOOGLE_CLIENT_ID`
- **Fix:** Ensure `GOOGLE_CLIENT_ID` in `.env` matches frontend configuration

### "Token has expired"
- **Cause:** ID token is older than 1 hour
- **Fix:** Get fresh token from Google Sign-In (tokens auto-refresh in the library)

### "Invalid token signature"
- **Cause:** Can't fetch Google's public keys
- **Fix:** Check internet connection, Google's servers are reachable
- **Fallback:** Service will retry with cached keys

### "Email not verified by Google"
- **Cause:** User hasn't verified email with Google
- **Fix:** User must verify email in Google account

### "This email is already linked to a different Google account"
- **Cause:** User has existing account with different Google ID
- **Fix:** User must login with original Google account or contact support

## Production Checklist

- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in production environment
- [ ] Set `GOOGLE_REDIRECT_URL` to production domain
- [ ] Enable HTTPS for Google Sign-In (required)
- [ ] Add rate limiting to `/auth/google` endpoint
- [ ] Configure CORS for frontend domain
- [ ] Monitor token verification failures in logs
- [ ] Test account linking edge cases
- [ ] Document account linking policy for users
- [ ] Set up alerts for OAuth verification failures
- [ ] Add frontend error handling for all OAuth failure scenarios

## API Reference

### POST /auth/google

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ...",
  "accessToken": "ya29.a0AfH6SMB..."
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true
  }
}
```

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "Invalid token format",
  "error": "Bad Request"
}
```

**Common Error Messages:**
- `Invalid token format` - Token structure is malformed
- `Token has expired` - ID token is older than 1 hour
- `Invalid token signature` - Cannot verify token authenticity
- `Missing required token claims` - Token missing email, sub, exp, iss, or aud
- `Invalid token issuer` - Token not from Google
- `Email not verified by Google` - User hasn't verified email with Google
- `This email is already linked to a different Google account` - Account linking conflict
- `Account is inactive` - User account has been deactivated

## Architecture Notes

### Token Verification Flow
```
ID Token (JWT) 
  ↓
1. Decode without verification (get header/payload)
  ↓
2. Extract key ID (kid) from header
  ↓
3. Fetch Google public key using kid
  ↓
4. Verify signature using RS256 algorithm
  ↓
5. Validate claims (iss, aud, exp, email_verified)
  ↓
6. Return validated payload
```

### Public Key Caching
- Keys cached in memory for 1 hour
- Reduces latency for token verification
- Automatic fallback to fetch if cache expired
- Graceful degradation if fetch fails (uses stale cache)

### User Creation Fields
- **email** - Extracted from token (lowercase)
- **firstName** - From `given_name` or defaults to "User"
- **lastName** - From `family_name` or empty string
- **googleId** - From token `sub` claim
- **password** - Random 32-byte hex (user cannot login with password)
- **emailVerified** - Set to true (Google verified)
- **isActive** - Set to true

## Related Documentation

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [JWT Token Verification](https://tools.ietf.org/html/rfc7519)
