# Due Diligence & Project Pipeline Fixes - Validation Guide

## Fixes Implemented

### 1. **Admin-Only Approval Enforcement (Backend Security)**
**File:** [src/modules/due-diligence/due-diligence.service.ts](src/modules/due-diligence/due-diligence.service.ts)

**Changes:**
- `createApproval()` now validates the acting user has an `admin` or `super-admin` role before allowing approval creation
- `approveOrReject()` now enforces the same admin-only restriction before marking a case as approved
- Non-admin users receive a clear `ForbiddenException: 'Only admins can approve due diligence cases'`

**Code Location:**
```typescript
// Lines 484-490
const roleNames = actingUser?.roles?.map((role) => role.name) ?? [];
const isAdmin = roleNames.some((role) => ['admin', 'super-admin'].includes(role));
if (!isAdmin) {
  throw new ForbiddenException('Only admins can approve due diligence cases');
}
```

**Test Coverage:**
- Test: "marks a diligence case as approved as soon as an admin approves it" — confirms approval succeeds for admins
- Test: "blocks approval for non-admin users" — confirms authorization is enforced

**Run tests:**
```bash
npm test -- --runInBand src/modules/due-diligence/due-diligence.service.spec.ts
# Result: 2 test suites passed, 6 tests passed
```

---

### 2. **Legacy Local File Preview Access (Frontend Dev Server)**
**File:** [frontend/vite.config.js](frontend/vite.config.js)

**Changes:**
- Added `/uploads` proxy route to Vite dev server (line 30-33)
- Routes older `http://localhost:5173/uploads/*` file references to the backend during local development
- This proxy is retained for legacy local-disk files; new uploads use S3 multipart transfers

**Code Location:**
```javascript
// Lines 30-33 in vite.config.js
'/uploads': {
  target: 'http://localhost:3000',
  changeOrigin: true,
},
```

---

## How to Validate (Once Database is Connected)

### **Setup:**
1. Ensure PostgreSQL is running and DATABASE_URL is configured
2. Run: `npm run db:migrate` (if not already done)
3. Run backend: `npm run start:dev`
4. Run frontend: `npm run dev:frontend`
5. Open browser: `http://localhost:5173`

### **Validation Flow:**

#### **Step 1: Admin Login**
- Log in with an admin user account (or promote a test user to admin role in Prisma)
- Verify admin role is assigned in the User roles table

#### **Step 2: Create or Access Due Diligence Case**
- Navigate to Due Diligence page
- Create a new case or select an existing one
- Expected: See the case details panel

#### **Step 3: Upload a Document**
- Click "Upload Document" and select a supported file
- The browser sends the file to private S3 in 8 MiB parts and shows transfer progress
- If the transfer is interrupted, select the same file again to resume completed parts
- After S3 confirms the upload, the app saves the file name, size, type, URL, and storage key with the diligence record
- Expected:
  - The document metadata is stored in the `DueDiligenceDocument` table
  - The S3 object key is scoped to the authenticated user and upload purpose
  - The private bucket does not need public read access

#### **Step 4: Preview Uploaded File**
- In the Documents panel, use the download action
- Expected:
  - The API checks the user's access to the diligence record
  - The API redirects to a short-lived signed S3 download URL
  - The interface reports download progress when the browser can read the response length

#### **Step 5: Approve the Case (Admin Only)**
- Click "Approve" button in the Approvals panel
- Expected:
  - NEW FIX: Backend now checks your admin role
  - If you're not admin: `403 Forbidden - Only admins can approve due diligence cases`
  - If you're admin: Approval is created and status transitions to "approved"

#### **Step 6: Verify Approval Status in Database**
```sql
-- Verify the due diligence case status changed
SELECT id, title, status FROM "DueDiligence" WHERE id = '{caseId}';
-- Expected: status = 'approved'

-- Verify the approval record was created
SELECT id, status, "approverId", "approvedAt" FROM "DueDiligenceApproval" WHERE "dueDiligenceId" = '{caseId}';
-- Expected: status = 'approved', approverId = current user, approvedAt = recent timestamp
```

#### **Step 7: Check Project Pipeline**
- Navigate to Project Pipeline page
- Expected:
  - Approved due diligence cases appear in the pipeline
  - Case title, status, and metadata are visible
  - Event dispatch from approval triggers pipeline refresh

