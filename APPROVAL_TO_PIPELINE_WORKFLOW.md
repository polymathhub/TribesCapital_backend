# Approval to Project Pipeline Workflow - Verification Guide

## Overview
When an admin user approves a due diligence item in the **Due Diligence Vault**, it automatically moves to the **Project Pipeline**.

## Architecture

### Frontend Components
- **DueDiligencePage.jsx** - Displays due diligence items with an "Approve" button (admin only)
- **ProjectPipeline.jsx** - Displays project pipeline items with real-time updates

### Event-Driven Flow
The workflow uses browser CustomEvents for cross-component communication:

```
User clicks "Approve" on due diligence item
    ↓
DueDiligencePage calls API to approve
    ↓
Backend updates status to "approved"
    ↓
Frontend dispatches 3 events:
  • tribes:project-pipeline-add (with transformed project data)
  • tribes:due-diligence-approved (with item ID)
  • tribes:notifications-update (for observers)
    ↓
ProjectPipeline listens to these events
    ↓
Component refreshes and displays approved item
```

## Backend API Endpoints

### Create Approval
- **POST** `/api/due-diligence/:id/approvals`
- **Body**: `{ status: 'approved'|'rejected', approvalNotes?: string }`
- **Returns**: Approval record with ID

### Approve/Reject Decision
- **PUT** `/api/due-diligence/:id/approvals/:approvalId`
- **Body**: `{ status: 'approved'|'rejected', approvalNotes?: string }`
- **Returns**: Updated due diligence record with status='approved'

### Fetch Approved Items
- **GET** `/api/due-diligence?status=approved&limit=100`
- **Returns**: Array of approved items for the pipeline

## Frontend Event Handlers

### DueDiligencePage.jsx (Line ~1168)
```javascript
const handleApproveFromList = async (doc, event) => {
  // Creates approval
  const approval = await dueDiligenceAPI.createApproval(doc.id, { status: 'approved' });
  
  // Approves it
  await dueDiligenceAPI.approveOrReject(doc.id, approval.id, { 
    status: 'approved', 
    approvalNotes: 'Admin approval' 
  });
  
  // Dispatches events
  window.dispatchEvent(new CustomEvent('tribes:project-pipeline-add', { 
    detail: { project: transformedProject } 
  }));
};
```

### ProjectPipeline.jsx (Line ~708)
```javascript
// Listens for approved items
window.addEventListener('tribes:due-diligence-approved', () => {
  syncApprovedPipelineProjects();
});

window.addEventListener('tribes:project-pipeline-add', (event) => {
  addApprovedProject(event);
});
```

## Data Transformation

The `mapDueDiligenceToPipelineProject()` function transforms due diligence records:
- Maps `status: 'approved'` to pipeline entry
- Adds 'Approved' tag
- Sets `source: 'due-diligence'` for tracking
- Includes all metadata and target information

## Testing the Workflow

### Prerequisites
✅ **Done**: CORS configuration allows localhost origins
✅ **Done**: Demo user role changed to 'admin' for approval visibility

### Manual Test Steps
1. **Backend running** - Verify `http://localhost:3000/api/health` returns 200
2. **Frontend running** - Verify `http://localhost:5173` loads
3. **Navigate to Due Diligence Vault**
   - Click "Due Diligence Vault" in sidebar
4. **Create or find a due diligence item**
   - Admin users should see an "Approve" button
5. **Click "Approve"**
   - Item disappears from vault
   - Moves to "Approved" status in backend
6. **Navigate to Project Pipeline**
   - Click "Project Pipeline" in sidebar
7. **Verify approved item appears**
   - Should have "Approved" tag
   - Should have source information

### Expected Events (Browser DevTools)
```javascript
// In browser console, paste:
window.addEventListener('tribes:project-pipeline-add', (e) => {
  console.log('✅ Project added to pipeline:', e.detail);
});

window.addEventListener('tribes:due-diligence-approved', (e) => {
  console.log('✅ Due diligence approved:', e.detail);
});

window.addEventListener('tribes:notifications-update', (e) => {
  console.log('✅ Notification event:', e.detail);
});
```

## Permissions

The approval button is visible only to users with **admin role**:
- `user.isAdmin === true`
- OR `user.roles` includes `'admin'`

### Demo User Config
Located in `frontend/src/utils/authSession.js`:
```javascript
const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@tribes.capital',
  role: 'admin',      // ← Changed to enable Approve button
  isAdmin: true,      // ← Explicit flag
  // ...
};
```

## Files Modified in This Session

1. **src/config/app.config.ts**
   - Multi-origin CORS support
   - Combines localhost + production origins

2. **src/main.ts**
   - Dynamic CORS origin validation
   - Normalized origin matching

3. **frontend/src/utils/authSession.js**
   - Demo user role: `'admin'`
   - `isAdmin: true` flag

4. **src/config/app.config.spec.ts**
   - Added regression test for localhost + production

## Troubleshooting

### Approve Button Not Visible
- Check user role: `console.log(localStorage.getItem('user'))`
- Verify `isAdmin: true` in user object
- Refresh page after role change

### Approved Item Not Appearing in Pipeline
- **Check browser console** for event dispatch errors
- **Verify network tab**: 
  - `/api/due-diligence?status=approved` returns items
  - Check response includes `status: 'approved'`
- **Verify event listeners**: Paste listener code in console
- **Check React state**: Use React DevTools to inspect ProjectPipeline component

### API Errors
- **401 Unauthorized**: Token expired or user not authenticated
- **403 Forbidden**: User lacks admin role for approval
- **404 Not Found**: Item ID doesn't exist

## Success Indicators

✅ **Complete Success**: After approving a due diligence item:
1. Item disappears from Due Diligence Vault
2. Item appears in Project Pipeline
3. Item has "Approved" tag and metadata intact
4. Browser console shows event dispatch messages

## Next Steps

If workflow verification succeeds:
- Test with multiple items
- Verify data integrity across approval cycles
- Test with non-admin users (should not see Approve button)
- Monitor performance with large datasets

---
**Last Updated**: 2026-08-16
**CORS Status**: ✅ Fixed
**Admin Role**: ✅ Enabled
**Event Architecture**: ✅ In Place
