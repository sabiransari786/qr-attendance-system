-- Insert additional attendance records for current month
-- Uses existing sessions and students

-- Session 8: Operating Systems (fill missing attendance)
INSERT INTO attendance (session_id, student_id, status, marked_at)
VALUES
  (8, 1, 'present', NOW()),
  (8, 2, 'late', DATE_SUB(NOW(), INTERVAL 6 MINUTE)),
  (8, 3, 'present', NOW()),
  (8, 4, 'absent', NOW()),
  (8, 5, 'present', NOW()),
  (8, 6, 'present', NOW()),
  (8, 7, 'late', DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
  (8, 8, 'present', NOW()),
  (8, 9, 'absent', NOW()),
  (8, 10, 'present', NOW())
ON DUPLICATE KEY UPDATE status=VALUES(status), marked_at=VALUES(marked_at);

-- Add more attendance entries for current month across active sessions
INSERT INTO attendance (session_id, student_id, status, marked_at)
VALUES
  (2, 11, 'present', NOW()),
  (2, 12, 'present', NOW()),
  (3, 11, 'late', DATE_SUB(NOW(), INTERVAL 9 MINUTE)),
  (3, 12, 'present', NOW()),
  (4, 11, 'absent', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (4, 12, 'present', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (6, 11, 'present', NOW()),
  (6, 12, 'late', DATE_SUB(NOW(), INTERVAL 7 MINUTE)),
  (7, 11, 'present', NOW()),
  (7, 12, 'present', NOW())
ON DUPLICATE KEY UPDATE status=VALUES(status), marked_at=VALUES(marked_at);

SELECT 'Additional monthly attendance inserted.' AS message;