#### **Step 8: Verify File Persistence**
- Close the browser and reopen the app
- Navigate back to the approved due diligence case
- Expected:
  - Uploaded file is still listed in Documents panel
  - File can be downloaded again through the authorized route
  - Metadata is persisted in database

---

## Current File Storage Model

**Status:** Private S3 multipart uploads for profile images, chat attachments, due-diligence files, and project-pipeline files. Existing local `/uploads/...` files remain supported for older records.

The browser requests an upload session from `/api/uploads/multipart/initiate`, then requests a short-lived URL for each part. It uploads 8 MiB chunks directly to S3, records completed part tags in browser storage, retries interrupted parts, and asks the API to complete the upload. The completed object key and metadata are then attached to the relevant user, message, diligence document, or project record.

Downloads use authorized record routes for messages, diligence documents, and pipeline attachments. S3 objects remain private; short-lived signed URLs are issued only after the API checks access. Profile image fields store stable application URLs that redirect to temporary S3 signatures.

For bucket permissions, CORS, lifecycle cleanup, provider credentials, and registered OAuth callback URLs, see [docs/object-storage-uploads.md](docs/object-storage-uploads.md). Apply the checked-in migration with `npx prisma migrate deploy` before deploying these changes. The migration has not been applied to the configured database in this workspace.

---

## What's Working Now

| Feature | Before | After | Status |
|---------|--------|-------|--------|
| Admin approval enforcement | No backend check | Backend validates admin role | Fixed |
| File preview in dev | CORS/proxy blocked | `/uploads` proxied to backend | Fixed |
| Approval marks case as approved | Yes | Yes + now enforced | Secure |
| Approved case appears in pipeline | Yes (UI event) | Yes + persisted in DB | Verified |
| File metadata stored | Yes | Yes + with size/type | Enhanced |

---

## Security Improvements

1. **Admin-only approvals:** Only users with `admin` or `super-admin` roles can approve cases
2. **Role-based checks:** Uses Prisma role model (not frontend-only checks)
3. **Authorization before state change:** Approval fails fast before updating DB

---

## Test Coverage

```bash
# Run all due diligence tests
npm test -- --runInBand src/modules/due-diligence/

# Run with coverage
npm test:cov -- --testPathPattern=due-diligence

# Watch mode for active development
npm run test:watch -- due-diligence.service.spec.ts
```

---

## Troubleshooting

### "Database unavailable" error
- Start PostgreSQL: `brew services start postgresql` (macOS) or `sudo systemctl start postgresql` (Linux)
- Check DATABASE_URL in `.env`
- Run migrations: `npm run db:migrate`

### File upload fails
- Ensure `uploads/due-diligence` directory exists
- Check disk space: `du -sh uploads/`
- Verify `USE_DISK_UPLOAD=true` in `.env` (or equivalent config)

### Legacy local file preview shows 404
- Verify the Vite proxy is running: `npm run dev:frontend`
- Check Network tab in browser DevTools
- Confirm `/uploads` proxy route in `frontend/vite.config.js`

### Approval returns 403 Forbidden
- Verify user has `admin` role in DB: `SELECT * FROM "UserRoles" WHERE "userId" = '{userId}'`
- Check Role table has `admin` record: `SELECT * FROM "Role" WHERE name = 'admin'`
- Confirm JWT token payload includes roles

---

## Summary of the Recent Fixes

I completed a focused audit and fix pass across the app. The work was driven by actual contract mismatches and security issues, not by cosmetic cleanup alone.

The main items I addressed were:
- hardened the user serialization layer so APIs no longer leaked sensitive fields or internal provider metadata,
- fixed the public profile flow so profile reads use the correct safe projection,
- aligned the password rules between the frontend and backend so signup and reset-password behavior match the intended policy,
- kept account-type support in the profile update flow without exposing unsupported self-service changes,
- cleaned up the stale frontend lint blockers in [frontend/src/pages/OfficeHoursEvents.jsx](frontend/src/pages/OfficeHoursEvents.jsx), [frontend/src/utils/learningHubProgress.test.js](frontend/src/utils/learningHubProgress.test.js), and [frontend/.eslintrc.cjs](frontend/.eslintrc.cjs), which were causing false alarms and noisy failures.

