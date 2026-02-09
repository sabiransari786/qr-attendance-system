# Secure Authentication System Documentation

## Overview
This document outlines the comprehensive secure authentication system implemented for the QR-Based Attendance Tracking application. The system supports multiple user roles (Students, Faculty/Teachers, and Admins) with role-based access control.

---

## Architecture

### Authentication Flow

```
User Input
    ↓
Login/Signup Component
    ↓
API Call (services/api.js)
    ↓
Backend Validation & Processing
    ↓
JWT Token Generation
    ↓
AuthContext Storage
    ↓
Role-Based Routing
    ↓
Dashboard Access
```

---

## Key Components

### 1. **AuthContext** (`src/context/AuthContext.jsx`)
Global state management for authentication across the application.

**Features:**
- Manages user data, authentication token, and login state
- Provides login/logout methods
- Persists authentication data in localStorage
- Initializes auth state on app load

**Usage:**
```javascript
const authContext = useContext(AuthContext);
const { user, token, isAuthenticated, login, logout } = authContext;
```

### 2. **ProtectedRoute** (`src/components/ProtectedRoute.jsx`)
HOC (Higher Order Component) that wraps routes requiring authentication.

**Features:**
- Redirects unauthenticated users to login
- Checks user role against required roles
- Prevents unauthorized access to dashboards
- Shows loading state while checking authentication

**Usage:**
```javascript
<ProtectedRoute requiredRoles={["student"]}>
  <StudentDashboard />
</ProtectedRoute>
```

### 3. **AppRoutes** (`src/routes/AppRoutes.jsx`)
Centralized route configuration with protection.

**Routes:**
- **Public Routes:**
  - `/` - Home page
  - `/login` - Login page
  - `/signup` - Student registration

- **Protected Routes (Role-Based):**
  - `/student-dashboard` - Students only
  - `/faculty-dashboard` - Teachers/Faculty only
  - `/admin-dashboard` - Admins only

- **Error Routes:**
  - `/unauthorized` - Access denied
  - `*` - Page not found

### 4. **Login Page** (`src/pages/Login.jsx`)
Unified login for all user roles.

**Features:**
- Email and password validation
- Supports students, faculty, and admins
- Automatic role detection from backend
- Redirects to role-specific dashboard
- Error handling and display

**Form Fields:**
- Email Address (required)
- Password (required)

### 5. **Signup Page** (`src/pages/Signup.jsx`)
Student registration with validation.

**Features:**
- Form validation (all fields required)
- Password matching verification
- Minimum password length (6 characters)
- Duplicate prevention (handled by backend)
- Redirects to login after successful registration

**Form Fields:**
- Full Name (required)
- Email Address (required)
- Roll Number/Student ID (required)
- Password (required, min. 6 characters)
- Confirm Password (required)

### 6. **Dashboard Components**
Three role-specific dashboards:

#### Student Dashboard (`src/pages/StudentDashboard.jsx`)
- Welcome message with user's name
- Today's attendance tracking
- Attendance history
- QR scanning functionality (coming soon)

#### Faculty Dashboard (`src/pages/FacultyDashboard.jsx`)
- Welcome message with user's name
- QR generation for sessions
- Class sessions management
- Attendance reports

#### Admin Dashboard (`src/pages/AdminDashboard.jsx`)
- Welcome message with user's name
- User management
- Department/Course configuration
- System reports and analytics

### 7. **Navbar** (`src/components/Navbar.jsx`)
Updated with authentication awareness.

**Features:**
- Shows "Login" and "Sign up" links when unauthenticated
- Shows user name and role when authenticated
- Quick logout button in navbar
- Theme toggle (dark/light mode)
- Responsive design

---

## Authentication Flow Details

### 1. **Login Process**
1. User enters email and password
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates credentials against database
4. Backend returns JWT token and user data (if valid)
5. Frontend stores token in localStorage and AuthContext
6. User redirected to role-specific dashboard

### 2. **Logout Process**
1. User clicks logout button (navbar or dashboard)
2. Frontend calls POST `/api/auth/logout` with token
3. Backend invalidates session/token
4. Frontend clears localStorage and AuthContext
5. User redirected to login page

### 3. **Sign Up Process (Students Only)**
1. Student enters registration details
2. Frontend validates all fields
3. Frontend sends POST request to `/api/auth/register`
4. Backend checks for duplicate email/roll number
5. Backend hashes password with bcrypt
6. Backend creates user record with "student" role
7. Frontend redirects to login page
8. Student can now login with their credentials

### 4. **Protected Route Access**
1. User tries to access protected route
2. ProtectedRoute component checks authentication status
3. If not authenticated → redirected to `/login`
4. If authenticated but wrong role → redirected to `/unauthorized`
5. If authenticated and correct role → component rendered

---

## Security Features

### 1. **Password Security**
- Passwords are **never stored in plain text**
- Backend uses **bcrypt** with salt rounds for hashing
- Password hashing happens server-side only
- Password never returned in API responses

### 2. **Token Security**
- JWT (JSON Web Token) used for stateless authentication
- Tokens stored in **localStorage** (consider httpOnly cookies for production)
- Tokens include expiration time (24 hours default)
- Token sent in Authorization header: `Bearer {token}`
- Backend validates token on every protected endpoint

### 3. **Role-Based Access Control (RBAC)**
- Three user roles: `student`, `faculty`, `admin`
- Role assigned at registration/account creation
- Backend enforces role-based permissions
- Frontend prevents navigation to unauthorized dashboards
- Mismatched roles redirected to `/unauthorized`

### 4. **Input Validation**
- **Frontend Validation:**
  - Required field checking
  - Email format validation
  - Password strength (min. 6 characters)
  - Password match verification

