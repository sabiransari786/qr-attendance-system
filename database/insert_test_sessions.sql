-- Insert test sessions for faculty
INSERT INTO sessions (faculty_id, subject, location, start_time, end_time, status, qr_expiry_time) VALUES
(2, 'Data Structures', 'Room 101', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(2, 'Web Development', 'Lab 2', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(2, 'Database Management', 'Room 202', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR));

SELECT 'Test sessions created successfully!' as message;
