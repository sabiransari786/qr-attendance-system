-- ============================================================
-- SEMESTER RULES SETUP
-- University rules: student ek semester mein hota hai
-- Har branch ke students ko alag semesters mein distribute karo
-- ============================================================

-- ===== STEP 1: Assign semesters to students =====

-- Civil Engineering (dept=1): students id 64-68
UPDATE users SET semester='1st' WHERE id=64;   -- Aakash Sharma
UPDATE users SET semester='2nd' WHERE id=65;   -- Sana Fatima
UPDATE users SET semester='3rd' WHERE id=66;   -- Rajesh Yadav
UPDATE users SET semester='4th' WHERE id=67;   -- Pooja Nair
UPDATE users SET semester='5th' WHERE id=68;   -- Harish Tomar

-- Mechanical Engineering (dept=2): students id 69-73
UPDATE users SET semester='1st' WHERE id=69;   -- Deepak Chauhan
UPDATE users SET semester='2nd' WHERE id=70;   -- Ritu Saxena
UPDATE users SET semester='3rd' WHERE id=71;   -- Suresh Gupta
UPDATE users SET semester='4th' WHERE id=72;   -- Kavita Singh
UPDATE users SET semester='6th' WHERE id=73;   -- Mohit Verma

-- Electrical Engineering (dept=3): students id 74-78
UPDATE users SET semester='1st' WHERE id=74;   -- Pradeep Yadav
UPDATE users SET semester='2nd' WHERE id=75;   -- Sunita Mishra
UPDATE users SET semester='4th' WHERE id=76;   -- Vivek Tripathi
UPDATE users SET semester='5th' WHERE id=77;   -- Rekha Joshi
UPDATE users SET semester='6th' WHERE id=78;   -- Anand Kumar

-- Computer Engineering (dept=4): students id 42,47,79-83
UPDATE users SET semester='3rd' WHERE id=42;   -- MOHD SABIR ANSARI
UPDATE users SET semester='6th' WHERE id=47;   -- Saad Ashraf
UPDATE users SET semester='1st' WHERE id=79;   -- Zara Ahmed
UPDATE users SET semester='2nd' WHERE id=80;   -- Aryan Kapoor
UPDATE users SET semester='4th' WHERE id=81;   -- Divya Soni
UPDATE users SET semester='5th' WHERE id=82;   -- Kunal Mehta
UPDATE users SET semester='3rd' WHERE id=83;   -- Shruti Pandey

-- Electronics & Telecomm (dept=5): students id 84-88
UPDATE users SET semester='1st' WHERE id=84;   -- Rohit Dubey
UPDATE users SET semester='2nd' WHERE id=85;   -- Meena Rao
UPDATE users SET semester='3rd' WHERE id=86;   -- Farhan Ansari
UPDATE users SET semester='4th' WHERE id=87;   -- Lalita Bhatt
UPDATE users SET semester='6th' WHERE id=88;   -- Nikhil Jain


-- ===== STEP 2: Rebuild course_enrollment per student semester =====

DELETE FROM course_enrollment;

INSERT INTO course_enrollment (student_id, course_id, enrolled_at, status)
SELECT 
    u.id AS student_id,
    c.id AS course_id,
    NOW() AS enrolled_at,
    'active' AS status
FROM users u
JOIN departments d ON d.name = u.department
JOIN courses c ON c.department_id = d.id
WHERE u.role = 'student'
  AND u.is_active = 1
  AND c.semester IS NOT NULL
  AND (
    (u.semester = '1st' AND c.semester = 1) OR
    (u.semester = '2nd' AND c.semester = 2) OR
    (u.semester = '3rd' AND c.semester = 3) OR
    (u.semester = '4th' AND c.semester = 4) OR
    (u.semester = '5th' AND c.semester = 5) OR
    (u.semester = '6th' AND c.semester = 6)
  );


-- ===== STEP 3: Add active sessions for all 6 semesters per branch =====
-- (sem 3 already active, add sem 1,2,4,5,6)

-- Civil Engineering (faculty=3, dept=1)
-- Sem 1 active: Applied Physics (course 197)
INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (3, 197, 1, 'Applied Physics', 'Room 102, Civil Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

-- Sem 2 active: Basic Electrical Engineering (course 206)
INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (3, 206, 1, 'Basic Electrical Engineering', 'Room 103, Civil Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

-- Sem 4 active: Communication Skills-II (course 223)
INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (3, 223, 1, 'Communication Skills-II', 'Room 204, Civil Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

-- Sem 5 active: Soil Mechanics (course 232)
INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (3, 232, 1, 'Soil Mechanics & Foundation Engineering', 'Room 301, Civil Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

-- Sem 6 active: Transportation Engineering (course 242)
INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (3, 242, 1, 'Transportation Engineering', 'Room 401, Civil Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());


-- Mechanical Engineering (faculty=5, dept=2)
INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (5, 252, 2, 'Applied Physics', 'Room 102, Mech Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (5, 261, 2, 'Applied Chemistry', 'Room 104, Mech Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (5, 278, 2, 'Communication Skills-II', 'Room 205, Mech Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (5, 287, 2, 'Computer Aided Design & Manufacturing', 'Lab 501, Mech Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (5, 296, 2, 'Industrial Management', 'Room 601, Mech Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());


-- Electrical Engineering (faculty=39, dept=3)
INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (39, 360, 3, 'Applied Physics', 'Room 102, Electrical Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (39, 369, 3, 'Applied Physics', 'Room 203, Electrical Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (39, 386, 3, 'Communication Skills-II', 'Room 301, Electrical Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (39, 395, 3, 'Electrical Machines-II', 'Lab 502, Electrical Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (39, 404, 3, 'Transmission & Distribution', 'Room 601, Electrical Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());


-- Computer Engineering (faculty=35, dept=4)
INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (35, 32, 4, 'Applied Physics', 'Room 102, CS Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (35, 41, 4, 'Applied Physics', 'Lab 202, CS Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (35, 58, 4, 'Communication Skills-II', 'Room 401, CS Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (35, 67, 4, 'Computer Graphics', 'Lab 501, CS Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (35, 77, 4, 'Advanced RDBMS', 'Lab 601, CS Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());


-- Electronics & Telecomm (faculty=41, dept=5)
INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (41, 306, 5, 'Applied Physics', 'Room 102, EXTC Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (41, 315, 5, 'Digital Electronics', 'Lab 202, EXTC Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (41, 332, 5, 'Communication Skills-II', 'Room 301, EXTC Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (41, 341, 5, 'Electronic Devices & Circuits-III', 'Lab 501, EXTC Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());

INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time, created_at)
VALUES (41, 350, 5, 'Advance Communication Systems', 'Room 601, EXTC Block', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'active', NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW());