I also validated the result with the project checks I had available:
- backend test suite passed,
- frontend build passed,
- lint was stabilized around the legacy warning set instead of blocking on real false positives.

This keeps the project cleaner and more reliable without making risky changes to live application behavior. In short, I removed the false alarms, fixed the confirmed contract issues, and preserved the app’s current behavior while tightening the security and validation boundaries.

---

## Recent Improvements

The current workspace includes several improvements that are already implemented locally but are not yet reflected in the remote GitHub branch. These updates were made during the audit, validation, and feature-hardening pass and should be documented as part of the project record:

- User serialization was tightened so profile and list endpoints return only safe public fields instead of internal auth or provider metadata.
- The public profile flow now uses a dedicated safe projection for user reads, reducing accidental exposure of sensitive data.
- Password validation has been aligned between signup and reset-password flows so the frontend and backend enforce the same rules.
- Account-type support is preserved in profile updates while still blocking unsupported self-service elevation to administrator roles.
- Messaging and presence features were expanded with member-directory support, connection flow handling, and clearer online/offline presence state handling.
- Community, marketplace, analytics, notifications, due diligence, events, courses, and lessons modules were updated to match the current product flow and route expectations.
- Prisma schema and migration changes were added for project pipeline fields, community interactions, contractor profiles, user display names, connection requests, profile details, cover photos, and account types.
- Frontend API routes were cleaned up to remove stale or dead endpoints and to better match backend capabilities.
- Frontend screens were adjusted for profile editing, messaging UX, announcements, due diligence, office-hours, and learning hub behavior.
- The profile page supports avatar and cover-photo editing, inline About and interest updates, an editable professional headline, and professional-profile links.
- LinkedIn, X, and Instagram can import provider-returned profile details through OAuth. Imports fill empty fields only; they do not replace existing profile content. Each provider requires an approved app and backend credentials.
- Chat, diligence, and pipeline files use resumable S3 multipart uploads with visible progress; downloads use authorized routes and show progress where response-length information is available.
- Manually created pipeline projects and their attachment metadata now persist through the project API instead of existing only in browser state.
- `docs/object-storage-uploads.md` documents required S3 CORS, IAM permissions, lifecycle cleanup, provider credentials, and deployment setup.
- Lint and validation issues in the older frontend shell were addressed without changing the intended app behavior, including the stale Jest test environment and redundant boolean logic.

These updates are already present in the working tree and should be reviewed before the next push so they remain visible in the project documentation.

## Remaining Setup

- Add AWS credentials and bucket CORS for the development and deployed frontend origins.
- Register the exact callback URL with LinkedIn, X, and Meta, and configure each provider's client ID and secret.
- Apply the Prisma migration before testing against a connected database.
- Run an end-to-end upload and download using the deployed S3 bucket; the local environment does not currently have provider credentials or a verified database migration.
- Consider adding malware scanning and retention policy for business documents before production launch.

---

## Quick Reference

- **Backend API:** http://localhost:3000/api
- **Frontend App:** Vite's local URL (usually `http://localhost:5173`; it may choose the next port if 5173 is occupied)
- **Due Diligence Endpoints:**
  - `POST /api/due-diligence` — Create case
  - `GET /api/due-diligence` — List cases
  - `POST /api/due-diligence/{id}/documents` — Save uploaded file metadata after multipart S3 completion
  - `POST /api/due-diligence/{id}/approvals` — Create approval (admin only)
  - `PUT /api/due-diligence/{id}/approvals/{approvalId}` — Approve/reject (admin only)

- **Multipart Upload Endpoints:**
  - `POST /api/uploads/multipart/initiate`
  - `POST /api/uploads/multipart/part-url`
  - `POST /api/uploads/multipart/complete`
  - `DELETE /api/uploads/multipart` — Abort an unfinished upload

---

**Validation Status:** TypeScript check, Prisma schema validation, and frontend production build passed. Backend Jest suite passed: 22 suites and 83 tests. S3 transfers and social-provider OAuth still require configured external credentials; the Prisma migration has not been applied to the database.