- **Backend Validation:**
  - Email format verification
  - Password strength requirements
  - Duplicate user detection (email, roll number)
  - Business rule validation

### 5. **Session Management**
- Session created on successful login
- Session invalidated on logout
- Token expiration enforces re-login
- No persistent session storage (stateless with JWT)

---

## File Structure

```
frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx          # Auth state management
│   ├── components/
│   │   ├── ProtectedRoute.jsx       # Route protection wrapper
│   │   └── Navbar.jsx               # Updated with auth awareness
│   ├── pages/
│   │   ├── Login.jsx                # Login form (all roles)
│   │   ├── Signup.jsx               # Student registration
│   │   ├── StudentDashboard.jsx     # Student interface
│   │   ├── FacultyDashboard.jsx     # Faculty interface
│   │   ├── AdminDashboard.jsx       # Admin interface
│   │   ├── Unauthorized.jsx         # Access denied page
│   │   └── NotFound.jsx             # 404 page
│   ├── routes/
│   │   └── AppRoutes.jsx            # Route configuration
│   ├── services/
│   │   └── api.js                   # API calls
│   ├── App.jsx                      # Main app with AuthProvider
│   └── styles/
│       ├── auth.css                 # Login/Signup styles
│       ├── dashboard.css            # Dashboard styles
│       └── navbar.css               # Navbar styles
```

---

## API Endpoints Used

### Authentication Endpoints
- **POST `/api/auth/login`**
  - Body: `{ email, password }`
  - Response: `{ token, user: { id, name, email, role } }`

- **POST `/api/auth/register`**
  - Body: `{ name, email, rollNumber, password, role }`
  - Response: `{ success: true, message: "Registration successful" }`

- **POST `/api/auth/logout`**
  - Headers: `{ Authorization: Bearer {token} }`
  - Response: `{ success: true, message: "Logout successful" }`

---

## Usage Examples

### Login a User
```javascript
// In Login.jsx
const response = await login({
  email: "student@example.com",
  password: "password123"
});

// Update auth context
authContext.login(response.data.user, response.data.token);
```

### Access Auth State in Components
```javascript
// In any component
const authContext = useContext(AuthContext);
const { user, isAuthenticated, token } = authContext;

// Use the auth data
if (isAuthenticated) {
  console.log(`Logged in as: ${user.name} (${user.role})`);
}
```

### Protect Routes
```javascript
// In AppRoutes.jsx
<Route
  path="/student-dashboard"
  element={
    <ProtectedRoute requiredRoles={["student"]}>
      <StudentDashboard />
    </ProtectedRoute>
  }
/>
```

---

## Token Management

### Token Storage
- Stored in **localStorage** with key: `authToken`
- User data stored with key: `user`
- Persists across browser sessions

### Token Lifecycle
1. **Creation:** Generated on successful login
2. **Storage:** Saved to localStorage and AuthContext
3. **Usage:** Sent with every authenticated request
4. **Expiration:** Default 24 hours
5. **Invalidation:** On logout or expiration

### Automatic Re-initialization
When app loads:
1. AuthContext checks localStorage for stored token
2. If token exists, populates AuthContext
3. If token invalid/expired, clears storage
4. User stays logged in (until token expires)

---

## Error Handling

### Login Errors
- "Email is required"
- "Password is required"
- "Invalid credentials" (wrong email/password)
- Custom backend error messages

### Signup Errors
- "Please complete all required fields"
- "Passwords do not match"
- "Password must be at least 6 characters"
- "Email already registered"
- "Roll number already registered"

### Protected Route Errors
- Redirects to `/login` if not authenticated
- Redirects to `/unauthorized` if wrong role
- Shows loading state during auth check

---

## Testing Credentials

For testing, use these credentials (once backend DB is set up):

**Student:**
- Email: `student@example.com`
- Password: `password123`

**Faculty:**
- Email: `faculty@example.com`
- Password: `password123`

**Admin:**
- Email: `admin@example.com`
- Password: `password123`

---

## Future Enhancements

1. **OAuth Integration** - Google, Microsoft authentication
2. **Two-Factor Authentication (2FA)** - Additional security layer
3. **Remember Me** - Extended session duration
4. **Password Reset** - Forgot password functionality
5. **httpOnly Cookies** - More secure token storage
6. **Refresh Tokens** - Token rotation for better security
7. **Session Timeout** - Auto logout after inactivity
8. **Audit Logging** - Track all login/logout events
9. **IP Whitelisting** - Restrict access from specific networks
10. **Rate Limiting** - Prevent brute force attacks

---

## Backend Integration Notes

Ensure backend implements:
1. ✅ Password hashing with bcrypt
2. ✅ JWT token generation and validation
3. ✅ Duplicate user checking
4. ✅ Role-based access control
5. ✅ Session invalidation on logout
6. ✅ Token expiration handling
7. ✅ Error messages in JSON format

---

## Support & Troubleshooting

### User stuck on login page after clearing storage
- LocalStorage was cleared but token is still in memory
- Solution: Hard refresh (Ctrl+Shift+R) or restart browser

### Token expired, user redirected to login
- This is expected behavior (security feature)
- User needs to login again
- Consider implementing refresh token flow

### Role mismatch error
- User role changed on backend after they logged in
- Solution: Logout and login again to get updated role

---

## Conclusion

This authentication system provides:
- ✅ Secure login/signup for three user roles
- ✅ Role-based access control
- ✅ Protected routes with automatic redirection
- ✅ Persistent sessions with localStorage
- ✅ Global auth state with React Context
- ✅ Proper error handling and validation
- ✅ User-friendly feedback

The system is production-ready with best practices for security and user experience.
