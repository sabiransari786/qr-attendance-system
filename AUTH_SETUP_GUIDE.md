# Authentication System - Quick Setup Guide

## What's New?

A complete secure authentication system has been implemented with:
- ✅ Student/Faculty/Admin login support
- ✅ Role-based dashboards
- ✅ Protected routes
- ✅ Global auth state management
- ✅ Secure logout

---

## Frontend Components Created/Updated

### New Files:
1. **`src/context/AuthContext.jsx`** - Global auth state management
2. **`src/components/ProtectedRoute.jsx`** - Route protection wrapper
3. **`src/routes/AppRoutes.jsx`** - Centralized route configuration

### Updated Files:
1. **`src/pages/Login.jsx`** - Now uses AuthContext
2. **`src/pages/Signup.jsx`** - Now uses AuthContext
3. **`src/pages/StudentDashboard.jsx`** - Added proper logout
4. **`src/pages/FacultyDashboard.jsx`** - Added proper logout
5. **`src/pages/AdminDashboard.jsx`** - Added proper logout
6. **`src/components/Navbar.jsx`** - Shows user info when logged in
7. **`src/App.jsx`** - Wrapped with AuthProvider

---

## How to Test

### 1. Start Frontend (Already Running)
```bash
npm run dev --prefix frontend
# Frontend: http://localhost:5173
```

### 2. Setup Backend Database First

You need to create the database and tables. Here's what to do:

#### Option A: Using MySQL Command Line
```bash
# 1. Start MySQL
mysql -u root -p

# 2. Run these commands in MySQL:
CREATE DATABASE attendance_tracker;
USE attendance_tracker;

# 3. Import schema from database/schema.sql
source database/schema.sql;

# 4. Verify tables created
SHOW TABLES;
```

#### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Create new database: `attendance_tracker`
3. Open [database/schema.sql](database/schema.sql)
4. Execute the script

### 3. Start Backend
```bash
cd backend
npm start
# Backend: http://localhost:5000
```

---

## Testing the Authentication

### Create Test Users

Once database is ready, run these SQL commands to create test accounts:

```sql
-- Student Account
INSERT INTO users (name, email, password, role, roll_number)
VALUES ('John Student', 'student@example.com', 
  '$2b$10$...bcrypt_hash...', 'student', 'CS-001');

-- Faculty Account  
INSERT INTO users (name, email, password, role)
VALUES ('Dr. Faculty', 'faculty@example.com',
  '$2b$10$...bcrypt_hash...', 'faculty');

-- Admin Account
INSERT INTO users (name, email, password, role)
VALUES ('Admin User', 'admin@example.com',
  '$2b$10$...bcrypt_hash...', 'admin');
```

**Note:** Password hashes above are examples. Use actual bcrypt hashes or let backend handle password creation through the registration API.

### Manual Testing Steps

#### 1. Login as Student
```
URL: http://localhost:5173/login
Email: student@example.com
Password: password123
Expected: Redirects to /student-dashboard
```

#### 2. Login as Faculty
```
URL: http://localhost:5173/login
Email: faculty@example.com
Password: password123
Expected: Redirects to /faculty-dashboard
```

#### 3. Login as Admin
```
URL: http://localhost:5173/login
Email: admin@example.com
Password: password123
Expected: Redirects to /admin-dashboard
```

#### 4. Test Student Signup
```
URL: http://localhost:5173/signup
Name: Jane Student
Email: jane@example.com
Roll Number: CS-002
Password: myPassword123
Confirm: myPassword123
Expected: Redirects to /login
```

#### 5. Test Protected Routes
```
Logged in as: Student
Try to access: http://localhost:5173/faculty-dashboard
Expected: Redirects to /unauthorized
```

#### 6. Test Logout
```
Click "Logout" button in navbar or dashboard
Expected: Redirects to /login, storage cleared
```

---

## Authentication Flow Summary

```
1. User visits http://localhost:5173
2. User clicks "Login"
3. User enters email and password
4. Backend validates credentials
5. Backend returns JWT token + user data
6. Frontend stores in AuthContext + localStorage
7. Frontend redirects to role-specific dashboard
8. Navbar shows user name and logout button
9. User can click logout to clear session
```

---

## Key Features

### 🔐 Security
- JWT tokens for stateless auth
- bcrypt password hashing
- Role-based access control
- Protected routes with redirects

### 👥 Multiple Roles
- **Student:** Access to attendance tracking
- **Faculty/Teacher:** Manage sessions and attendance
- **Admin:** System administration and reporting

### 💾 Session Persistence
- Tokens stored in localStorage
- Session persists across page refreshes
- Auto-logout on token expiration

### 🎯 Role-Based Routing
- Automatic dashboard selection based on role
- Prevents cross-role access
- Unauthorized page for access denial

### 📱 Responsive UI
- Mobile-friendly navbar
- User info display when logged in
- Quick logout from any page

---

## File Locations

| File | Purpose |
|------|---------|
| `src/context/AuthContext.jsx` | Global auth state |
| `src/components/ProtectedRoute.jsx` | Route protection |
| `src/routes/AppRoutes.jsx` | Route configuration |
| `src/pages/Login.jsx` | Login form |
| `src/pages/Signup.jsx` | Registration form |
| `src/pages/StudentDashboard.jsx` | Student dashboard |
| `src/pages/FacultyDashboard.jsx` | Faculty dashboard |
| `src/pages/AdminDashboard.jsx` | Admin dashboard |
| `src/components/Navbar.jsx` | Navigation with auth info |
| `src/App.jsx` | Main app with AuthProvider |

---

## API Endpoints

### Login
```
POST /api/auth/login
Body: { email, password }
Response: { token, user: { id, name, email, role } }
```

### Register (Students)
```
POST /api/auth/register
Body: { name, email, rollNumber, password, role: "student" }
Response: { success: true, message: "..." }
```

### Logout
```
POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
Response: { success: true, message: "..." }
```

---

## Troubleshooting

### "Cannot find module 'AuthContext'"
- Make sure files are created in correct location
- Check import paths match file locations
- Restart dev server

### Login fails with "Cannot reach server"
- Backend not running on port 5000
- Check `.env` file has `VITE_API_BASE_URL=http://localhost:5000/api`
- Database connection failed on backend

### User gets redirected to /unauthorized
- User role doesn't match dashboard requirement
- Try logging in with correct role account
- Check role in database matches frontend

### Token expires and user logged out
- This is normal (24h default expiration)
- User needs to login again
- Can implement refresh tokens later

---

## Next Steps

1. ✅ Frontend authentication implemented
2. ⏳ **Backend database setup** (needed to test)
3. ⏳ Create test user accounts
4. ⏳ Test all login/logout flows
5. ⏳ Test role-based access
6. ⏳ Implement remaining features (QR scanning, attendance tracking)

---

## Support Files

See [AUTHENTICATION.md](AUTHENTICATION.md) for detailed documentation including:
- Architecture overview
- Component explanations
- Security features
- Usage examples
- Future enhancements

---

**Status:** ✅ Frontend authentication system is complete and ready for testing with backend!
