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
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Account active status',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Account creation time',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  
  -- Indexes for frequently queried columns
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_teacher_id` (`teacher_id`),
  INDEX `idx_created_at` (`created_at`)
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
  `status` ENUM('active', 'closed') NOT NULL DEFAULT 'active' COMMENT 'Session status',
  `qr_code` LONGTEXT COMMENT 'QR code data (encoded session info)',
  `qr_expiry_time` TIMESTAMP NOT NULL COMMENT 'When QR code expires',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Session creation time',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  
  -- Foreign key reference to users table
  CONSTRAINT `fk_sessions_faculty_id` FOREIGN KEY (`faculty_id`) 
    REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Indexes for frequently queried columns
  INDEX `idx_faculty_id` (`faculty_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_start_time` (`start_time`),
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
  `status` ENUM('present', 'late', 'absent') NOT NULL DEFAULT 'absent' COMMENT 'Attendance status',
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
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `contact_number` VARCHAR(20),
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'faculty', 'admin') NOT NULL DEFAULT 'student',
  `student_id` VARCHAR(50) UNIQUE,
  `teacher_id` VARCHAR(50) UNIQUE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for faster queries
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_teacher_id` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SESSIONS TABLE - Attendance sessions created by faculty
-- ============================================================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `faculty_id` INT NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `location` VARCHAR(100),
  `start_time` TIMESTAMP NOT NULL,
  `end_time` TIMESTAMP,
  `status` ENUM('active', 'closed') DEFAULT 'active',
  `qr_code` LONGTEXT,
  `qr_expiry_time` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key to users table
  FOREIGN KEY (`faculty_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  
  -- Indexes for faster queries
  INDEX `idx_faculty_id` (`faculty_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ATTENDANCE TABLE - Records of student attendance for each session
-- ============================================================================
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `status` ENUM('present', 'late', 'absent') DEFAULT 'present',
  `marked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys to sessions and users tables
  FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  
  -- Unique constraint - one attendance record per student per session
  UNIQUE KEY `unique_student_session` (`session_id`, `student_id`),
  
  -- Indexes for faster queries
  INDEX `idx_session_id` (`session_id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_marked_at` (`marked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- OPTIONAL: DEPARTMENTS TABLE - For organizing courses/departments
-- ============================================================================
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `code` VARCHAR(10) UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- OPTIONAL: COURSES TABLE - For tracking courses
-- ============================================================================
CREATE TABLE IF NOT EXISTS `courses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(20) UNIQUE,
  `department_id` INT,
  `faculty_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`faculty_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  
  -- Indexes
  INDEX `idx_department_id` (`department_id`),
  INDEX `idx_faculty_id` (`faculty_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- OPTIONAL: COURSE_ENROLLMENT TABLE - Track which students are in which courses
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
-- END OF SCHEMA
-- ============================================================================
