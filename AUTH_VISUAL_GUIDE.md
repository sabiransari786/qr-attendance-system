# Authentication System - Visual Guide

## User Interface Flow Diagrams

### 1. Login Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        UNAUTHENTICATED                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Navbar:  [Home] [Login] [Sign up] [Theme]                    │
│                                                                 │
│  Login Page:                                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ LOGIN                                                    │ │
│  │ Sign in with your institution credentials               │ │
│  │                                                          │ │
│  │ Email: [ student@example.com              ]             │ │
│  │ Password: [ ••••••••••                     ]             │ │
│  │                                                          │ │
│  │                [Login]                                  │ │
│  │                                                          │ │
│  │ New student? [Sign up]                                  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Click "Login"
             │ Send: { email, password }
             ▼
        Backend validates
             │
             ├─ Invalid? ─────► Show "Invalid credentials"
             │
             └─ Valid? ───────► Return: { token, user }
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATED                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Navbar: [Home] John Student (student) [Logout] [Theme]         │
│                                                                  │
│ Student Dashboard:                                               │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ STUDENT DASHBOARD                                          │ │
│ │ Welcome, John Student! Track your attendance...            │ │
│ │                                      [Logout]              │ │
│ │                                                            │ │
│ │ ┌──────────────────┐  ┌──────────────────┐                │ │
│ │ │ Today's Attend   │  │ Attendance       │                │ │
│ │ │                  │  │ History          │                │ │
│ │ │ No attendance    │  │                  │                │ │
│ │ │ recorded yet     │  │ Recent logs      │                │ │
│ │ └──────────────────┘  └──────────────────┘                │ │
│ │                                                            │ │
│ │ ┌──────────────────┐                                       │ │
│ │ │ Scan QR          │                                       │ │
│ │ │ (Coming soon)    │                                       │ │
│ │ └──────────────────┘                                       │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### 2. Role-Based Dashboard Access

```
After Login → Backend Returns Role → Frontend Routes

┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN SUCCESSFUL                           │
│                  Backend Returns:                               │
│              { token, user: { role: ? } }                       │
└────────┬─────────────────┬─────────────────┬────────────────────┘
         │                 │                 │
    role: "student"   role: "faculty"   role: "admin"
         │                 │                 │
         ▼                 ▼                 ▼
    Navigate to        Navigate to      Navigate to
    /student-          /faculty-        /admin-
    dashboard          dashboard        dashboard
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  STUDENT    │  │  FACULTY    │  │   ADMIN     │
    │  Dashboard  │  │  Dashboard  │  │  Dashboard  │
    │             │  │             │  │             │
    │ • Attend.   │  │ • Generate  │  │ • Manage    │
    │ • History   │  │   QR Code   │  │   Users     │
    │ • Sessions  │  │ • Sessions  │  │ • Depart.   │
    │             │  │ • Reports   │  │ • Reports   │
    └─────────────┘  └─────────────┘  └─────────────┘
```

---

### 3. Protected Route Access Control

```
User tries to access /faculty-dashboard
         │
         ▼
    ┌─────────────────────┐
    │ ProtectedRoute      │
    │ Check:              │
    │ 1. Authenticated?   │
    └──────┬──────────────┘
           │
       ┌───┴────┐
       │         │
    No ✗       Yes ✓
       │         │
       ▼         ▼
    Redirect  Check Role
    to login
               │
          ┌────┴─────┐
          │           │
   Role OK ✓    Role ERROR ✗
          │           │
          ▼           ▼
     Render      Redirect
    Component   to /unauthorized
```

---

### 4. Navbar State Changes

```
┌──────────────────────────────────────────────────────────────────┐
│ BEFORE LOGIN (Unauthenticated)                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Logo    [Home] [Login] [Sign up]                    [🌙] Dark  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

                    ↓ User logs in ↓

┌──────────────────────────────────────────────────────────────────┐
│ AFTER LOGIN (Authenticated)                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Logo    [Home]   John Student (student) [Logout]   [🌙] Dark  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### 5. Session Management Timeline

```
Time ─────────────────────────────────────────────────────────────>

