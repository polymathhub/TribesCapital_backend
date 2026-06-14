# Google OAuth Frontend Integration Guide

## Quick Start

### 1. Add Google Sign-In Library to HTML

Edit `frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- ... other head content ... -->
    
    <!-- Google Sign-In Library (add before closing head tag) -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 2. Add Google Client ID to Environment

Create/update `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Get your Client ID from [Google Cloud Console](https://console.cloud.google.com):
1. Create OAuth 2.0 credentials (Web application)
2. Add Authorized JavaScript origins: `http://localhost:5173` (dev), `https://yourdomain.com` (prod)
3. Copy the Client ID

### 3. Use GoogleSignIn Component

Import and use the component in your AuthPage:

```jsx
// AuthPage.jsx
import { useState } from 'react';
import GoogleSignIn from '../components/GoogleSignIn';

export function AuthPage() {
  const [authMethod, setAuthMethod] = useState('login'); // 'login', 'signup', or 'google'

  const handleGoogleSuccess = (user) => {
    console.log('User signed in:', user);
    // Redirect happens automatically, or handle custom logic
  };

  const handleGoogleError = (error) => {
    console.error('Google sign in error:', error);
  };

  return (
    <div className="auth-container">
      {/* Google Sign-In Section */}
      <section>
        <h2>Sign In with Google</h2>
        <GoogleSignIn
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          autoRedirect={true}
          redirectPath="/dashboard"
          text="signin_with"
          theme="outline"
          size="large"
        />
      </section>

      <div className="divider">OR</div>

      {/* Traditional login form (existing code) */}
      <section>
        <h2>Email & Password</h2>
        {/* ... existing login/signup form ... */}
      </section>
    </div>
  );
}
```

## Component Props

```typescript
interface GoogleSignInProps {
  // Callback when sign-in succeeds
  onSuccess?: (user: any) => void;

  // Callback when sign-in fails
  onError?: (error: string) => void;

  // Auto-redirect to dashboard on success
  autoRedirect?: boolean;      // default: true

  // Path to redirect to on success
  redirectPath?: string;       // default: '/dashboard'

  // Button text
  text?: 'signin_with' | 'signin' | 'signup_with' | 'signup';
  // default: 'signin_with'

  // Button theme
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  // default: 'outline'

  // Button size
  size?: 'large' | 'medium' | 'small';  // default: 'large'

  // Button width (CSS value)
  width?: string;              // default: '100%'
}
```

## Complete AuthPage Example

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleSignIn from '../components/GoogleSignIn';
import { authAPI } from '../api/endpoints';

export function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.post('/login', {
        email,
        password,
      });

      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = (user) => {
    console.log('Signed in with Google:', user);
    // Auto-redirect is enabled by default in GoogleSignIn component
  };

  const handleGoogleError = (error) => {
    setError(error);
  };

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '50px auto',
        padding: '20px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
      }}
    >
      <h1>Sign In</h1>

      {/* Google Sign-In Section */}
      <section style={{ marginBottom: '30px' }}>
        <GoogleSignIn
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          autoRedirect={true}
          text="signin_with"
        />
      </section>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          margin: '20px 0',
          color: '#9ca3af',
        }}
      >
        <hr style={{ flex: 1 }} />
        <span style={{ padding: '0 10px' }}>OR</span>
        <hr style={{ flex: 1 }} />
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailLogin}>
        {error && (
          <div
            style={{
              padding: '10px',
              marginBottom: '15px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#5b21b6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
```

## Error Handling

The GoogleSignIn component provides built-in error handling:

```jsx
<GoogleSignIn
  onError={(error) => {
    if (error.includes('already linked')) {
      // Handle account linking conflict
    } else if (error.includes('not verified')) {
      // Handle unverified email
    } else if (error.includes('inactive')) {
      // Handle deactivated account
    } else {
      // Handle generic error
    }
  }}
/>
```

## Testing Locally

```bash
# 1. Add VITE_GOOGLE_CLIENT_ID to frontend/.env
echo "VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com" >> frontend/.env

# 2. Start the frontend dev server
cd frontend
npm install
npm run dev

# 3. Start the backend dev server (in another terminal)
npm run start:dev

# 4. Open browser to http://localhost:5173
# 5. Click Google Sign-In button
# 6. Check browser console for tokens and user info
```

## TypeScript Support

The GoogleSignIn component is fully typed:

```tsx
import { GoogleSignIn } from '../components/GoogleSignIn';

// TypeScript will show intellisense for all props
<GoogleSignIn
  onSuccess={(user) => {
    // user is typed with full properties
    console.log(user.email, user.id);
  }}
  onError={(error) => {
    // error is a string
    console.error(error);
  }}
  theme="outline"
  size="large"
/>
```

## Styling Customization

### Option 1: Google's Built-in Styles (Recommended)

The Google Sign-In button automatically uses your configured theme and size.

### Option 2: Custom Styling

Wrap the component in a styled container:

```jsx
<div style={{
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  maxWidth: '400px',
}}>
  <GoogleSignIn
    width="100%"
    size="large"
    theme="outline"
  />
</div>
```

### Option 3: Mobile Responsive

```jsx
<GoogleSignIn
  size={isMobile ? 'medium' : 'large'}
  width={isMobile ? '100%' : '300px'}
  text={isMobile ? 'signin' : 'signin_with'}
/>
```

## Account Linking Scenarios

### Scenario 1: New User (No Existing Account)
```
Google Sign-In → No email match → Create new user → Return tokens
```

### Scenario 2: Existing Email (Not Yet Linked)
```
Google Sign-In → Email match found → Link Google ID → Return tokens
```

### Scenario 3: Email Already Linked
```
Google Sign-In → Email match with different Google ID → Error
```

Users in Scenario 3 must:
1. Sign in with their existing Google account (use that one)
2. Or contact support to unlink and relink

## Production Deployment

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add Authorized JavaScript origins:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
   - `http://localhost:5173` (for local development)
4. Copy the Client ID
5. Set `VITE_GOOGLE_CLIENT_ID` in production environment

### Backend Setup

1. Set environment variables:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-secret
   GOOGLE_REDIRECT_URL=https://yourdomain.com/auth/callback
   ```

2. Deploy backend to production

### Frontend Setup

1. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy to production (Vercel, Netlify, etc.)

3. Ensure `VITE_GOOGLE_CLIENT_ID` is set in production environment

## Debugging

### Enable Debug Logging

```jsx
// Modify GoogleSignIn component or set global handler
window.google.accounts.id.onError(() => {
  console.error('Google Sign-In error');
});
```

### Check Browser Console

The component logs detailed information:
- `Google Sign-In successful: { user object }`
- `Google Sign-In error: { error message }`
- Configuration warnings

### Verify Environment Variables

```javascript
console.log('Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
```

### Test Token Verification

```bash
# Get a real token from Google Sign-In (check browser console)
# Then test backend directly

curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ...",
    "accessToken": ""
  }'
```

## Common Issues

### Google Sign-In button not showing

1. Check if Google library is loaded:
   ```javascript
   console.log(window.google); // Should not be undefined
   ```

2. Verify `VITE_GOOGLE_CLIENT_ID` is set:
   ```javascript
   console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
   ```

3. Check browser console for errors

### "Token audience mismatch"

1. Verify `GOOGLE_CLIENT_ID` in backend `.env`
2. Verify `VITE_GOOGLE_CLIENT_ID` in frontend `.env`
3. Ensure they're the same value
4. Restart both frontend and backend

### "Email not verified by Google"

User needs to verify their email in Google account settings.

### "Already linked to different Google account"

User tried to sign in with different Google account for same email. They must:
1. Sign in with original Google account
2. Contact support to unlink accounts

## API Reference

### GoogleSignIn Component

**Props:**
- `onSuccess?: (user) => void` - Called on successful sign-in
- `onError?: (error: string) => void` - Called on sign-in failure
- `autoRedirect?: boolean` - Auto-redirect to `redirectPath` on success
- `redirectPath?: string` - Path to redirect to (default: '/dashboard')
- `text?: string` - Button text variant
- `theme?: string` - Button theme variant
- `size?: string` - Button size variant
- `width?: string` - Button width (CSS)

**Returns:** JSX.Element

## Related Resources

- [Google Identity Services Documentation](https://developers.google.com/identity)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com)
- [Project's Google OAuth Backend Guide](./GOOGLE_OAUTH_GUIDE.md)
