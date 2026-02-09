-- Create database
CREATE DATABASE IF NOT EXISTS attendance_tracker;
USE attendance_tracker;

-- Source the schema
SOURCE c:/Users/Asus/OneDrive/Documents/GitHub/attendance-tracker/database/schema.sql;

-- Create test users
INSERT INTO users (name, email, contact_number, password, role, student_id, is_active) VALUES
('Student User', 'student@test.com', '9999999999', '$2b$10$abc123...', 'student', 'STU001', 1),
('Faculty User', 'faculty@test.com', '8888888888', '$2b$10$def456...', 'faculty', NULL, 1),
('Admin User', 'admin@test.com', '7777777777', '$2b$10$ghi789...', 'admin', NULL, 1);
