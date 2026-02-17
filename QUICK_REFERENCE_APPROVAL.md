# User Approval System - Quick Reference Guide

## 🎯 30-Second Summary
Admin approve करता है → Users signup करते हैं → System email/phone verify करता है

---

## 📌 Admin Quick Start

### 1️⃣ Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}'
```
✅ Save the token

### 2️⃣ Approve a Student
```bash
curl -X POST http://localhost:3000/api/auth/admin/approved-users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Student Name",
    "email":"student@example.com",
    "contactNumber":"9876543210",
    "role":"student",
    "studentId":"STU001"
  }'
```

### 3️⃣ Approve a Faculty
```bash
curl -X POST http://localhost:3000/api/auth/admin/approved-users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Faculty Name",
    "email":"faculty@example.com",
    "contactNumber":"9876543211",
    "role":"faculty",
    "teacherId":"TEACH001"
  }'
```

### 4️⃣ View Approved Users
```bash
curl -X GET "http://localhost:3000/api/auth/admin/approved-users" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5️⃣ Filter Options
```bash
# Students only
?role=student

# Not yet registered
?isRegistered=false

# Already registered
?isRegistered=true

# Search by name/email
?search=john

# Combine
?role=student&isRegistered=false&search=raj
```

### 6️⃣ Delete Approval (Before Signup)
```bash
curl -X DELETE http://localhost:3000/api/auth/admin/approved-users/APPROVED_USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 👤 User Quick Start

### Before Signup
> Contact admin and ask to be approved

### Signup (After Approval)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Student Name",
    "email":"student@example.com",
    "contactNumber":"9876543210",
    "password":"your_password",
    "role":"student",
    "studentId":"STU001"
  }'
```

**⚠️ IMPORTANT:**
- Email must match admin-approved email
- Contact number must match admin-approved number
- Role must match admin-approved role
- StudentID/TeacherID must match admin-approved ID

---

## 📊 Database Status

### Table Created
✅ `approved_users` table exists

### Check Table
```sql
mysql -u root -e "USE attendance_tracker; SHOW TABLES;" | grep approved
mysql -u root -e "USE attendance_tracker; DESCRIBE approved_users;"
```

### View Records
```sql
mysql -u root attendance_tracker -e "SELECT id, name, email, role, is_registered FROM approved_users;"
```

---

## 🔧 API Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/admin/approved-users` | GET | Admin | List approved users |
| `/admin/approved-users` | POST | Admin | Add new approved user |
| `/admin/approved-users/:id` | DELETE | Admin | Delete approval |
| `/register` | POST | - | User signup (validates approval) |

---

## ✅ Required Fields

### Admin Add User
```
REQUIRED:
- name (string)
- email (string, unique)
- contactNumber (10 digits)
- role ('student' OR 'faculty')

FOR STUDENT:
- studentId (unique per student)

FOR FACULTY:
- teacherId (unique per faculty)

OPTIONAL:
- department
- semester (for students)
- section (for students)
```

### User Signup
```
REQUIRED:
- name
- email (must match approved)
- contactNumber (must match approved)
- password (min 8 chars)
- role (must match approved)
- studentId/teacherId (must match approved)
```

---

## 🔍 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "User approval not found" | User not approved OR details don't match | Contact admin to get approved |
| "Email already approved" | Email already in approved_users | Use different email or delete existing |
| "Contact number already approved" | Contact already in approved_users | Use different contact or delete existing |
| "Cannot delete user who has already registered" | User already signed up | Cannot delete registered users |
| "Role mismatch" | Signup role ≠ approved role | Signup with the same role admin approved |
| "Student ID required" | Role=student but no studentId | Provide studentId in signup |
| "Token expired" | Admin token is expired | Re-login to get new token |

---

## 📋 Testing Checklist

- [ ] Database table created
- [ ] Admin can login
- [ ] Admin can add student
- [ ] Admin can add faculty
- [ ] Admin can list approved users
- [ ] Admin can search approved users
- [ ] Admin can filter by role
- [ ] Admin can filter by registration status
- [ ] Admin can delete approval
- [ ] User can signup with approved details
- [ ] User cannot signup without approval
- [ ] User cannot signup with wrong email
- [ ] User cannot signup with wrong contact
- [ ] Approved user is marked as registered after signup
- [ ] Activity logs record admin actions

---

## 🚀 Next Steps

1. **Test Admin Functions**
   ```bash
   bash test-approval-system.sh
   ```

2. **Read Complete Docs**
   - [USER_APPROVAL_SYSTEM.md](USER_APPROVAL_SYSTEM.md)
   - [APPROVAL_IMPLEMENTATION_SUMMARY.md](APPROVAL_IMPLEMENTATION_SUMMARY.md)

3. **Integrate with Frontend**
   - Create admin panel page for user management
   - Add approval UI component
   - Show feedback when signup fails

4. **Customizations** (Optional)
   - Bulk import from CSV/Excel
   - Email notifications for approved users
   - Approval expiry dates
   - Batch approve operations

---

## 💡 Tips

✅ **DO:**
- Use exact email (copy-paste from email)
- Use 10-digit contact number
- Verify role before signup
- Keep admin token secret
- Check logs if issues occur

❌ **DON'T:**
- Add spaces in email
- Use incomplete contact number
- Save admin password in code
- Share admin token publicly
- Delete registered user approvals

---

## 🆘 Debug Info

### Check Backend Logs
```bash
# Terminal where backend is running
# Look for errors related to:
# - Register function
# - Approved users validation
# - Database queries
```

### Manual Database Check
```sql
-- Check approved users
SELECT * FROM approved_users;

-- Check registered users created from approvals
SELECT au.*, u.id, u.email 
FROM approved_users au
LEFT JOIN users u ON au.registered_user_id = u.id;

-- Check duplicate emails
SELECT email, COUNT(*) 
FROM approved_users 
GROUP BY email 
HAVING COUNT(*) > 1;
```

### API Testing Tools
- Postman
- Insomnia
- curl (command line)
- REST Client (VS Code Extension)

---

## 📞 Support

**Issue?** Check in this order:
1. Quick Reference Guide (this file) ✓
2. Complete Docs (USER_APPROVAL_SYSTEM.md)
3. Implementation Summary (APPROVAL_IMPLEMENTATION_SUMMARY.md)
4. Backend Logs
5. Database Directly

---

**Version**: 1.0  
**Status**: Ready for Production  
**Last Updated**: 2024-01-15