1. User logs in
   │
   ├─ Token generated ──────► localStorage.setItem("authToken")
   │
   ├─ User data stored ─────► localStorage.setItem("user")
   │
   └─ AuthContext updated ──► isAuthenticated = true
                               user = {...}
                               token = "jwt..."

2. Page refresh
   │
   ├─ App loads
   │
   └─ AuthContext checks localStorage
      ├─ Token found? ──────► Restore session
      │                       isAuthenticated = true
      │
      └─ Token valid? ──────► User stays logged in
         │
         └─ No────────────► Clear localStorage

3. User clicks logout
   │
   ├─ Call logout API
   │
   ├─ localStorage.removeItem("authToken")
   │
   ├─ localStorage.removeItem("user")
   │
   ├─ AuthContext reset ────► isAuthenticated = false
   │                           user = null
   │                           token = null
   │
   └─ Redirect to /login

4. Token expires (24h)
   │
   ├─ Next API call includes expired token
   │
   ├─ Backend returns 401 (Unauthorized)
   │
   └─ Frontend auto-logout
      ├─ Clear localStorage
      ├─ Reset AuthContext
      └─ Redirect to /login (on next navigation)
```

---

### 6. Data Flow Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      React Component                           │
│  (Login.jsx, StudentDashboard.jsx, etc.)                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ useContext(AuthContext)
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                     AuthContext                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ user: { id, name, email, role }                         │ │
│  │ token: "eyJhbGc..."                                      │ │
│  │ isAuthenticated: boolean                                 │ │
│  │ login(userData, token) → setState                        │ │
│  │ logout() → setState                                      │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────┬─────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌────────┐  ┌──────────┐  ┌──────────┐
    │Component
    │ State  │  │localStorage  │ Render UI│
    └────────┘  └──────────────┘  └────────┘
        │            │
        │ user data  │ token persistence
        │ & methods  │
        │            │
        ▼            ▼
    ┌────────────────────────────────────┐
    │     API Services (api.js)          │
    │  • login()                          │
    │  • registerStudent()                │
    │  • logout()                         │
    └────────────────┬────────────────────┘
                     │
                     │ HTTP Requests
                     │
                     ▼
            ┌─────────────────┐
            │  Backend API    │
            │  /api/auth/*    │
            └────────────────┬┘
                             │
                             ▼
                      ┌──────────────┐
                      │   Database   │
                      │   (MySQL)    │
                      └──────────────┘
```

---

### 7. Signup Flow

```
┌──────────────────────────────────────┐
│        Signup Page (New User)         │
├──────────────────────────────────────┤
│                                      │
│ Full Name: [ Jane Student        ]   │
│ Email: [ jane@example.com        ]   │
│ Roll Number: [ CS-002            ]   │
│ Password: [ ••••••••••           ]   │
│ Confirm Password: [ ••••••••••   ]   │
│                                      │
│  [Register]                          │
│                                      │
│ Already have an account? [Login]     │
│                                      │
└────────────┬───────────────────────┘
             │
             │ Validate:
             ├─ All fields filled? ──────► No ──► Error
             ├─ Valid email? ────────────► No ──► Error
             ├─ Password min 6 chars? ──► No ──► Error
             └─ Passwords match? ───────► No ──► Error
                     │
                     Yes ✓
                     │
                     ▼
        ┌──────────────────────┐
        │ Send POST request    │
        │ /api/auth/register   │
        │ Body: {              │
        │  name,               │
        │  email,              │
        │  rollNumber,         │
        │  password,           │
        │  role: "student"     │
        │ }                    │
        └────────────┬─────────┘
                     │
                Backend Validation:
                ├─ Email unique? ──────► No ──► Error
                ├─ Roll unique? ───────► No ──► Error
                └─ Hash password ──────► Ok ──► Save User
                                          │
                                          ▼
                                    ┌──────────────┐
                                    │ Success!     │
                                    │ Redirect to  │
                                    │ /login       │
                                    └──────────────┘
```

