# User Pre-Approval System - Admin Module Feature Guide

## Overview
यह एक नई feature है जो admin को users को manually approve करने की सुविधा देती है। Users signup करने से पहले उन्हें approve किया जाना चाहिए। Admin phele users को उनके email, phone number और अन्य विवरणों के साथ database में add करेगा, और फिर जब users signup करेंगे तो उनका email और phone number automatically verify हो जाएगा।

## Architecture

### Database Schema
```
approved_users table:
├── id (Primary Key)
├── name (User's full name)
├── email (UNIQUE - must match during signup)
├── contact_number (UNIQUE - must match during signup)
├── role ('student' or 'faculty')
├── student_id (for student role)
├── teacher_id (for faculty role)
├── department (optional)
├── semester (optional)
├── section (optional)
├── is_registered (FALSE = not signed up yet, TRUE = already signed up)
├── registered_user_id (Reference to actual user in users table)
├── created_at
└── updated_at
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN WORKFLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Admin POST /api/auth/admin/approved-users                │
│     ├── name: "John Doe"                                     │
│     ├── email: "john@example.com"                            │
│     ├── contactNumber: "9876543210"                          │
│     ├── role: "student"                                      │
│     └── studentId: "STU001"                                  │
│                                                               │
│  2. Record saved in approved_users table                     │
│     └── is_registered: FALSE                                 │
│                                                               │
│  3. Admin GET /api/auth/admin/approved-users                 │
│     (List all approved users)                                │
│                                                               │
│  4. Admin may DELETE if needed (before user signs up)        │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   USER SIGNUP WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User POST /api/auth/register                             │
│     ├── name: "John Doe"                                     │
│     ├── email: "john@example.com"                            │
│     ├── contactNumber: "9876543210"                          │
│     ├── password: "secure_password"                          │
│     └── studentId: "STU001"                                  │
│                                                               │
│  2. System checks in approved_users table:                   │
│     ├── email matches? YES                                   │
│     ├── contactNumber matches? YES                           │
│     └── is_registered = FALSE? YES                           │
│                                                               │
│  3. Validation passed!                                       │
│  4. Proceed with registration:                              │
│     ├── Hash password                                        │
│     ├── Create user in users table                           │
│     ├── Mark approved_users.is_registered = TRUE             │
│     ├── Set registered_user_id in approved_users             │
│     └── Return success response with JWT token              │
│                                                               │
│  5. User can now login!                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### 1. Add Approved User (Admin)
```
POST /api/auth/admin/approved-users
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "contactNumber": "9876543210",
  "role": "student",              // Required: 'student' or 'faculty'
  "studentId": "STU001",           // Required if role='student'
  "teacherId": "TEACH001",         // Required if role='faculty'
  "department": "Computer Science", // Optional
  "semester": 4,                   // Optional
  "section": "A"                   // Optional
}

Response (201 Created):
{
  "success": true,
  "message": "User approved successfully. They can now register.",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "contact_number": "9876543210",
    "role": "student",
    "student_id": "STU001",
    "department": "Computer Science",
    "semester": 4,
    "section": "A",
    "is_registered": false,
    "registered_user_id": null,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### 2. List Approved Users (Admin)
```
GET /api/auth/admin/approved-users?role=student&isRegistered=false&search=john
Authorization: Bearer <admin_token>

Query Parameters:
- role: 'student' | 'faculty' | 'all' (default: 'all')
- isRegistered: true | false (filter by registration status)
- search: Search by name, email, or contact number

Response (200 OK):
{
  "success": true,
  "message": "Approved users retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "contact_number": "9876543210",
      "role": "student",
      "student_id": "STU001",
      "is_registered": false,
      "registered_user_id": null,
      "created_at": "2024-01-15T10:30:00Z"
    },
    // ... more users
  ]
}
```

### 3. Delete Approved User (Admin)
```
DELETE /api/auth/admin/approved-users/:id
Authorization: Bearer <admin_token>

Path Parameters:
- id: ID of approved user to delete

Response (200 OK):
{
  "success": true,
  "message": "Approved user deleted successfully."
}

Error Response (400):
{
  "success": false,
  "message": "Cannot delete user who has already registered."
}
```

### 4. User Registration (Modified)
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "contactNumber": "9876543210",   // Must match approved user
  "password": "secure_password_123",
  "role": "student",
  "studentId": "STU001"             // Must match approved user's studentId
}

Response (200 OK):
{
  "success": true,
  "message": "Registration successful! You can now login.",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "student_id": "STU001",
      "created_at": "2024-01-15T10:35:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

Error Response (400):
{
  "success": false,
  "message": "User approval not found. Please contact the administrator 
             to get your email and contact number approved before registration."
}
```

## Step-by-Step Workflow

### For Admin:

#### Step 1: Prepare List of Users to Approve
Collect information of users who need to register:
- Full name
- Email address
- Contact number (10-digit)
- Role (student/faculty)
- Student ID (if student)
- Faculty ID (if faculty)
- Department (optional)
- Semester (optional)
- Section (optional)

#### Step 2: Add Users Using Admin Panel or API
```bash
curl -X POST http://localhost:3000/api/auth/admin/approved-users \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raj Kumar",
    "email": "raj@example.com",
    "contactNumber": "9876543210",
    "role": "student",
    "studentId": "STU001",
    "department": "B.Tech CSE",
    "semester": 4,
    "section": "A"
  }'
