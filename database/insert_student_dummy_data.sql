-- ============================================================
-- Student Module Dummy Data - Feb 2026
-- Sessions + Attendance for demo student (id=2)
-- ============================================================

-- Insert sessions for recent days
INSERT INTO sessions (subject, faculty_id, status, start_time, end_time, location, course_id) VALUES
('Data Structures',       3, 'active', '2026-02-21 10:00:00', '2026-02-21 11:30:00', 'Room 301', NULL),
('Web Development',       3, 'active', '2026-02-21 14:00:00', '2026-02-21 15:30:00', 'Lab 201', NULL),
('Database Management',   3, 'closed', '2026-02-20 10:00:00', '2026-02-20 11:30:00', 'Room 302', NULL),
('Algorithm Design',      3, 'closed', '2026-02-20 14:00:00', '2026-02-20 15:30:00', 'Room 303', NULL),
('Operating Systems',     3, 'closed', '2026-02-19 10:00:00', '2026-02-19 11:30:00', 'Lab 101', NULL),
('Data Structures',       3, 'closed', '2026-02-19 13:00:00', '2026-02-19 14:30:00', 'Room 301', NULL),
('Web Development',       3, 'closed', '2026-02-18 09:00:00', '2026-02-18 10:30:00', 'Lab 201', NULL),
('Database Management',   3, 'closed', '2026-02-18 14:00:00', '2026-02-18 15:30:00', 'Room 302', NULL),
('Operating Systems',     3, 'closed', '2026-02-17 10:00:00', '2026-02-17 11:30:00', 'Lab 101', NULL),
('Algorithm Design',      3, 'closed', '2026-02-17 13:00:00', '2026-02-17 14:30:00', 'Room 303', NULL),
('Data Structures',       3, 'closed', '2026-02-14 10:00:00', '2026-02-14 11:30:00', 'Room 301', NULL),
('Web Development',       3, 'closed', '2026-02-14 13:00:00', '2026-02-14 14:30:00', 'Lab 201', NULL),
('Database Management',   3, 'closed', '2026-02-13 10:00:00', '2026-02-13 11:30:00', 'Room 302', NULL),
('Operating Systems',     3, 'closed', '2026-02-13 14:00:00', '2026-02-13 15:30:00', 'Lab 101', NULL),
('Algorithm Design',      3, 'closed', '2026-02-12 09:00:00', '2026-02-12 10:30:00', 'Room 303', NULL),
('Data Structures',       3, 'closed', '2026-02-12 13:00:00', '2026-02-12 14:30:00', 'Room 301', NULL),
('Web Development',       3, 'closed', '2026-02-11 10:00:00', '2026-02-11 11:30:00', 'Lab 201', NULL),
('Database Management',   3, 'closed', '2026-02-11 14:00:00', '2026-02-11 15:30:00', 'Room 302', NULL),
('Operating Systems',     3, 'closed', '2026-02-10 09:00:00', '2026-02-10 10:30:00', 'Lab 101', NULL),
('Algorithm Design',      3, 'closed', '2026-02-10 13:00:00', '2026-02-10 14:30:00', 'Room 303', NULL);

-- Get the IDs of sessions we just inserted
-- Sessions start at 42 (max was 41)
-- 42 = DS Feb21 morning, 43 = WD Feb21 afternoon
-- 44 = DB Feb20, 45 = Algo Feb20
-- 46 = OS Feb19, 47 = DS Feb19
-- 48 = WD Feb18, 49 = DB Feb18
-- 50 = OS Feb17, 51 = Algo Feb17
-- 52 = DS Feb14, 53 = WD Feb14
-- 54 = DB Feb13, 55 = OS Feb13
-- 56 = Algo Feb12, 57 = DS Feb12
-- 58 = WD Feb11, 59 = DB Feb11
-- 60 = OS Feb10, 61 = Algo Feb10

-- Attendance records for student ID 2 (student@demo.com)
-- Today (Feb 21) - present for morning class
INSERT INTO attendance (session_id, student_id, status, marked_at) VALUES
(42, 2, 'present', '2026-02-21 10:05:00'),
-- Feb 20
(44, 2, 'present', '2026-02-20 10:04:00'),
(45, 2, 'late',    '2026-02-20 14:10:00'),
-- Feb 19
(46, 2, 'present', '2026-02-19 10:02:00'),
(47, 2, 'present', '2026-02-19 13:03:00'),
-- Feb 18
(48, 2, 'absent',  '2026-02-18 09:00:00'),
(49, 2, 'present', '2026-02-18 14:05:00'),
-- Feb 17
(50, 2, 'present', '2026-02-17 10:03:00'),
(51, 2, 'present', '2026-02-17 13:04:00'),
-- Feb 14
(52, 2, 'present', '2026-02-14 10:02:00'),
(53, 2, 'late',    '2026-02-14 13:12:00'),
-- Feb 13
(54, 2, 'present', '2026-02-13 10:01:00'),
(55, 2, 'absent',  '2026-02-13 14:00:00'),
-- Feb 12
(56, 2, 'present', '2026-02-12 09:03:00'),
(57, 2, 'present', '2026-02-12 13:02:00'),
-- Feb 11
(58, 2, 'present', '2026-02-11 10:04:00'),
(59, 2, 'present', '2026-02-11 14:06:00'),
-- Feb 10
(60, 2, 'present', '2026-02-10 09:02:00'),
(61, 2, 'present', '2026-02-10 13:01:00');

-- QR Requests linked to today's sessions (for QR history display)
INSERT INTO attendance_request (request_id, faculty_id, session_id, attendance_value, latitude, longitude, radius_meters, expires_at, status, accepted_count) VALUES
(UUID(), 3, 42, 1, 28.6139, 77.2090, 50, '2026-02-21 11:00:00', 'expired', 1),
(UUID(), 3, 43, 1, 28.6139, 77.2090, 50, '2026-02-21 15:00:00', 'active',  0),
(UUID(), 3, 44, 1, 28.6139, 77.2090, 50, '2026-02-20 10:30:00', 'expired', 1),
(UUID(), 3, 46, 1, 28.6139, 77.2090, 50, '2026-02-19 10:30:00', 'expired', 1),
(UUID(), 3, 52, 1, 28.6139, 77.2090, 50, '2026-02-14 10:30:00', 'expired', 1);

SELECT 'Dummy data inserted successfully' AS result;
SELECT COUNT(*) AS total_attendance_for_student2 FROM attendance WHERE student_id = 2;