---

### 8. Browser localStorage Structure

```
After Login:

┌─────────────────────────────────────────────────────────┐
│                  Browser localStorage                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Key: "authToken"                                       │
│  Value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."      │
│         [Long JWT token string]                         │
│                                                         │
│  Key: "user"                                            │
│  Value: {                                               │
│    "id": 1,                                             │
│    "name": "John Student",                              │
│    "email": "john@example.com",                         │
│    "role": "student",                                   │
│    "roll_number": "CS-001"                              │
│  }                                                      │
│                                                         │
│  Key: "theme"                                           │
│  Value: "light" or "dark"                               │
│                                                         │
└─────────────────────────────────────────────────────────┘

Persists across:
  ✓ Page refresh
  ✓ Browser close/reopen (same session)
  ✓ Tab navigation
  ✗ Incognito/Private window (separate)
  ✗ After "Clear browsing data" → localStorage
```

---

### 9. Error Handling Flow

```
┌──────────────────────────────────────┐
│      User Action (Login)             │
└─────────────────┬────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ Frontend Validation │
        └─────┬───────────────┘
              │
          ┌───┴──────┐
          │          │
       Valid       Invalid
          │          │
          ▼          ▼
      Continue   Show Error
                 "Please enter
                  email & pass"
                  
                  Return (stop)
          │
          ▼
    ┌──────────────────────┐
    │ API Request          │
    │ Try-Catch Block      │
    └─────────┬────────────┘
              │
          ┌───┴──────────┐
          │              │
       Success         Error
          │              │
          ▼              ▼
      Store Token    Check Error Type
      & User Data    │
          │          ├─ Network Error
          │          │  Show: "Check connection"
          │          │
          │          ├─ 401 Unauthorized
          │          │  Show: "Invalid credentials"
          │          │
          │          ├─ 400 Bad Request
          │          │  Show: "Email already registered"
          │          │
          │          └─ 500 Server Error
          │             Show: "Server error, try later"
          │
          ▼
      Redirect to
      Role Dashboard
```

---

### 10. Component Hierarchy

```
<App>
│
├── <AuthProvider>
│   ├── <Navbar>
│   │   ├── [Logo]
│   │   ├── [Home Link]
│   │   ├── Conditional Render:
│   │   │   ├─ Not Logged In:
│   │   │   │  ├── [Login Link]
│   │   │   │  └── [Sign up Link]
│   │   │   │
│   │   │   └─ Logged In:
│   │   │      ├── [User Name]
│   │   │      ├── [(Role)]
│   │   │      └── [Logout Button]
│   │   │
│   │   └── [Theme Toggle]
│   │
│   ├── <main>
│   │   └── <AppRoutes>
│   │       ├── Public Routes:
│   │       │   ├── <Home>
│   │       │   ├── <Login>
│   │       │   └── <Signup>
│   │       │
│   │       ├── Protected Routes:
│   │       │   ├── <ProtectedRoute>
│   │       │   │   └── <StudentDashboard>
│   │       │   ├── <ProtectedRoute>
│   │       │   │   └── <FacultyDashboard>
│   │       │   └── <ProtectedRoute>
│   │       │       └── <AdminDashboard>
│   │       │
│   │       └── Error Routes:
│   │           ├── <Unauthorized>
│   │           └── <NotFound>
│   │
│   └── <Footer>
```

---

## Summary

This visual guide shows:
1. ✅ User flow from login to dashboard
2. ✅ Role-based routing decisions
3. ✅ Protected route access control
4. ✅ Navbar state transitions
5. ✅ Session lifecycle
6. ✅ Data flow architecture
7. ✅ Signup process
8. ✅ localStorage structure
9. ✅ Error handling
10. ✅ Component hierarchy

All flows are now implemented and ready for testing!