```

#### Step 3: View All Approved Users
```bash
curl -X GET "http://localhost:3000/api/auth/admin/approved-users?role=student&isRegistered=false" \
  -H "Authorization: Bearer <admin_token>"
```

#### Step 4: Remove Approval If Needed (Before User Signs Up)
```bash
curl -X DELETE http://localhost:3000/api/auth/admin/approved-users/1 \
  -H "Authorization: Bearer <admin_token>"
```

### For Users:

#### Step 1: Wait for Admin Approval
Contact admin to get your email and contact number approved.

#### Step 2: Try to Sign Up
User visits the signup page and enters:
- Name (must match approved record)
- Email (must match approved record exactly)
- Contact Number (must match approved record exactly)
- Password
- Role
- Student/Faculty ID (must match approved record)

#### Step 3: System Validates
- ✓ Email matches approved_users table
- ✓ Contact number matches approved_users table
- ✓ Record marked as is_registered = FALSE

#### Step 4: Registration Succeeds
User gets JWT token and can login immediately.

## Error Scenarios

| Scenario | Error Message |
|----------|---------------|
| Email not approved | "User approval not found. Please contact the administrator..." |
| Contact number not approved | "User approval not found. Please contact the administrator..." |
| Email matches but contact number different | "User approval not found. Please contact the administrator..." |
| Role mismatch (student approved, try faculty) | "Your account is approved as a student. You cannot register with a different role." |
| Admin tries to delete already-registered user | "Cannot delete user who has already registered." |
| Duplicate email in approved_users | "This email is already approved." |
| Duplicate contact number in approved_users | "This contact number is already approved." |

## Database Queries for Testing

### Insert Approved Users Manually
```sql
INSERT INTO approved_users 
(name, email, contact_number, role, student_id, department, semester, section, created_at) 
VALUES 
('Raj Kumar', 'raj@example.com', '9876543210', 'student', 'STU001', 'B.Tech CSE', 4, 'A', NOW()),
('Priya Singh', 'priya@example.com', '9876543211', 'student', 'STU002', 'B.Tech CSE', 4, 'A', NOW()),
('Dr. Sharma', 'sharma@example.com', '9876543212', 'faculty', NULL, 'Computer Science', NULL, NULL, NOW());
```

### Check Approved Users
```sql
SELECT id, name, email, contact_number, role, is_registered 
FROM approved_users 
ORDER BY created_at DESC;
```

### Check Registered Users from Approved List
```sql
SELECT au.*, u.id as user_id, u.password_hash 
FROM approved_users au 
LEFT JOIN users u ON au.registered_user_id = u.id 
WHERE au.is_registered = TRUE;
```

## Security Considerations

1. **Unique Constraints**: Email और contact number दोनों UNIQUE हैं, duplicates prevent करने के लिए
2. **Role Validation**: Admin द्वारा set role से user का role match करना चाहिए
3. **One-way Registration**: एक बार registered होने के बाद, record को delete नहीं किया जा सकता
4. **Activity Logging**: Admin actions (approve/delete) को activity logs में record किया जाता है
5. **JWT Auth**: Admin routes को सिर्फ authenticated admin users ही access कर सकते हैं

## Future Enhancements

1. **Bulk Approve**: Excel file से multiple users को एक साथ approve करना
2. **Email Notifications**: Approved users को email से notify करना
3. **Approval Expiry**: Admin approval को expiry date के साथ set करना
4. **Rejection Option**: Admin users को reject करने का option
5. **Audit Trail**: सभी approvals और registrations का complete audit trail
6. **Department/Semester Sync**: Directory से automatic user data sync करना

## Troubleshooting

### Issue: User Registration Fails with "User approval not found"
**Solution**: 
1. Verify email और contact number exactly match approved_users record
2. Check for extra spaces in email
3. Ensure contact number is exactly 10 digits
4. Contact admin to confirm user was approved

### Issue: Admin Cannot Delete Approved User
**Solution**: 
1. Check if user has already registered (is_registered = TRUE)
2. Only non-registered users can be deleted
3. If user already registered, delete from users table instead

### Issue: Multiple Approved Users with Same Details
**Solution**: 
1. Database constraints prevent duplicate emails/contact numbers
2. Update existing record or delete and recreate

---

## Code Changes Summary

### Files Modified:
1. **backend/src/services/auth.service.js**
   - Added `getApprovedUser()` - Check if user is approved
   - Added `markApprovedUserAsRegistered()` - Mark user as registered
   - Added `getAllApprovedUsers()` - Admin function to list approved users
   - Added `addApprovedUser()` - Admin function to add approved user
   - Added `deleteApprovedUser()` - Admin function to delete approved user
   - Modified `register()` - Added approval validation

2. **backend/src/routes/auth/auth.routes.js**
   - Added GET `/admin/approved-users` - List approved users
   - Added POST `/admin/approved-users` - Add approved user
   - Added DELETE `/admin/approved-users/:id` - Delete approved user

3. **database/add_approved_users.sql**
   - Created `approved_users` table with all required fields

---

**Created**: 2024-01-15
**Feature Status**: Ready for Testing
