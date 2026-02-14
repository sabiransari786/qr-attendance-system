# Photo Upload Feature - Testing & Verification Guide

## Overview
The profile photo upload feature has been implemented with the following approach:
- **Frontend**: Converts image to Base64 and sends as JSON
- **Backend**: Accepts Base64 JSON data (no multer dependency required)
- **Database**: Stores photo as LONGBLOB with MIME type tracking

---

## Prerequisites

### 1. Database Migration
First, run the migration to add photo columns to the users table:

```bash
cd /Users/mohdsabiransari/Documents/GitHub/attendance-tracker

# MySQL CLI or MySQL Workbench
mysql -u root -p attendance_tracker < database/add_profile_photo.sql
```

Or manually execute in MySQL:
```sql
ALTER TABLE `users` ADD COLUMN `profile_photo` LONGBLOB COMMENT 'User profile photo (stored as binary data)' AFTER `is_active`;
ALTER TABLE `users` ADD COLUMN `photo_mime_type` VARCHAR(50) COMMENT 'MIME type of the photo (e.g., image/jpeg, image/png)' AFTER `profile_photo`;
ALTER TABLE `users` ADD INDEX `idx_profile_photo` (`id`);
```

**Verification**:
```sql
DESCRIBE users;  -- Should show profile_photo and photo_mime_type columns
```

### 2. Backend Setup
Ensure backend is running:
```bash
cd backend
npm install  # Multer is NOT required - feature works without it
npm start
```

### 3. Frontend Setup
Ensure frontend is running:
```bash
cd frontend
npm install
npm run dev
```

---

## Testing Checklist

### ✅ Test 1: Photo Selection
**Steps:**
1. Navigate to Student Profile page
2. Click the camera button (📷) on the profile avatar
3. Select an image file (JPEG, PNG, GIF, or WebP)
4. Verify preview appears immediately below the camera button

**Expected Result:**
- Preview image displays
- Success message: "Photo selected. Click 'Upload Photo' to save."

