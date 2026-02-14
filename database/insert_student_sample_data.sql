-- ============================================================================
-- STUDENT MODULE SAMPLE DATA
-- Comprehensive test data for student functionality
-- ============================================================================

-- Clear existing attendance records for clean start (optional - comment out if you want to keep)
-- DELETE FROM attendance;

-- ============================================================================
-- 1. CREATE ACTIVE SESSIONS FOR TESTING
-- ============================================================================

-- Create fresh active sessions for students to scan QR and mark attendance
INSERT INTO sessions (faculty_id, subject, location, start_time, end_time, status, qr_expiry_time) 
VALUES 
  (35, 'Data Structures Lab', 'Lab 101', NOW(), DATE_ADD(NOW(), INTERVAL 3 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 3 HOUR)),
  (35, 'Web Development', 'Room 202', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
  (35, 'Database Management System', 'Room 303', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
  (35, 'Computer Networks', 'Lab 205', DATE_ADD(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 4 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 4 HOUR)),
  (35, 'Operating Systems', 'Room 404', DATE_ADD(NOW(), INTERVAL 30 MINUTE), DATE_ADD(NOW(), INTERVAL 3 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 3 HOUR))
ON DUPLICATE KEY UPDATE subject=subject;

-- ============================================================================
-- 2. CREATE PAST/CLOSED SESSIONS WITH ATTENDANCE HISTORY
-- ============================================================================

-- Past sessions for attendance history
INSERT INTO sessions (faculty_id, subject, location, start_time, end_time, status, qr_expiry_time) 
VALUES 
  (35, 'Data Structures', 'Room 101', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR, 'closed', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR),
  (35, 'Algorithms', 'Room 102', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 2 HOUR, 'closed', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 2 HOUR),
  (35, 'Java Programming', 'Lab 201', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 2 HOUR, 'closed', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 2 HOUR),
  (35, 'Python Programming', 'Lab 202', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 2 HOUR, 'closed', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 2 HOUR),
  (35, 'Machine Learning', 'Room 301', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR, 'closed', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR),
  (3, 'Software Engineering', 'Room 401', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 2 HOUR, 'closed', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 2 HOUR),
  (3, 'Computer Architecture', 'Room 105', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 2 HOUR, 'closed', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 2 HOUR)
ON DUPLICATE KEY UPDATE subject=subject;

-- ============================================================================
-- 3. ADD ATTENDANCE RECORDS FOR STUDENTS IN PAST SESSIONS
-- Using actual student IDs from database
-- ============================================================================

-- Get the session IDs first (they will auto-increment, so we need to find them)
SET @session_ds = (SELECT id FROM sessions WHERE subject = 'Data Structures' AND faculty_id = 35 AND status = 'closed' ORDER BY id DESC LIMIT 1);
SET @session_algo = (SELECT id FROM sessions WHERE subject = 'Algorithms' AND faculty_id = 35 ORDER BY id DESC LIMIT 1);
SET @session_java = (SELECT id FROM sessions WHERE subject = 'Java Programming' ORDER BY id DESC LIMIT 1);
SET @session_python = (SELECT id FROM sessions WHERE subject = 'Python Programming' ORDER BY id DESC LIMIT 1);
SET @session_ml = (SELECT id FROM sessions WHERE subject = 'Machine Learning' ORDER BY id DESC LIMIT 1);
SET @session_se = (SELECT id FROM sessions WHERE subject = 'Software Engineering' ORDER BY id DESC LIMIT 1);
SET @session_ca = (SELECT id FROM sessions WHERE subject = 'Computer Architecture' ORDER BY id DESC LIMIT 1);

-- Attendance for Data Structures session (5 days ago)
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (@session_ds, 2, 'present', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 10 MINUTE),
  (@session_ds, 7, 'present', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 5 MINUTE),
  (@session_ds, 8, 'late', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 25 MINUTE),
  (@session_ds, 9, 'present', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 8 MINUTE),
  (@session_ds, 10, 'absent', DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (@session_ds, 11, 'present', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 3 MINUTE),
  (@session_ds, 12, 'present', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 6 MINUTE),
  (@session_ds, 13, 'late', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 30 MINUTE),
  (@session_ds, 14, 'present', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 4 MINUTE),
  (@session_ds, 36, 'present', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 7 MINUTE)
ON DUPLICATE KEY UPDATE status=status;

-- Attendance for Algorithms session (4 days ago)
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (@session_algo, 2, 'present', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 5 MINUTE),
  (@session_algo, 7, 'late', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 20 MINUTE),
  (@session_algo, 8, 'present', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 8 MINUTE),
  (@session_algo, 9, 'absent', DATE_SUB(NOW(), INTERVAL 4 DAY)),
  (@session_algo, 10, 'present', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 10 MINUTE),
  (@session_algo, 11, 'present', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 6 MINUTE),
  (@session_algo, 12, 'absent', DATE_SUB(NOW(), INTERVAL 4 DAY)),
  (@session_algo, 13, 'present', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 4 MINUTE),
  (@session_algo, 14, 'present', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 9 MINUTE),
  (@session_algo, 36, 'late', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 22 MINUTE)
ON DUPLICATE KEY UPDATE status=status;

-- Attendance for Java Programming (3 days ago)
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (@session_java, 2, 'late', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 28 MINUTE),
  (@session_java, 7, 'present', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 5 MINUTE),
  (@session_java, 8, 'present', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 7 MINUTE),
  (@session_java, 9, 'present', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 3 MINUTE),
  (@session_java, 10, 'present', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 12 MINUTE),
  (@session_java, 11, 'absent', DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (@session_java, 12, 'present', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 8 MINUTE),
  (@session_java, 13, 'present', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 6 MINUTE),
  (@session_java, 14, 'late', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 25 MINUTE),
  (@session_java, 36, 'present', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 9 MINUTE)
ON DUPLICATE KEY UPDATE status=status;

-- Attendance for Python Programming (2 days ago)
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (@session_python, 2, 'present', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 4 MINUTE),
  (@session_python, 7, 'present', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 6 MINUTE),
  (@session_python, 8, 'absent', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (@session_python, 9, 'present', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 5 MINUTE),
  (@session_python, 10, 'present', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 11 MINUTE),
  (@session_python, 11, 'present', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 7 MINUTE),
  (@session_python, 12, 'late', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 26 MINUTE),
  (@session_python, 13, 'present', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 MINUTE),
  (@session_python, 14, 'present', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 8 MINUTE),
  (@session_python, 36, 'present', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 10 MINUTE)
ON DUPLICATE KEY UPDATE status=status;

-- Attendance for Machine Learning (1 day ago)
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (@session_ml, 2, 'present', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 MINUTE),
  (@session_ml, 7, 'absent', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (@session_ml, 8, 'present', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 5 MINUTE),
  (@session_ml, 9, 'late', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 24 MINUTE),
  (@session_ml, 10, 'present', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 MINUTE),
  (@session_ml, 11, 'present', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 6 MINUTE),
  (@session_ml, 12, 'present', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 7 MINUTE),
  (@session_ml, 13, 'present', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 4 MINUTE),
  (@session_ml, 14, 'absent', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (@session_ml, 36, 'late', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 21 MINUTE)
ON DUPLICATE KEY UPDATE status=status;

-- Attendance for Software Engineering (6 days ago) - Faculty 3
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (@session_se, 2, 'present', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 5 MINUTE),
  (@session_se, 7, 'present', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 4 MINUTE),
  (@session_se, 8, 'present', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 6 MINUTE),
  (@session_se, 9, 'present', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 7 MINUTE),
  (@session_se, 10, 'late', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 27 MINUTE),
  (@session_se, 11, 'absent', DATE_SUB(NOW(), INTERVAL 6 DAY)),
  (@session_se, 12, 'present', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 9 MINUTE),
  (@session_se, 13, 'present', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 3 MINUTE),
  (@session_se, 14, 'present', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 8 MINUTE)
ON DUPLICATE KEY UPDATE status=status;

-- Attendance for Computer Architecture (7 days ago) - Faculty 3
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (@session_ca, 2, 'present', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 6 MINUTE),
  (@session_ca, 7, 'late', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 23 MINUTE),
  (@session_ca, 8, 'absent', DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (@session_ca, 9, 'present', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 8 MINUTE),
  (@session_ca, 10, 'present', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 5 MINUTE),
  (@session_ca, 11, 'present', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 7 MINUTE),
  (@session_ca, 12, 'present', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 4 MINUTE),
  (@session_ca, 13, 'absent', DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (@session_ca, 14, 'present', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 MINUTE)
ON DUPLICATE KEY UPDATE status=status;

-- ============================================================================
-- 4. SUMMARY AND VERIFICATION
-- ============================================================================

SELECT '✅ Student Module Sample Data Loaded Successfully!' as Status;
SELECT CONCAT('Total Sessions: ', COUNT(*)) as Summary FROM sessions;
SELECT CONCAT('Active Sessions for QR Scanning: ', COUNT(*)) as Available FROM sessions WHERE status = 'active';
SELECT CONCAT('Total Attendance Records: ', COUNT(*)) as Records FROM attendance;
SELECT CONCAT('Total Students: ', COUNT(*)) as Students FROM users WHERE role = 'student';

-- Show recent sessions for testing
SELECT 
  s.id as 'Session ID',
  s.subject as 'Subject',
  u.name as 'Faculty',
  s.location as 'Location',
  s.status as 'Status',
  DATE_FORMAT(s.start_time, '%Y-%m-%d %H:%i') as 'Start Time'
FROM sessions s
JOIN users u ON s.faculty_id = u.id
ORDER BY s.id DESC
LIMIT 10;

-- Show attendance summary for a student
SELECT 
  u.name as 'Student',
  u.student_id as 'Student ID',
  COUNT(*) as 'Total Classes',
  SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as 'Present',
  SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as 'Late',
  SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as 'Absent',
  CONCAT(ROUND((SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2), '%') as 'Attendance %'
FROM users u
LEFT JOIN attendance a ON u.id = a.student_id
WHERE u.role = 'student' AND u.id = 2
GROUP BY u.id;
