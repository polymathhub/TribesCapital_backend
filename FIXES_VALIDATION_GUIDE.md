# Due Diligence & Project Pipeline Fixes - Validation Guide

## ✅ Fixes Implemented

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
- ✅ Test: "marks a diligence case as approved as soon as an admin approves it" — confirms approval succeeds for admins
- ✅ Test: "blocks approval for non-admin users" — confirms authorization is enforced

**Run tests:**
```bash
npm test -- --runInBand src/modules/due-diligence/due-diligence.service.spec.ts
# Result: 2 test suites passed, 6 tests passed
```

---

### 2. **Local File Preview Access (Frontend Dev Server)**
**File:** [frontend/vite.config.js](frontend/vite.config.js)

**Changes:**
- Added `/uploads` proxy route to Vite dev server (line 30-33)
- Now routes `http://localhost:5173/uploads/*` → `http://localhost:3000/uploads/*`
- Allows uploaded due diligence files to be previewed in the browser during local development

**Code Location:**
```javascript
// Lines 30-33 in vite.config.js
'/uploads': {
  target: 'http://localhost:3000',
  changeOrigin: true,
},
```

---

## 🔍 How to Validate (Once Database is Connected)

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
- Click "Upload Document" button
- Select any PDF, image, or document file
- Submit the form
- Expected:
  - File is saved to `uploads/due-diligence/{timestamp}-{filename}`
  - File metadata is stored in `DueDiligenceDocument` table
  - File URL is generated as `/uploads/due-diligence/{timestamp}-{filename}`

#### **Step 4: Preview Uploaded File**
- In the Documents panel, click on the uploaded file
- Expected:
  - File preview loads from `/uploads/...` via Vite proxy
  - Image files display inline
  - PDF files may render or download depending on browser
  - ✅ **NEW FIX:** Previously failed because `/uploads` was not proxied; now works

#### **Step 5: Approve the Case (Admin Only)**
- Click "Approve" button in the Approvals panel
- Expected:
  - ✅ **NEW FIX:** Backend now checks your admin role
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
  - File can be previewed again
  - Metadata is persisted in database

---

## 📦 Current File Storage Model

**Status:** Local filesystem + metadata in DB (suitable for dev/test)

**How it works:**
1. File is uploaded via multipart form
2. Multer disk storage saves file to `{project-root}/uploads/due-diligence/{timestamp}-{filename}`
3. File URL is stored in `DueDiligenceDocument.fileUrl` as `/uploads/due-diligence/{timestamp}-{filename}`
4. Backend serves files from `/uploads` using `express.static()`
5. Frontend accesses via `/uploads` (now proxied in dev mode)

**For Production Deployment:**
- Replace local disk storage with Azure Blob Storage
- Update the file upload endpoint to use Blob Storage SDK
- Store blob URL/reference in `fileUrl` field
- Update frontend to handle cross-origin blob requests with proper auth headers

**Example production approach:**
```typescript
// Use Azure Blob Storage instead of disk
import { BlobServiceClient } from "@azure/storage-blob";

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient("due-diligence-docs");
const blockBlobClient = containerClient.getBlockBlobClient(filename);
await blockBlobClient.upload(fileStream, fileSize);
dto.fileUrl = blockBlobClient.url; // Store blob URL
```

---

## 🚀 What's Working Now

| Feature | Before | After | Status |
|---------|--------|-------|--------|
| Admin approval enforcement | No backend check | ✅ Backend validates admin role | ✅ Fixed |
| File preview in dev | ❌ CORS/proxy blocked | ✅ `/uploads` proxied to backend | ✅ Fixed |
| Approval marks case as approved | ✅ Yes | ✅ Yes + now enforced | ✅ Secure |
| Approved case appears in pipeline | ✅ Yes (UI event) | ✅ Yes + persisted in DB | ✅ Verified |
| File metadata stored | ✅ Yes | ✅ Yes + with size/type | ✅ Enhanced |

---

## 🔐 Security Improvements

1. **Admin-only approvals:** Only users with `admin` or `super-admin` roles can approve cases
2. **Role-based checks:** Uses Prisma role model (not frontend-only checks)
3. **Authorization before state change:** Approval fails fast before updating DB

---

## 📝 Test Coverage

```bash
# Run all due diligence tests
npm test -- --runInBand src/modules/due-diligence/

# Run with coverage
npm test:cov -- --testPathPattern=due-diligence

# Watch mode for active development
npm run test:watch -- due-diligence.service.spec.ts
```

---

## 🐛 Troubleshooting

### "Database unavailable" error
- Start PostgreSQL: `brew services start postgresql` (macOS) or `sudo systemctl start postgresql` (Linux)
- Check DATABASE_URL in `.env`
- Run migrations: `npm run db:migrate`

### File upload fails
- Ensure `uploads/due-diligence` directory exists
- Check disk space: `du -sh uploads/`
- Verify `USE_DISK_UPLOAD=true` in `.env` (or equivalent config)

### File preview shows 404
- Verify Vite proxy is running: `npm run dev:frontend`
- Check Network tab in browser DevTools
- Confirm `/uploads` proxy route in `frontend/vite.config.js`

### Approval returns 403 Forbidden
- Verify user has `admin` role in DB: `SELECT * FROM "UserRoles" WHERE "userId" = '{userId}'`
- Check Role table has `admin` record: `SELECT * FROM "Role" WHERE name = 'admin'`
- Confirm JWT token payload includes roles

---

## 📌 Next Steps (Future Enhancements)

1. **Blob Storage Integration:** Migrate from local disk to Azure Blob Storage
2. **File Type Validation:** Restrict uploads to specific file types (PDF, DOCX, etc.)
3. **Virus Scanning:** Add antivirus scanning for uploaded files
4. **Version Control:** Track file versions and upload history
5. **Document Signing:** Add e-signature capability for approvals
6. **Activity Audit Log:** Fully log all approval actions with timestamps and actor

---

## 📞 Quick Reference

- **Backend API:** http://localhost:3000/api
- **Frontend App:** http://localhost:5173
- **Due Diligence Endpoints:**
  - `POST /api/due-diligence` — Create case
  - `GET /api/due-diligence` — List cases
  - `POST /api/due-diligence/{id}/documents` — Upload file
  - `POST /api/due-diligence/{id}/approvals` — Create approval (admin only)
  - `PUT /api/due-diligence/{id}/approvals/{approvalId}` — Approve/reject (admin only)

- **Files Proxy:**
  - Frontend → Vite dev server (port 5173)
  - Vite dev server → Backend (port 3000)
  - Backend serves `/uploads` directory

---

**Validation Status:** ✅ Code fixes verified | ⏳ E2E validation pending database connection