**File Path**: [frontend/src/pages/StudentProfile.jsx](frontend/src/pages/StudentProfile.jsx#L131)

---

### ✅ Test 2: Photo Upload (Success Case)
**Steps:**
1. After selecting a photo (Test 1)
2. Click "Upload Photo" button
3. Wait for upload to complete

**Expected Result:**
- Success message: "Profile photo uploaded successfully!"
- Photo persists and displays on profile
- Photo remains after page refresh
- Server logs show: "✅ Photo uploaded successfully"

**File Paths**:
- Frontend Handler: [frontend/src/pages/StudentProfile.jsx](frontend/src/pages/StudentProfile.jsx#L160)
- Backend Controller: [backend/src/controllers/auth.controller.js](backend/src/controllers/auth.controller.js#L574)
- Backend Service: [backend/src/services/auth.service.js](backend/src/services/auth.service.js#L699)

---

### ✅ Test 3: Photo Size Validation
**Steps:**
1. Create a test image > 5MB
2. Try uploading it
3. Verify error message appears

**Expected Result:**
- Error message: "File size exceeds 5MB limit"
- Upload blocked, no database changes

**Validation Code**:
- Frontend: [StudentProfile.jsx](frontend/src/pages/StudentProfile.jsx#L145)
- Backend: [auth.controller.js](backend/src/controllers/auth.controller.js#L615)

---

### ✅ Test 4: File Type Validation
**Steps:**
1. Try uploading invalid file type (e.g., .pdf, .txt, .exe)
2. Verify error message appears

**Expected Result:**
- Error message: "Invalid file type. Please upload JPEG, PNG, GIF, or WebP."
- Upload blocked

**Allowed Types**:
- image/jpeg
- image/png
- image/gif
- image/webp

---

### ✅ Test 5: Photo Persistence
**Steps:**
1. Upload photo successfully
2. Logout and login again
3. Navigate back to profile

**Expected Result:**
- Same photo displays (loaded from database)
- Photo displays without re-uploading

**Verification Method**:
Browser Dev Tools → Network tab:
- Check GET `/auth/photo/{userId}` request
- Should return image data with correct MIME type

---

### ✅ Test 6: Multiple Photos (Overwrite)
**Steps:**
1. Upload a photo (Photo A)
2. Upload a different photo (Photo B)
3. Verify new photo displays

**Expected Result:**
- New photo completely replaces old photo
- Old photo is no longer visible
- Database contains only new photo

---

### ✅ Test 7: Different Image Formats
**Steps:**
Upload images in different formats:
- JPEG (.jpg)
- PNG (.png)
- GIF (.gif)  
- WebP (.webp)

**Expected Result:**
- All formats upload successfully
- MIME type correctly stored in database
- Image displays with correct format

---

## Debugging Guide

### Issue 1: "Failed to upload photo. Please try again."

**Check 1: Browser Console**
```javascript
// Open DevTools (F12)
// Go to Console tab
// Look for error messages with specific details
```

**Check 2: Network Request**
```javascript
// Open DevTools → Network tab
// Filter: XHR/Fetch
// Click "Upload Photo"
// Check POST /auth/upload-photo request:
// - Status should be 200
// - Response should have { success: true, message: "..." }
```

**Check 3: Server Logs**
```bash
# Terminal where backend is running
# Look for logs:
# ❌ Upload photo error: [specific error message]
```

**Common Issues & Solutions:**

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check token in localStorage, verify auth middleware |
| 400 No photo provided | Frontend not sending base64 data correctly |
| Database error | Run migration: `add_profile_photo.sql` |
| MIME type mismatch | Ensure file is valid image format |

---

### Issue 2: Photo Not Displaying After Upload

**Check 1: Database Contents**
```sql
-- Check if photo is stored
SELECT id, name, profile_photo IS NOT NULL as has_photo, photo_mime_type 
FROM users 
WHERE id = 1;  -- Replace with actual user ID

-- Check photo size (should be > 0)
SELECT id, LENGTH(profile_photo) as photo_bytes
FROM users
WHERE profile_photo IS NOT NULL;
```

**Check 2: GET Photo Request**
```javascript
// In browser console
fetch('http://localhost:5000/api/auth/photo/1')  // Replace with user ID
  .then(r => r.blob())
  .then(blob => {
    console.log('Photo received:', blob.size, 'bytes');
    console.log('MIME type:', blob.type);
  });
```

---

### Issue 3: Base64 Conversion Issues

**Frontend Debug Code**:
```javascript
// In StudentProfile.jsx handlePhotoSelect:
const reader = new FileReader();
reader.onload = (e) => {
  const base64Photo = e.target.result;
  console.log('Base64 length:', base64Photo.length);
  console.log('First 100 chars:', base64Photo.substring(0, 100));
  console.log('File type:', profilePhoto.type);
};
reader.readAsDataURL(file);
```

---

## Database Schema Verification

**Check if columns exist:**
```sql
USE attendance_tracker;
SHOW COLUMNS FROM users LIKE 'profile%';
```

**Expected Output:**
```
Field          | Type        | Null | Key
profile_photo  | longblob    | YES  |
photo_mime_type| varchar(50) | YES  |
```

---

## Code Files Reference

| File | Purpose | Status |
|------|---------|--------|
| [database/add_profile_photo.sql](database/add_profile_photo.sql) | Database migration | ✅ Ready to execute |
| [backend/src/services/auth.service.js](backend/src/services/auth.service.js#L699) | Photo upload/retrieve logic | ✅ Complete |
| [backend/src/controllers/auth.controller.js](backend/src/controllers/auth.controller.js#L574) | HTTP handlers for photo | ✅ Complete |
| [backend/src/routes/auth/auth.routes.js](backend/src/routes/auth/auth.routes.js#L247) | Route definitions | ✅ Complete |
| [frontend/src/pages/StudentProfile.jsx](frontend/src/pages/StudentProfile.jsx#L131) | Photo upload UI | ✅ Complete |
| [frontend/src/styles/profile.css](frontend/src/styles/profile.css) | Photo styling | ✅ Complete |

---

## Next Steps

### If Photo Upload Works ✅
1. Test with actual users
2. Add photo validation tests
3. Monitor database storage usage
4. Future enhancement: Photo cropping/resizing before upload

### If Photo Upload Fails ❌
1. Check database migration was executed
2. Verify all 6 code files are in sync
3. Check browser console for specific error
4. Check server logs for detailed error message
5. Run debugging steps from "Debugging Guide" section

---

## Performance Notes

- **Photo Storage**: LONGBLOB can store up to 4GB per column (no issue for typical photos)
- **Base64 Overhead**: Base64 encoding increases data size by ~33%
- **Recommended Photo Size**: < 2MB (after base64 = < 3MB in database)
- **Query Performance**: Index on id ensures fast photo retrieval

---

## Security Considerations

✅ **Implemented:**
- File type validation (MIME type whitelist)
- File size limit (5MB max)
- Authentication check (only authenticated users can upload)
- User ID from auth token (prevents unauthorized photo uploads)

⚠️ **Future Enhancements:**
- Photo compression before storage
- Watermarking
- Abuse detection
- Rate limiting on uploads

