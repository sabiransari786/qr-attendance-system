-- ============================================================================
-- COMPREHENSIVE TEST DATA FOR ATTENDANCE TRACKER
-- ============================================================================
-- This script inserts realistic test data for development and testing
-- Password for all users: password123
-- ============================================================================

-- ============================================================================
-- 1. ADD MORE STUDENTS (for faculty interactions)
-- ============================================================================
INSERT INTO users (name, email, contact_number, password, role, student_id, is_active) 
VALUES 
  ('Priya Singh', 'priya.singh@demo.com', '9876543210', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'STU002', TRUE),
  ('Rajesh Kumar', 'rajesh.kumar@demo.com', '9876543211', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'STU003', TRUE),
  ('Ananya Sharma', 'ananya.sharma@demo.com', '9876543212', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'STU004', TRUE),
  ('Vikram Patel', 'vikram.patel@demo.com', '9876543213', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'STU005', TRUE),
  ('Deepa Nayak', 'deepa.nayak@demo.com', '9876543214', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'STU006', TRUE),
  ('Arjun Verma', 'arjun.verma@demo.com', '9876543215', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'STU007', TRUE),
  ('Neha Gupta', 'neha.gupta@demo.com', '9876543216', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'STU008', TRUE),
  ('Siddharth Das', 'siddharth.das@demo.com', '9876543217', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'STU009', TRUE),
  ('Kavya Reddy', 'kavya.reddy@demo.com', '9876543218', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'STU010', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- ============================================================================
-- 2. ADD MULTIPLE SESSIONS (created by faculty)
-- Faculty ID = 2 (Test Faculty)
-- ============================================================================
INSERT INTO sessions (faculty_id, subject, location, start_time, end_time, status, qr_expiry_time) 
VALUES 
  (2, 'Data Structures', 'Room 101', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
  (2, 'Algorithms', 'Lab 2', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
  (2, 'Database Management', 'Room 202', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
  (2, 'Web Development', 'Room 301', DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW(), 'closed', NOW()),
  (2, 'Object Oriented Programming', 'Lab 1', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), 'closed', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (2, 'Computer Networks', 'Room 105', DATE_ADD(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 3 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 3 HOUR)),
  (2, 'Operating Systems', 'Room 205', DATE_ADD(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 4 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 4 HOUR))
ON DUPLICATE KEY UPDATE subject=subject;

-- ============================================================================
-- 3. ADD ATTENDANCE RECORDS (students marked present/absent/late in sessions)
-- ============================================================================

-- Session 1: Data Structures (active)
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (1, 1, 'present', NOW()),
  (1, 2, 'present', NOW()),
  (1, 3, 'late', DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
  (1, 4, 'absent', NOW()),
  (1, 5, 'present', NOW()),
  (1, 6, 'present', NOW()),
  (1, 7, 'absent', NOW()),
  (1, 8, 'present', NOW()),
  (1, 9, 'late', DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
  (1, 10, 'present', NOW())
ON DUPLICATE KEY UPDATE status=status, marked_at=marked_at;

-- Session 2: Algorithms (active)
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (2, 1, 'present', NOW()),
  (2, 2, 'absent', NOW()),
  (2, 3, 'present', NOW()),
  (2, 4, 'present', NOW()),
  (2, 5, 'late', DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
  (2, 6, 'present', NOW()),
  (2, 7, 'present', NOW()),
  (2, 8, 'absent', NOW()),
  (2, 9, 'present', NOW()),
  (2, 10, 'present', NOW())
ON DUPLICATE KEY UPDATE status=status, marked_at=marked_at;

-- Session 3: Database Management (active)
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (3, 1, 'absent', NOW()),
  (3, 2, 'present', NOW()),
  (3, 3, 'present', NOW()),
  (3, 4, 'present', NOW()),
  (3, 5, 'present', NOW()),
  (3, 6, 'late', DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
  (3, 7, 'present', NOW()),
  (3, 8, 'present', NOW()),
  (3, 9, 'absent', NOW()),
  (3, 10, 'present', NOW())
ON DUPLICATE KEY UPDATE status=status, marked_at=marked_at;

-- Session 4: Web Development (closed)
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (4, 1, 'present', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
  (4, 2, 'present', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
  (4, 3, 'absent', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
  (4, 4, 'late', DATE_SUB(NOW(), INTERVAL 50 MINUTE)),
  (4, 5, 'present', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
  (4, 6, 'present', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
  (4, 7, 'present', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
  (4, 8, 'absent', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
  (4, 9, 'present', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
  (4, 10, 'late', DATE_SUB(NOW(), INTERVAL 48 MINUTE))
ON DUPLICATE KEY UPDATE status=status, marked_at=marked_at;

-- Session 5: Object Oriented Programming (closed)
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (5, 1, 'present', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
  (5, 2, 'present', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
  (5, 3, 'present', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
  (5, 4, 'present', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
  (5, 5, 'absent', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
  (5, 6, 'present', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
  (5, 7, 'late', DATE_SUB(NOW(), INTERVAL 95 MINUTE)),
  (5, 8, 'present', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
  (5, 9, 'present', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
  (5, 10, 'present', DATE_SUB(NOW(), INTERVAL 90 MINUTE))
ON DUPLICATE KEY UPDATE status=status, marked_at=marked_at;

-- Session 6: Computer Networks (active)
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (6, 1, 'present', NOW()),
  (6, 2, 'present', NOW()),
  (6, 3, 'present', NOW()),
  (6, 4, 'absent', NOW()),
  (6, 5, 'present', NOW()),
  (6, 6, 'late', DATE_SUB(NOW(), INTERVAL 7 MINUTE)),
  (6, 7, 'present', NOW()),
  (6, 8, 'present', NOW()),
  (6, 9, 'present', NOW()),
  (6, 10, 'absent', NOW())
ON DUPLICATE KEY UPDATE status=status, marked_at=marked_at;

-- Session 7: Operating Systems (active)
INSERT INTO attendance (session_id, student_id, status, marked_at) 
VALUES 
  (7, 1, 'present', NOW()),
  (7, 2, 'absent', NOW()),
  (7, 3, 'present', NOW()),
  (7, 4, 'present', NOW()),
  (7, 5, 'present', NOW()),
  (7, 6, 'present', NOW()),
  (7, 7, 'late', DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
  (7, 8, 'present', NOW()),
  (7, 9, 'absent', NOW()),
  (7, 10, 'present', NOW())
ON DUPLICATE KEY UPDATE status=status, marked_at=marked_at;

-- ============================================================================
-- 4. SUMMARY
-- ============================================================================
SELECT '✓ Test data inserted successfully!' as message;
SELECT '' as '';
SELECT 'USER ACCOUNTS CREATED:' as section;
SELECT COUNT(*) as total_users, GROUP_CONCAT(DISTINCT role) as roles FROM users;

SELECT '' as '';
SELECT 'STUDENTS:' as section;
SELECT id, name, email, student_id FROM users WHERE role = 'student' ORDER BY id;

SELECT '' as '';
SELECT 'SESSIONS CREATED:' as section;
SELECT id, faculty_id, subject, location, status, start_time FROM sessions ORDER BY status DESC, start_time DESC;

SELECT '' as '';
SELECT 'ATTENDANCE STATISTICS:' as section;
SELECT 
  s.subject,
  COUNT(a.id) as total_marked,
  SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
  SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late,
  SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent
FROM sessions s
LEFT JOIN attendance a ON s.id = a.session_id
GROUP BY s.id, s.subject
ORDER BY s.id;
