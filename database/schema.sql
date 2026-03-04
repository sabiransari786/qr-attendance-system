-- ============================================================================
-- QR-BASED ATTENDANCE TRACKING SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- 
-- This schema defines all tables required for the QR-based attendance system
-- Database: attendance_tracker
-- 
-- Setup Instructions:
-- 1. Create the database:
--    CREATE DATABASE attendance_tracker;
--
-- 2. Select the database:
--    USE attendance_tracker;
--
-- 3. Run this script:
--    mysql -u root -p attendance_tracker < database/schema.sql;
--
-- ============================================================================

-- ============================================================================
-- USERS TABLE - Stores all system users (students, faculty, admin)
-- ============================================================================
-- 
-- Stores all user information (students, faculty, admin)
-- Password is hashed using bcrypt - never stored in plain text
--
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL COMMENT 'User full name',
  `email` VARCHAR(255) NOT NULL UNIQUE COMMENT 'User email - unique identifier for login',
  `contact_number` VARCHAR(20) NOT NULL COMMENT 'User phone number',
  `password` VARCHAR(255) NOT NULL COMMENT 'Hashed password (bcrypt)',
  `role` ENUM('student', 'faculty', 'admin') NOT NULL DEFAULT 'student' COMMENT 'User role',
  `student_id` VARCHAR(100) UNIQUE COMMENT 'Student ID - unique per student',
  `teacher_id` VARCHAR(100) UNIQUE COMMENT 'Faculty/Teacher ID - unique per faculty',
  `department` VARCHAR(100) NULL COMMENT 'User department (e.g., Computer Science, Electrical)',
  `semester` VARCHAR(20) NULL COMMENT 'Student semester (e.g., 1st, 2nd, 3rd)',
  `section` VARCHAR(10) NULL COMMENT 'Student section (e.g., A, B, C)',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Account active status',
  `profile_photo` LONGBLOB COMMENT 'User profile photo (stored as binary data)',
  `photo_mime_type` VARCHAR(50) COMMENT 'MIME type of the photo (e.g., image/jpeg, image/png)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Account creation time',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  
  -- Indexes for frequently queried columns
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_teacher_id` (`teacher_id`),
  INDEX `idx_department` (`department`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DEPARTMENTS TABLE - For organizing courses/departments
-- ============================================================================
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `code` VARCHAR(10) UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- COURSES TABLE - For tracking courses
-- ============================================================================
CREATE TABLE IF NOT EXISTS `courses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(20) UNIQUE,
  `department_id` INT,
  `faculty_id` INT,
  `semester` INT DEFAULT NULL COMMENT 'Semester number (1-8)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`faculty_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  
  -- Indexes
  INDEX `idx_department_id` (`department_id`),
  INDEX `idx_faculty_id` (`faculty_id`),
  INDEX `idx_semester` (`semester`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SESSIONS TABLE - Stores attendance sessions created by faculty
-- ============================================================================
-- 
-- Stores attendance sessions created by faculty
-- Each session has a unique QR code that students scan
--
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `faculty_id` INT NOT NULL COMMENT 'Faculty member who created session',
  `subject` VARCHAR(255) NOT NULL COMMENT 'Subject/Course name',
  `location` VARCHAR(255) NOT NULL COMMENT 'Class room or location',
  `start_time` TIMESTAMP NOT NULL COMMENT 'Session start time',
  `end_time` TIMESTAMP NULL COMMENT 'Session end time',
  `status` ENUM('active', 'closed', 'cancelled') NOT NULL DEFAULT 'active' COMMENT 'Session status',
  `qr_code` LONGTEXT COMMENT 'QR code data (encoded session info)',
  `qr_expiry_time` TIMESTAMP NOT NULL COMMENT 'When QR code expires',
  `course_id` INT NULL COMMENT 'Reference to course',
  `department_id` INT NULL COMMENT 'Reference to department',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Session creation time',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  
  -- Foreign key references
  CONSTRAINT `fk_sessions_faculty_id` FOREIGN KEY (`faculty_id`) 
    REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sessions_course_id` FOREIGN KEY (`course_id`)
    REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sessions_department_id` FOREIGN KEY (`department_id`)
    REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Indexes for frequently queried columns
  INDEX `idx_faculty_id` (`faculty_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_start_time` (`start_time`),
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_department_id` (`department_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ATTENDANCE TABLE - Records attendance marks for students
-- ============================================================================
-- 
-- Records attendance marks for each student in each session
-- One record per student per session
--
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL COMMENT 'Reference to session',
  `student_id` INT NOT NULL COMMENT 'Reference to student user',
  `status` ENUM('present', 'late', 'absent', 'excused') NOT NULL DEFAULT 'absent' COMMENT 'Attendance status',
  `marked_at` TIMESTAMP NOT NULL COMMENT 'When attendance was marked',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation time',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  
  -- Foreign key references
  CONSTRAINT `fk_attendance_session_id` FOREIGN KEY (`session_id`) 
    REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_attendance_student_id` FOREIGN KEY (`student_id`) 
    REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Composite unique index - one attendance record per student per session
  UNIQUE KEY `uq_session_student` (`session_id`, `student_id`),
  
  -- Indexes for frequently queried columns
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_marked_at` (`marked_at`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SCHEMA SUMMARY
-- ============================================================================
--
-- Tables Created:
-- 1. users (3 user types: student, faculty, admin)
-- 2. sessions (attendance sessions with QR codes)
-- 3. attendance (attendance records)
--
-- Relationships:
-- - users (faculty) 1:M sessions
-- - sessions 1:M attendance
-- - users (student) 1:M attendance
--
-- Security:
-- - Passwords hashed with bcrypt (255 chars)
-- - Email unique constraint
-- - Student ID unique constraint
-- - Teacher ID unique constraint
-- - Foreign key constraints with CASCADE delete
--
-- Performance:
-- - Indexes on frequently queried columns
-- - Composite unique index on (session_id, student_id)
-- - InnoDB engine for ACID compliance
--
-- ============================================================================

-- ============================================================================
-- COURSE_ENROLLMENT TABLE - Track which students are in which courses
-- ============================================================================
CREATE TABLE IF NOT EXISTS `course_enrollment` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('active', 'dropped') DEFAULT 'active',
  
  -- Foreign keys
  FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  
  -- Unique constraint - one enrollment record per student per course
  UNIQUE KEY `unique_student_course` (`course_id`, `student_id`),
  
  -- Indexes
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ATTENDANCE_REQUEST TABLE - QR code generation requests from faculty
-- ============================================================================
CREATE TABLE IF NOT EXISTS `attendance_request` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_id` VARCHAR(36) NOT NULL UNIQUE COMMENT 'UUID for QR encoding',
  `faculty_id` INT NOT NULL COMMENT 'Faculty who generated the QR',
  `session_id` INT NOT NULL COMMENT 'Session for which QR was generated',
  `attendance_value` TINYINT NOT NULL COMMENT '1=P, 2=2P, 3=3P',
  `latitude` DECIMAL(10, 8) NOT NULL COMMENT 'Faculty location latitude',
  `longitude` DECIMAL(11, 8) NOT NULL COMMENT 'Faculty location longitude',
  `radius_meters` INT NOT NULL COMMENT 'Allowed location radius (10/20/50 meters)',
  `expires_at` TIMESTAMP NOT NULL COMMENT 'QR validity expiration time',
  `status` ENUM('active', 'expired', 'invalidated') DEFAULT 'active' COMMENT 'Status of the QR request',
  `accepted_count` INT DEFAULT 0 COMMENT 'Number of students who accepted this request',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Request creation time',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  
  -- Foreign keys
  FOREIGN KEY (`faculty_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  
  -- Indexes for faster queries
  INDEX `idx_request_id` (`request_id`),
  INDEX `idx_faculty_id` (`faculty_id`),
  INDEX `idx_session_id` (`session_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_expires_at` (`expires_at`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- OTP VERIFICATION TABLE - Password reset OTP storage
-- ============================================================================
CREATE TABLE IF NOT EXISTS `otp_verification` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `otp` VARCHAR(10) NOT NULL,
  `verified` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `verified_at` TIMESTAMP NULL,
  `expires_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_otp_email` (`email`),
  INDEX `idx_otp_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ACTIVITY LOGS TABLE - System activity and audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL COMMENT 'Actor user id (nullable for anonymous actions)',
  `user_role` VARCHAR(20) NULL COMMENT 'Actor role at time of action',
  `action` VARCHAR(120) NOT NULL COMMENT 'Normalized action label',
  `entity_type` VARCHAR(80) NULL COMMENT 'Affected entity type',
  `entity_id` VARCHAR(80) NULL COMMENT 'Affected entity id',
  `method` VARCHAR(10) NOT NULL COMMENT 'HTTP method',
  `path` VARCHAR(255) NOT NULL COMMENT 'Request path',
  `status_code` INT NOT NULL COMMENT 'HTTP status code',
  `ip_address` VARCHAR(64) NULL COMMENT 'Request IP address',
  `user_agent` VARCHAR(255) NULL COMMENT 'Client user agent',
  `metadata` LONGTEXT NULL COMMENT 'Additional metadata (JSON string)',
  `duration_ms` INT NULL COMMENT 'Request duration in milliseconds',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_activity_user_id` (`user_id`),
  INDEX `idx_activity_role` (`user_role`),
  INDEX `idx_activity_action` (`action`),
  INDEX `idx_activity_status` (`status_code`),
  INDEX `idx_activity_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- APPROVED USERS TABLE - User pre-approval system for admin
-- ============================================================================
CREATE TABLE IF NOT EXISTS `approved_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL COMMENT 'User full name',
  `email` VARCHAR(255) NOT NULL UNIQUE COMMENT 'User email - must match during signup',
  `contact_number` VARCHAR(20) NOT NULL COMMENT 'User phone number - must match during signup',
  `role` ENUM('student', 'faculty') NOT NULL DEFAULT 'student' COMMENT 'User role',
  `student_id` VARCHAR(100) COMMENT 'Student ID if role is student',
  `teacher_id` VARCHAR(100) COMMENT 'Faculty ID if role is faculty',
  `department` VARCHAR(100) COMMENT 'Department name',
  `semester` INT COMMENT 'Semester (for students)',
  `section` VARCHAR(50) COMMENT 'Class section',
  `is_registered` BOOLEAN DEFAULT FALSE COMMENT 'Has user already signed up?',
  `registered_user_id` INT COMMENT 'Reference to created user in users table',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When admin added this user',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  CONSTRAINT `fk_approved_users_user_id` FOREIGN KEY (`registered_user_id`)
    REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_approved_email` (`email`),
  INDEX `idx_approved_contact` (`contact_number`),
  INDEX `idx_approved_role` (`role`),
  INDEX `idx_approved_registered` (`is_registered`),
  INDEX `idx_approved_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MANUAL ATTENDANCE REQUEST TABLE - Student manual attendance requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS `manual_attendance_request` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL COMMENT 'Student requesting attendance',
  `session_id` INT NOT NULL COMMENT 'Session for which attendance is requested',
  `reason` VARCHAR(500) NOT NULL COMMENT 'Student-provided reason',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` INT NULL COMMENT 'Faculty who reviewed the request',
  `reviewed_at` TIMESTAMP NULL COMMENT 'When the request was reviewed',
  `rejection_note` VARCHAR(500) NULL COMMENT 'Optional reason for rejection',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_student_session` (`student_id`, `session_id`),
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_manual_student_id` (`student_id`),
  INDEX `idx_manual_session_id` (`session_id`),
  INDEX `idx_manual_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DEFAULT DATA - Departments
-- ============================================================================
INSERT IGNORE INTO `departments` (`id`, `name`, `code`) VALUES
(1, 'Computer Engineering', 'CE'),
(2, 'Electrical Engineering', 'EE'),
(3, 'Electronics & Communication', 'EC'),
(4, 'Civil Engineering', 'CV'),
(5, 'Mechanical Engineering', 'ME');

-- ============================================================================
-- DEFAULT DATA - Diploma in Computer Engineering Courses
-- ============================================================================
INSERT IGNORE INTO `courses` (`name`, `code`, `semester`, `department_id`) VALUES
-- Semester 1
('Communication Skill-I', 'DCOS101', 1, 1),
('Applied Maths-I', 'DCOM102', 1, 1),
('Electrical and Electronics Engineering', 'DEE103', 1, 1),
('Elements of Mechanical Engineering', 'DME104', 1, 1),
('Fundamental of Computers', 'DCO105', 1, 1),
('Electrical and Electronics Engineering Lab', 'DEE113', 1, 1),
('Workshop Practice', 'DME116', 1, 1),
('Engineering Drawing', 'DME117', 1, 1),
('P.C. Software Lab', 'DCO115', 1, 1),
-- Semester 2
('Applied Maths-II', 'DCOM201', 2, 1),
('Applied Physics', 'DCOP202', 2, 1),
('Electronics Devices and Application', 'DEL203', 2, 1),
('Engineering Chemistry & Environmental Science', 'DCOC204', 2, 1),
('Programming in C', 'DCO205', 2, 1),
('Applied Physics Lab', 'DCOP212', 2, 1),
('Electronics Devices and Application Lab', 'DEL213', 2, 1),
('Engineering Chemistry Lab', 'DCOC214', 2, 1),
('Programming in C Lab', 'DCO215', 2, 1),
-- Semester 3
('Computer Oriented Numerical Methods', 'DCO301', 3, 1),
('Object Oriented Programming', 'DCO302', 3, 1),
('Signals & Systems', 'DEE303', 3, 1),
('Computer Architecture', 'DCO304', 3, 1),
('Digital Electronics', 'DEL306', 3, 1),
('Object Oriented Programming Lab', 'DCO312', 3, 1),
('Computer Workshop', 'DCO314', 3, 1),
('Computer System & Maintenance', 'DCO315', 3, 1),
('Digital Electronics Lab', 'DEL316', 3, 1),
-- Semester 4
('Communication Skills-II', 'DCOS401', 4, 1),
('Database Management System', 'DCO402', 4, 1),
('Operating System', 'DCO403', 4, 1),
('Data Structures', 'DCO404', 4, 1),
('Microprocessor & Microcontroller', 'DEL405', 4, 1),
('Database Management System Lab', 'DCO412', 4, 1),
('Operating System Lab', 'DCO413', 4, 1),
('Data Structures Lab', 'DCO414', 4, 1),
('Microprocessor Programming Lab', 'DEL415', 4, 1),
-- Semester 5
('Computer Graphics', 'DCO501', 5, 1),
('Web Technology', 'DCO502', 5, 1),
('Data Communication & Computer Networks', 'DCO503', 5, 1),
('Software Engineering', 'DCO504', 5, 1),
('Java Programming', 'DCO505', 5, 1),
('Computer Graphics & Multimedia Lab', 'DCO511', 5, 1),
('Web Technology Lab', 'DCO512', 5, 1),
('Computer Networks Lab', 'DCO513', 5, 1),
('Java Programming Lab', 'DCO515', 5, 1),
('Minor Project', 'DCO520', 5, 1),
-- Semester 6
('Advanced RDBMS', 'DCO601', 6, 1),
('Visual Programming', 'DCO602', 6, 1),
('Information Security & Cyber Law', 'DCO603', 6, 1),
('Embedded System', 'DCO604', 6, 1),
('Artificial Intelligence', 'DCO605', 6, 1),
('Mobile Computing', 'DCO606', 6, 1),
('ICT Management & Entrepreneurship Development', 'DCO608', 6, 1),
('RDBMS Lab', 'DCO611', 6, 1),
('Visual Programming Lab', 'DCO612', 6, 1),
('Project', 'DCO620', 6, 1),
('Industrial Training & Visits', 'DCO630', 6, 1);

-- ============================================================================
-- DEFAULT DATA - Diploma in Civil Engineering Courses
-- ============================================================================
INSERT IGNORE INTO `courses` (`name`, `code`, `semester`, `department_id`) VALUES
-- Semester 1
('Communication Skill-I', 'DCES-101', 1, 4),
('Applied Maths-I', 'DCE-102', 1, 4),
('Applied Physics-I', 'DCE-103', 1, 4),
('Engineering Chemistry', 'DCE-104', 1, 4),
('Fundamental of Computers', 'DCE-105', 1, 4),
('Applied Physics Lab', 'DCE-113', 1, 4),
('Engineering Chemistry Lab', 'DCE-114', 1, 4),
('Computer Application Lab', 'DCE-115', 1, 4),
('Engineering Drawing', 'DCE-117', 1, 4),
-- Semester 2
('Applied Maths-II', 'DCE-201', 2, 4),
('Applied Physics-II', 'DCE-202', 2, 4),
('Elements of Electrical Engineering', 'DCE-203', 2, 4),
('Building Materials', 'DCE-204', 2, 4),
('Engineering Mechanics', 'DCE-205', 2, 4),
('Applied Physics Lab-II', 'DCE-212', 2, 4),
('Electrical Engineering Lab', 'DCE-213', 2, 4),
('Workshop Practice', 'DCE-216', 2, 4),
('Building Materials Lab', 'DCE-214', 2, 4),
-- Semester 3
('Applied Maths-III', 'DCE-301', 3, 4),
('Strength of Materials', 'DCE-302', 3, 4),
('Surveying-I', 'DCE-303', 3, 4),
('Building Construction', 'DCE-304', 3, 4),
('Fluid Mechanics', 'DCE-305', 3, 4),
('Strength of Materials Lab', 'DCE-312', 3, 4),
('Surveying Lab-I', 'DCE-313', 3, 4),
('Fluid Mechanics Lab', 'DCE-315', 3, 4),
-- Semester 4
('Communication Skill-II', 'DCES-401', 4, 4),
('Structural Mechanics', 'DCE-402', 4, 4),
('Surveying-II', 'DCE-403', 4, 4),
('Hydraulics & Hydraulic Machines', 'DCE-404', 4, 4),
('Construction Management', 'DCE-405', 4, 4),
('Structural Mechanics Lab', 'DCE-412', 4, 4),
('Surveying Lab-II', 'DCE-413', 4, 4),
('Hydraulics Lab', 'DCE-414', 4, 4),
('CAD Lab', 'DCE-415', 4, 4),
-- Semester 5
('Design of Steel Structures', 'DCE-501', 5, 4),
('RCC Design', 'DCE-502', 5, 4),
('Soil Mechanics', 'DCE-503', 5, 4),
('Transportation Engineering', 'DCE-504', 5, 4),
('Quantity Surveying & Valuation', 'DCE-505', 5, 4),
('Soil Mechanics Lab', 'DCE-513', 5, 4),
('Minor Project', 'DCE-520', 5, 4),
('Industrial Training Report', 'DCE-521', 5, 4),
-- Semester 6
('Advanced RCC Design', 'DCE-601', 6, 4),
('Environmental Engineering', 'DCE-602', 6, 4),
('Irrigation Engineering', 'DCE-603', 6, 4),
('Estimating & Costing', 'DCE-604', 6, 4),
('Construction Technology', 'DCE-605', 6, 4),
('Green Building & Sustainability', 'DCE-606', 6, 4),
('Environmental Engineering Lab', 'DCE-612', 6, 4),
('Project Work', 'DCE-620', 6, 4),
('Industrial Visit & Seminar', 'DCE-630', 6, 4);
