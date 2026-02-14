-- ============================================================================
-- ALTER users TABLE - Add profile fields for students
-- ============================================================================
-- Add department, semester, and section columns to users table

ALTER TABLE `users` 
ADD COLUMN `department` VARCHAR(100) NULL COMMENT 'Student department (e.g., Computer Science, Electrical)' AFTER `teacher_id`,
ADD COLUMN `semester` VARCHAR(20) NULL COMMENT 'Student semester (e.g., 1st, 2nd, 3rd)' AFTER `department`,
ADD COLUMN `section` VARCHAR(10) NULL COMMENT 'Student section (e.g., A, B, C)' AFTER `semester`;

-- Add index for department for faster queries
ALTER TABLE `users` ADD INDEX `idx_department` (`department`);

-- Show the updated table structure
DESCRIBE `users`;
