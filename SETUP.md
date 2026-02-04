# Attendance Tracker - Setup & Configuration Guide

## 📋 Project Overview

QR-Based Attendance Tracking System with:
- **Students**: Register with Student ID, scan QR to mark attendance
- **Faculty**: Create sessions with QR codes, view attendance reports
- **Admin**: System management (future implementation)

---

## 🗄️ Database Setup

### Step 1: Create Database

```bash
mysql -u root -p
CREATE DATABASE attendance_tracker;
EXIT;
```

### Step 2: Load Schema

```bash
mysql -u root -p attendance_tracker < database/schema.sql
```

### Step 3: Verify Tables

```bash
mysql -u root -p attendance_tracker
SHOW TABLES;
DESC users;
DESC sessions;
DESC attendance;
```

---

## ⚙️ Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

Create `.env` file in backend folder:

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=attendance_tracker
JWT_SECRET=your-secret-key-change-in-production
```

### Step 3: Test Database Connection

```bash
npm start
```

Expected output:
```
✓ Database connected successfully
🚀 Server is running on port 5000
📡 Environment: development
🌐 Server URL: http://localhost:5000
✅ API Health Check: http://localhost:5000/api/health
```

### Step 4: Verify Health Endpoint

```bash
curl http://localhost:5000/api/health
```

---

## 🎨 Frontend Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure Environment Variables

Create `.env` file in frontend folder (optional):

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 3: Start Development Server

```bash
npm run dev
```

Access at: `http://localhost:5173` (or next available port)

---

## 📝 Registration & Login Flow

### 1. **Student Registration**

- **Form Fields:**
  - Full Name
  - Email (unique)
  - Contact Number (10 digits)
  - Student ID / Roll Number (unique)
  - Password (min 6 characters)
  - Confirm Password

- **Validation:**
  - Email format check
  - Contact number format (10 digits)
  - Password strength (min 6 chars)
  - Student ID duplicate prevention
  - Email duplicate prevention

- **Backend Endpoint:** `POST /api/auth/register`

### 2. **Faculty Registration**

- **Form Fields:**
  - Full Name
  - Email (unique)
  - Contact Number (10 digits)
  - Faculty ID (unique)
  - Password (min 6 characters)
  - Confirm Password

- **Backend Endpoint:** `POST /api/auth/register`

### 3. **Login**

- **Form Fields:**
  - Email
  - Password

- **Login Flow:**
  1. Enter credentials
  2. Backend validates email & password
  3. JWT token generated
  4. Token stored in localStorage
  5. Redirect to role-based dashboard

- **Backend Endpoint:** `POST /api/auth/login`

---

## 🗂️ Database Schema

### users Table

| Column | Type | Notes |
|--------|------|-------|
| id | INT (PK) | Auto-increment |
| name | VARCHAR | User's full name |
| email | VARCHAR | Unique, indexed |
| contact_number | VARCHAR | Phone number |
| password | VARCHAR | Hashed (bcrypt) |
| role | ENUM | student/faculty/admin |
| student_id | VARCHAR | Unique for students |
| teacher_id | VARCHAR | Unique for faculty |
| is_active | BOOLEAN | Account status |
| created_at | TIMESTAMP | Registration time |
| updated_at | TIMESTAMP | Last update |

### sessions Table

| Column | Type | Notes |
|--------|------|-------|
| id | INT (PK) | Auto-increment |
| faculty_id | INT (FK) | References users |
| subject | VARCHAR | Class/Subject name |
| location | VARCHAR | Room/Location |
| start_time | TIMESTAMP | Session start |
| end_time | TIMESTAMP | Session end |
| status | ENUM | active/closed |
| qr_code | LONGTEXT | QR code data |
| qr_expiry_time | TIMESTAMP | QR validity |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

### attendance Table

| Column | Type | Notes |
|--------|------|-------|
| id | INT (PK) | Auto-increment |
| session_id | INT (FK) | References sessions |
| student_id | INT (FK) | References users |
| status | ENUM | present/late/absent |
| marked_at | TIMESTAMP | When marked |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

---

## 🔐 Security Notes

1. **Password Hashing:** bcrypt (10 salt rounds)
2. **JWT Tokens:** 24-hour expiry (configurable)
3. **Validation:** Server-side email/contact validation
4. **Unique Constraints:** Email, Student ID, Faculty ID
5. **HTTPS:** Use in production
6. **Environment Variables:** Never commit .env files

---

## 🧪 Test Users

After setup, you can create test users via signup form:

### Test Student
```
Name: Raj Kumar
Email: raj@student.com
Contact: 9876543210
Student ID: CS2025-001
Password: Test@123
```

### Test Faculty
```
Name: Prof. Smith
Email: smith@faculty.com
Contact: 9876543211
Faculty ID: FAC-101
Password: Test@123
```

---

## 🐛 Common Issues

### Database Connection Error

**Error:** `ER_ACCESS_DENIED_ERROR` or `ECONNREFUSED`

**Solution:**
1. Verify MySQL is running
2. Check DB_USER and DB_PASSWORD in .env
3. Verify database name in .env

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
1. Change PORT in .env (e.g., 5001)
2. Or kill process on port: `lsof -ti:5000 | xargs kill -9`

### JWT Secret Error

**Error:** `JsonWebTokenError`

**Solution:**
1. Ensure JWT_SECRET is set in .env
2. Regenerate if empty: `openssl rand -base64 32`

### Email Already Registered

**Error:** `UserAlreadyExistsError` or `Duplicate entry`

**Solution:**
1. Use different email for testing
2. Or delete user from database: `DELETE FROM users WHERE email='...';`

---

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Sessions (Faculty)

- `POST /api/session` - Create new session
- `GET /api/session/active` - Get active sessions
- `GET /api/session/:id` - Get session details
- `PUT /api/session/:id/close` - Close session

### Attendance

- `POST /api/attendance/mark` - Mark attendance (QR scan)
- `GET /api/attendance/session/:id` - Get session attendance
- `GET /api/attendance/student/:id` - Get student attendance
- `GET /api/attendance/report/:id` - Generate report

---

## 🚀 Deployment

### Prerequisites

- Node.js v16+
- MySQL v5.7+
- npm v7+

### Backend Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Use database credentials from production server
4. Run: `npm start`

### Frontend Deployment

1. Build: `npm run build`
2. Deploy `dist` folder to static hosting
3. Update `VITE_API_BASE_URL` to production backend URL

---

## 📞 Support

For issues or questions:
1. Check error messages in console
2. Verify .env configuration
3. Check database connectivity
4. Review logs in backend output

---

**Last Updated:** February 2026
