# Backend Integration Checklist

This checklist ensures the backend properly supports the new frontend authentication system.

## ✅ Backend Requirements

### 1. Password Security
- [ ] Use `bcrypt` library for password hashing
- [ ] Hash passwords with salt rounds (min 10)
- [ ] Never store plain text passwords
- [ ] Never return password in API responses
- [ ] Implement password comparison with `bcrypt.compare()`

### 2. JWT Token Management
- [ ] Use `jsonwebtoken` library for token generation
- [ ] Generate tokens on successful login
- [ ] Include user ID, email, and role in token payload
- [ ] Set token expiration (24h recommended)
- [ ] Validate tokens on protected endpoints
- [ ] Return token in response: `{ data: { token, user: {...} } }`

### 3. Authentication Endpoints

#### POST /api/auth/login
```javascript
// Request Body
{
  email: "student@example.com",
  password: "password123"
}

// Response (Success - 200)
{
  success: true,
  data: {
    token: "eyJhbGciOiJIUzI1NiIs...",
    user: {
      id: 1,
      name: "John Student",
      email: "student@example.com",
      role: "student",
      roll_number: "CS-001"
    }
  }
}

// Response (Error - 401)
{
  success: false,
  message: "Invalid email or password"
}
```

#### POST /api/auth/register
```javascript
// Request Body
{
  name: "Jane Student",
  email: "jane@example.com",
  rollNumber: "CS-002",
  password: "password123",
  role: "student"
}

// Response (Success - 201)
{
  success: true,
  message: "Student registered successfully"
}

// Response (Error - 400)
{
  success: false,
  message: "Email already registered"
}
```

#### POST /api/auth/logout
```javascript
// Headers
{
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..."
}

// Response (Success - 200)
{
  success: true,
  message: "Logged out successfully"
}

// Response (Error - 401)
{
  success: false,
  message: "Invalid or expired token"
}
```

### 4. User Management

#### Database Table Structure
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  roll_number VARCHAR(50),
  role ENUM('student', 'faculty', 'admin') DEFAULT 'student',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Role Assignments
- **Student:** Assigned during signup via `/api/auth/register`
- **Faculty:** Assigned by admin (only admin can create)
- **Admin:** Assigned by system administrator

#### Validation Rules
- [ ] Email must be unique
- [ ] Email format validation
- [ ] Password minimum 6 characters
- [ ] Roll number required for students only
- [ ] Roll number must be unique
- [ ] Name must not be empty

### 5. Authentication Middleware
- [ ] Check Authorization header for "Bearer {token}"
- [ ] Validate JWT token
- [ ] Extract user ID from token
- [ ] Query user from database
- [ ] Attach user to request object: `req.user`
- [ ] Handle token expiration errors

### 6. Protected Route Pattern
```javascript
// In backend route handler
router.post('/api/auth/logout', authMiddleware, logoutController);

// In middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token required' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
}
```

### 7. Error Response Format
All errors should follow this format:
```javascript
{
  success: false,
  message: "Human readable error message"
}
```

**Common Error Codes:**
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid credentials, expired token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Server Error

### 8. Role-Based Access Control
- [ ] Check user role on protected endpoints
- [ ] Only students can access `/api/attendance/mark`
- [ ] Only faculty can generate QR codes
- [ ] Only admins can manage users
- [ ] Return 403 Forbidden if role insufficient

### 9. Session Management
- [ ] Invalidate token on logout
- [ ] Consider token blacklist or refresh tokens
- [ ] Handle token expiration gracefully
- [ ] Auto-logout after token expiration

### 10. Environment Variables (Backend)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=attendance_tracker

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=24h

NODE_ENV=development
PORT=5000

CORS_ORIGIN=http://localhost:5173
```

---

## Testing Checklist

### Manual Testing
- [ ] Login with student account → redirects to /student-dashboard
- [ ] Login with faculty account → redirects to /faculty-dashboard
- [ ] Login with admin account → redirects to /admin-dashboard
- [ ] Login with wrong password → error message displayed
- [ ] Login with non-existent email → error message displayed
- [ ] Logout → session cleared, redirected to login
- [ ] Register new student → account created, can login
- [ ] Register with duplicate email → error shown
- [ ] Access faculty dashboard as student → redirected to /unauthorized
- [ ] Access admin dashboard as faculty → redirected to /unauthorized
- [ ] Refresh page while logged in → session persists
- [ ] Try accessing dashboard without token → redirected to login

### API Testing (Using Postman/Insomnia)
```
# Login
POST http://localhost:5000/api/auth/login
Body: { "email": "student@example.com", "password": "password123" }

# Register
POST http://localhost:5000/api/auth/register
Body: { "name": "Jane", "email": "jane@example.com", "rollNumber": "CS-002", 
        "password": "password123", "role": "student" }

# Logout
POST http://localhost:5000/api/auth/logout
Headers: { "Authorization": "Bearer <token_from_login>" }
```

---

## Current Backend Status

### ✅ Already Implemented
- Express server setup
- CORS configuration
- Database connection pool
- Auth controller structure
- Auth service structure
- Password hashing logic
- JWT token generation
- Error handling middleware

### ⏳ Needs Verification/Completion
- [ ] Database tables created
- [ ] Test accounts inserted
- [ ] Login endpoint working
- [ ] Register endpoint working
- [ ] Logout endpoint working
- [ ] Token validation middleware
- [ ] Role validation on protected endpoints

### 📝 Notes for Backend Developer
1. Frontend expects role to be lowercase: "student", "faculty", "admin"
2. Token should be in response as: `response.data.token`
3. User object should include: id, name, email, role
4. All errors should return JSON with success:false
5. CORS should allow requests from http://localhost:5173
6. Database charset should be utf8mb4 for emoji support

---

## API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Student",
      "email": "student@example.com",
      "role": "student",
      "roll_number": "CS-001"
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid email or password",
  "data": null
}
```

---

## Verification Steps

Once backend is ready, run these commands to test:

```bash
# 1. Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'

# 2. Test register endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","rollNumber":"CS-002","password":"password123","role":"student"}'

# 3. Test logout endpoint (use token from login)
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <token_from_login>"
```

---

## Support

If authentication isn't working:
1. Check backend console for errors
2. Verify environment variables set
3. Check database connection
4. Test API endpoints directly with curl/Postman
5. Check browser console for frontend errors
6. Review CORS configuration
7. Verify token format in responses

See [AUTHENTICATION.md](AUTHENTICATION.md) for detailed frontend documentation.
