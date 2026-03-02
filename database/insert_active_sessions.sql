-- Insert Active Sessions for QR Generation
-- Run: mysql -u root attendance_tracker < database/insert_active_sessions.sql

DELETE FROM sessions WHERE status = 'active';

INSERT INTO sessions (faculty_id, course_id, subject, location, start_time, end_time, status, qr_expiry_time) VALUES
(3, 196, 'Communication Skills-I', 'Room 101', DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_ADD(NOW(), INTERVAL 60 MINUTE), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(3, 197, 'Applied Physics', 'Lab 201', DATE_SUB(NOW(), INTERVAL 20 MINUTE), DATE_ADD(NOW(), INTERVAL 70 MINUTE), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(3, 199, 'Applied Mathematics-I', 'Room 202', DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_ADD(NOW(), INTERVAL 75 MINUTE), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(3, 198, 'Applied Chemistry', 'Lab 102', DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_ADD(NOW(), INTERVAL 80 MINUTE), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(3, 204, 'Workshop Practice', 'Workshop Hall', DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_ADD(NOW(), INTERVAL 115 MINUTE), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(5, NULL, 'Operating Systems', 'Room 301', DATE_SUB(NOW(), INTERVAL 25 MINUTE), DATE_ADD(NOW(), INTERVAL 65 MINUTE), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(5, NULL, 'Data Structures', 'Lab 302', DATE_SUB(NOW(), INTERVAL 20 MINUTE), DATE_ADD(NOW(), INTERVAL 70 MINUTE), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(35, NULL, 'Web Technologies', 'Lab 401', DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_ADD(NOW(), INTERVAL 60 MINUTE), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(35, NULL, 'Database Management', 'Room 402', DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_ADD(NOW(), INTERVAL 75 MINUTE), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(39, NULL, 'Algorithm Design', 'Room 501', DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_ADD(NOW(), INTERVAL 80 MINUTE), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(41, NULL, 'Computer Networks', 'Lab 601', DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_ADD(NOW(), INTERVAL 85 MINUTE), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR));

SELECT s.id, s.faculty_id, u.name AS faculty_name, s.subject, s.location, s.status
FROM sessions s
JOIN users u ON s.faculty_id = u.id
WHERE s.status = 'active'
ORDER BY s.faculty_id, s.id;
