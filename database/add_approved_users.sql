-- ============================================================================
-- APPROVED USERS TABLE - User pre-approval system for admin
-- ============================================================================
-- 
-- Jab admin users ko pre-approve karna chahte hain (phone + email verify):
-- Admin phele users ko is table mein add karega with their details
-- Jab user signup karega, unka email/phone is table se match hona chahiye
-- Only then signup allow hoga
--
-- Flow:
-- 1. Admin adds user to approved_users table
-- 2. User tries to signup with email/phone
-- 3. System checks if email/phone matches in approved_users
-- 4. If matches, user can proceed with signup
-- 5. On successful signup, approved_users record can be marked as registered

CREATE TABLE IF NOT EXISTS `approved_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL COMMENT 'User full name',
  `email` VARCHAR(255) NOT NULL UNIQUE COMMENT 'User email - must match during signup',
  `contact_number` VARCHAR(20) NOT NULL COMMENT 'User phone number - must match during signup',
  `role` ENUM('student', 'faculty') NOT NULL DEFAULT 'student' COMMENT 'User role (not admin - admin created manually)',
  `student_id` VARCHAR(100) COMMENT 'Student ID if role is student',
  `teacher_id` VARCHAR(100) COMMENT 'Faculty ID if role is faculty',
  `department` VARCHAR(100) COMMENT 'Department name',
  `semester` INT COMMENT 'Semester (for students)',
  `section` VARCHAR(50) COMMENT 'Class section',
  `is_registered` BOOLEAN DEFAULT FALSE COMMENT 'Has user already signed up?',
  `registered_user_id` INT COMMENT 'Reference to created user in users table',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When admin added this user',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  
  -- Foreign key reference to users table (optional - for tracking)
  CONSTRAINT `fk_approved_users_user_id` FOREIGN KEY (`registered_user_id`) 
    REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Indexes for frequently queried columns
  INDEX `idx_email` (`email`),
  INDEX `idx_contact_number` (`contact_number`),
  INDEX `idx_role` (`role`),
  INDEX `idx_is_registered` (`is_registered`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 
-- 1. Email aur contact_number UNIQUE hain - duplicate entries prevent karte hain
-- 
-- 2. is_registered flag se pata chalta hai ki user ne signup kar diya
--    - FALSE = User abhi signup nahi kiya
--    - TRUE = User ne signup kar diya
-- 
-- 3. registered_user_id se actual user record ka reference milta hai
--    Jab user signup karega to:
--    - is_registered = TRUE set hoga
--    - registered_user_id = created user ID set hoga
-- 
-- 4. student_id aur teacher_id optional hain
--    - Agar role = 'student' to student_id hona chahiye
--    - Agar role = 'faculty' to teacher_id hona chahiye
-- 
-- 5. Department, semester, section optional hain
--    - Future use ke liye save kar sakte hain
-- 
-- =============================================================================
