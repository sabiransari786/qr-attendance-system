 # Attendance Tracker 
A full-stack **Attendance Tracking System** built using **React**, **Node.js**, **Express**, and **SQL**.  
This project provides **role-based access** for **Admin / Faculty / Student** and supports **QR + Location based attendance** to prevent proxy attendance and real-time attendence management.
---

## Project Objective

The main goal of this system is to make attendance:
- ✅ Fast
- ✅ Accurate
- ✅ Secure
- ✅ Proxy-free

This project ensures that a student can mark attendance only when:
- Faculty session is active
- QR code is valid
- Student is within allowed time window
- Student is physically near the faculty/class location (GPS radius)
- Duplicate attendance is not allowed
---

## 👤 User Roles

### ✅ Admin
- Manage users (Faculty / Students)
- Monitor attendance records
- Control system access

### ✅ Faculty
- Create session
- Generate QR code
- Close session
- View attendance of their class/session

### ✅ Student
- Login
- Scan QR code
- Share location permission
- Mark attendance
- View their attendance history

---

## Core Features

### 🔐 Authentication & Authorization
- Login / Logout system
- JWT Token based authentication
- Role-based access control:
  - Admin
  - Faculty
  - Student

### 🧑‍🏫 Session Management (Faculty)
- Create/Start a session
- Close/End a session
- Active / Inactive session logic

### 🧾 Attendance Management
- Mark attendance using QR scan
- Duplicate attendance prevention
- Attendance fetch APIs (history/records)

### 📍 Location Verification (Anti-Proxy)
- Location-based attendance validation using:
  - Latitude / Longitude
  - Distance/radius check
- Attendance will be denied if student is far from the session location

### 🎨 Frontend Interface
- Clean UI screens for each role
- Routing & dashboard pages
- Proper error handling and messages

### 🧪 Testing & Debugging
- API testing using Postman
- Error tracking and fixing
- Final flow testing for complete project verification

---

## 🔄 Complete Project Flow (Step-by-Step)

1. **Faculty Login**
2. Faculty **creates a session**
3. System **generates a QR code**
4. Student **logs in**
5. Student **scans QR code**
6. Student **shares live location**
7. Backend verifies:
   - ✅ session is active
   - ✅ QR is valid
   - ✅ student is not duplicate
   - ✅ inside time window
   - ✅ location inside allowed radius
8. Attendance is saved in the **SQL database**
9. Student receives **attendance confirmation**

---

## ✅ Attendance Validation Rules

Attendance will be marked only if:

- Faculty has started the session ✅  
- QR code is valid ✅  
- Student has NOT already marked attendance ✅  
- Student is within time window ✅  
- Student location is within allowed radius ✅  

---

## 🧑‍💻 Tech Stack

### Frontend
- React
- HTML / CSS / JavaScript

### Backend
- Node.js
- Express.js

### Database
- SQL (Relational Database)

### Authentication
- JWT (JSON Web Token)

### Tools
- Git & GitHub (Version control)
- Postman (API Testing)

---

## 🌿 GitHub Branch Workflow

This project follows parallel development using branches:

- `backend-core` → backend setup & integration
- `backend-auth` → authentication & roles
- `backend-attendance` → attendance APIs & validations
- `backend-session` → session create/close logic
- `frontend-ui` → pages, components, routing
- `frontend-api` → API integration & token handling
- `database-integration` → schema + relations + DB support
- `testing-docs` → testing + bugs + documentation

---

## 🧪 Testing

Testing includes:
- API testing through Postman
- Edge cases:
  - invalid login
  - unauthorized access
  - session inactive
  - duplicate attendance
  - location out of range
  - invalid QR

---

## 🗄️ Database Notes (High Level)

Database stores:
- Users (Admin / Faculty / Student)
- Sessions
- Attendance records
- Faculty-Subject mapping (if required)

---

## 📌 Future Improvements
- Attendance report export (PDF/Excel)
- Dashboard analytics (Admin/Faculty)
- Email/OTP verification
- Notifications for attendance updates

---

## 👥 Team Members & Roles

- **Shahnaz Parween** — Testing, Bug Fixing, Error Handling + Frontend Support  
- **Zeenat Rizwan** — Backend Development  
- **Saad Ashraf** — Backend Development  
- **Shadman Ahmad** — Backend Development  
- **Sabir Ansari** — Frontend Development  
- **Sara Khatoon** — Frontend Development  
- **Samya Parween** — Database + Backend Support
---

## 📄 Note
This project is created for academic and learning purposes.
