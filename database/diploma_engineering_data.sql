-- ============================================================================
-- DIPLOMA IN ENGINEERING - COMPLETE DUMMY DATA
-- ============================================================================
-- 5 Branches with subjects, faculty, students, and enrollments
-- Reference: Diploma in Engineering (3rd Semester)
-- Run AFTER schema.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD course_id TO sessions TABLE (if not already)
-- ============================================================================
ALTER TABLE sessions 
  ADD COLUMN IF NOT EXISTS course_id INT NULL AFTER faculty_id,
  ADD COLUMN IF NOT EXISTS department_id INT NULL AFTER course_id;

-- Add foreign key if not exists (safe)
ALTER TABLE sessions
  ADD CONSTRAINT FOREIGN KEY fk_session_course (course_id) 
    REFERENCES courses(id) ON DELETE SET NULL;

ALTER TABLE sessions
  ADD CONSTRAINT FOREIGN KEY fk_session_dept (department_id)
    REFERENCES departments(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 2: DEPARTMENTS (5 Diploma Engineering Branches)
-- ============================================================================
INSERT INTO departments (name, code) VALUES
  ('Civil Engineering',                    'CIVIL'),
  ('Mechanical Engineering',               'MECH'),
  ('Electrical Engineering',               'ELEC'),
  ('Computer Engineering',                 'COMP'),
  ('Electronics & Telecommunication Engg', 'ELEX')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================================
-- STEP 3: UPDATE EXISTING FACULTY - Assign Departments
-- ============================================================================
-- faculty@demo.com (id=35)   → Computer Engineering
-- teacher@demo.com (id=3)    → Civil Engineering
-- Prof. Kumar (id=5)         → Mechanical Engineering
-- faculty@test.com (id=39)   → Electrical Engineering
-- faculty1@test.com (id=41)  → Electronics & Telecom

UPDATE users SET department = 'Computer Engineering'                  WHERE id = 35;
UPDATE users SET department = 'Civil Engineering'                     WHERE id = 3;
UPDATE users SET department = 'Mechanical Engineering'                WHERE id = 5;
UPDATE users SET department = 'Electrical Engineering'                WHERE id = 39;
UPDATE users SET department = 'Electronics & Telecommunication Engg'  WHERE id = 41;

-- ============================================================================
-- STEP 4: COURSES / SUBJECTS (5 subjects per branch = 25 total)
-- Each course is assigned to the relevant faculty
-- ============================================================================

-- ---- CIVIL ENGINEERING (faculty id=3) ----
INSERT INTO courses (name, code, department_id, faculty_id) VALUES
  ('Engineering Mathematics-III', 'CIV301', (SELECT id FROM departments WHERE code='CIVIL'), 3),
  ('Building Materials & Construction', 'CIV302', (SELECT id FROM departments WHERE code='CIVIL'), 3),
  ('Surveying',                  'CIV303', (SELECT id FROM departments WHERE code='CIVIL'), 3),
  ('Fluid Mechanics',            'CIV304', (SELECT id FROM departments WHERE code='CIVIL'), 3),
  ('Concrete Technology',        'CIV305', (SELECT id FROM departments WHERE code='CIVIL'), 3)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---- MECHANICAL ENGINEERING (faculty id=5) ----
INSERT INTO courses (name, code, department_id, faculty_id) VALUES
  ('Engineering Mathematics-III', 'MECH301', (SELECT id FROM departments WHERE code='MECH'), 5),
  ('Theory of Machines',          'MECH302', (SELECT id FROM departments WHERE code='MECH'), 5),
  ('Manufacturing Processes',     'MECH303', (SELECT id FROM departments WHERE code='MECH'), 5),
  ('Thermodynamics',              'MECH304', (SELECT id FROM departments WHERE code='MECH'), 5),
  ('Strength of Materials',       'MECH305', (SELECT id FROM departments WHERE code='MECH'), 5)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---- ELECTRICAL ENGINEERING (faculty id=39) ----
INSERT INTO courses (name, code, department_id, faculty_id) VALUES
  ('Engineering Mathematics-III', 'ELEC301', (SELECT id FROM departments WHERE code='ELEC'), 39),
  ('Electrical Machines-I',       'ELEC302', (SELECT id FROM departments WHERE code='ELEC'), 39),
  ('Power Systems',               'ELEC303', (SELECT id FROM departments WHERE code='ELEC'), 39),
  ('Control Systems',             'ELEC304', (SELECT id FROM departments WHERE code='ELEC'), 39),
  ('Electrical Measurements',     'ELEC305', (SELECT id FROM departments WHERE code='ELEC'), 39)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---- COMPUTER ENGINEERING (faculty id=35 = faculty@demo.com) ----
INSERT INTO courses (name, code, department_id, faculty_id) VALUES
  ('Engineering Mathematics-III', 'COMP301', (SELECT id FROM departments WHERE code='COMP'), 35),
  ('Data Structures',             'COMP302', (SELECT id FROM departments WHERE code='COMP'), 35),
  ('Computer Networks',           'COMP303', (SELECT id FROM departments WHERE code='COMP'), 35),
  ('Database Management Systems', 'COMP304', (SELECT id FROM departments WHERE code='COMP'), 35),
  ('Operating Systems',           'COMP305', (SELECT id FROM departments WHERE code='COMP'), 35)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---- ELECTRONICS & TELECOM (faculty id=41) ----
INSERT INTO courses (name, code, department_id, faculty_id) VALUES
  ('Engineering Mathematics-III',  'ELEX301', (SELECT id FROM departments WHERE code='ELEX'), 41),
  ('Digital Electronics',          'ELEX302', (SELECT id FROM departments WHERE code='ELEX'), 41),
  ('Microprocessors & Interfacing', 'ELEX303', (SELECT id FROM departments WHERE code='ELEX'), 41),
  ('Communication Systems',        'ELEX304', (SELECT id FROM departments WHERE code='ELEX'), 41),
  ('Signals & Systems',            'ELEX305', (SELECT id FROM departments WHERE code='ELEX'), 41)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================================
-- STEP 5: NEW STUDENTS (4 per branch = 20 new students)
-- Password: password123 ($2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S)
-- ============================================================================

-- CIVIL ENGINEERING students
INSERT INTO users (name, email, contact_number, password, role, student_id, department, semester, section, is_active) VALUES
  ('Aakash Sharma',    'aakash.civil@demo.com',   '9811001001', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'CIV2024001', 'Civil Engineering', '3rd', 'A', TRUE),
  ('Sana Fatima',      'sana.civil@demo.com',     '9811001002', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'CIV2024002', 'Civil Engineering', '3rd', 'A', TRUE),
  ('Rajesh Yadav',     'rajesh.civil@demo.com',   '9811001003', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'CIV2024003', 'Civil Engineering', '3rd', 'A', TRUE),
  ('Pooja Nair',       'pooja.civil@demo.com',    '9811001004', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'CIV2024004', 'Civil Engineering', '3rd', 'A', TRUE),
  ('Harish Tomar',     'harish.civil@demo.com',   '9811001005', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'CIV2024005', 'Civil Engineering', '3rd', 'B', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- MECHANICAL ENGINEERING students
INSERT INTO users (name, email, contact_number, password, role, student_id, department, semester, section, is_active) VALUES
  ('Deepak Chauhan',   'deepak.mech@demo.com',    '9811002001', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'MECH2024001', 'Mechanical Engineering', '3rd', 'A', TRUE),
  ('Ritu Saxena',      'ritu.mech@demo.com',      '9811002002', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'MECH2024002', 'Mechanical Engineering', '3rd', 'A', TRUE),
  ('Suresh Gupta',     'suresh.mech@demo.com',    '9811002003', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'MECH2024003', 'Mechanical Engineering', '3rd', 'A', TRUE),
  ('Kavita Singh',     'kavita.mech@demo.com',    '9811002004', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'MECH2024004', 'Mechanical Engineering', '3rd', 'B', TRUE),
  ('Mohit Verma',      'mohit.mech@demo.com',     '9811002005', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'MECH2024005', 'Mechanical Engineering', '3rd', 'B', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ELECTRICAL ENGINEERING students
INSERT INTO users (name, email, contact_number, password, role, student_id, department, semester, section, is_active) VALUES
  ('Pradeep Yadav',    'pradeep.elec@demo.com',   '9811003001', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'ELEC2024001', 'Electrical Engineering', '3rd', 'A', TRUE),
  ('Sunita Mishra',    'sunita.elec@demo.com',    '9811003002', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'ELEC2024002', 'Electrical Engineering', '3rd', 'A', TRUE),
  ('Vivek Tripathi',   'vivek.elec@demo.com',     '9811003003', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'ELEC2024003', 'Electrical Engineering', '3rd', 'A', TRUE),
  ('Rekha Joshi',      'rekha.elec@demo.com',     '9811003004', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'ELEC2024004', 'Electrical Engineering', '3rd', 'B', TRUE),
  ('Anand Kumar',      'anand.elec@demo.com',     '9811003005', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'ELEC2024005', 'Electrical Engineering', '3rd', 'B', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- COMPUTER ENGINEERING students
INSERT INTO users (name, email, contact_number, password, role, student_id, department, semester, section, is_active) VALUES
  ('Zara Ahmed',       'zara.comp@demo.com',      '9811004001', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'COMP2024001', 'Computer Engineering', '3rd', 'A', TRUE),
  ('Aryan Kapoor',     'aryan.comp@demo.com',     '9811004002', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'COMP2024002', 'Computer Engineering', '3rd', 'A', TRUE),
  ('Divya Soni',       'divya.comp@demo.com',     '9811004003', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'COMP2024003', 'Computer Engineering', '3rd', 'A', TRUE),
  ('Kunal Mehta',      'kunal.comp@demo.com',     '9811004004', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'COMP2024004', 'Computer Engineering', '3rd', 'B', TRUE),
  ('Shruti Pandey',    'shruti.comp@demo.com',    '9811004005', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'COMP2024005', 'Computer Engineering', '3rd', 'B', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ELECTRONICS & TELECOM students
INSERT INTO users (name, email, contact_number, password, role, student_id, department, semester, section, is_active) VALUES
  ('Rohit Dubey',      'rohit.elex@demo.com',     '9811005001', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'ELEX2024001', 'Electronics & Telecommunication Engg', '3rd', 'A', TRUE),
  ('Meena Rao',        'meena.elex@demo.com',     '9811005002', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'ELEX2024002', 'Electronics & Telecommunication Engg', '3rd', 'A', TRUE),
  ('Farhan Ansari',    'farhan.elex@demo.com',    '9811005003', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'ELEX2024003', 'Electronics & Telecommunication Engg', '3rd', 'A', TRUE),
  ('Lalita Bhatt',     'lalita.elex@demo.com',    '9811005004', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'ELEX2024004', 'Electronics & Telecommunication Engg', '3rd', 'B', TRUE),
  ('Nikhil Jain',      'nikhil.elex@demo.com',    '9811005005', '$2b$10$3E9SaEawY1oo/dZs66Sy/eQEDG384OU4Q2PXKcpS9aht3c3p6fx0S', 'student', 'ELEX2024005', 'Electronics & Telecommunication Engg', '3rd', 'B', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================================
-- STEP 6: ENROLL STUDENTS IN THEIR BRANCH COURSES
-- ============================================================================

-- Enroll CIVIL students in all 5 civil courses
INSERT INTO course_enrollment (course_id, student_id, status)
SELECT c.id, u.id, 'active'
FROM courses c
CROSS JOIN users u
WHERE c.code IN ('CIV301','CIV302','CIV303','CIV304','CIV305')
  AND u.student_id IN ('CIV2024001','CIV2024002','CIV2024003','CIV2024004','CIV2024005')
ON DUPLICATE KEY UPDATE status='active';

-- Enroll MECHANICAL students in all 5 mechanical courses
INSERT INTO course_enrollment (course_id, student_id, status)
SELECT c.id, u.id, 'active'
FROM courses c
CROSS JOIN users u
WHERE c.code IN ('MECH301','MECH302','MECH303','MECH304','MECH305')
  AND u.student_id IN ('MECH2024001','MECH2024002','MECH2024003','MECH2024004','MECH2024005')
ON DUPLICATE KEY UPDATE status='active';

-- Enroll ELECTRICAL students in all 5 electrical courses
INSERT INTO course_enrollment (course_id, student_id, status)
SELECT c.id, u.id, 'active'
FROM courses c
CROSS JOIN users u
WHERE c.code IN ('ELEC301','ELEC302','ELEC303','ELEC304','ELEC305')
  AND u.student_id IN ('ELEC2024001','ELEC2024002','ELEC2024003','ELEC2024004','ELEC2024005')
ON DUPLICATE KEY UPDATE status='active';

-- Enroll COMPUTER students in all 5 computer courses
INSERT INTO course_enrollment (course_id, student_id, status)
SELECT c.id, u.id, 'active'
FROM courses c
CROSS JOIN users u
WHERE c.code IN ('COMP301','COMP302','COMP303','COMP304','COMP305')
  AND u.student_id IN ('COMP2024001','COMP2024002','COMP2024003','COMP2024004','COMP2024005')
ON DUPLICATE KEY UPDATE status='active';

-- Enroll ELECTRONICS students in all 5 elex courses
INSERT INTO course_enrollment (course_id, student_id, status)
SELECT c.id, u.id, 'active'
FROM courses c
CROSS JOIN users u
WHERE c.code IN ('ELEX301','ELEX302','ELEX303','ELEX304','ELEX305')
  AND u.student_id IN ('ELEX2024001','ELEX2024002','ELEX2024003','ELEX2024004','ELEX2024005')
ON DUPLICATE KEY UPDATE status='active';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Departments : 5 (Civil, Mech, Elec, Comp, Elex)
-- Courses     : 25 (5 per branch)
-- Faculty     : 5 (one per branch, using existing users)
-- Students    : 25 (5 per branch, new)
-- Enrollments : 125 (each student enrolled in all 5 branch courses)
-- Passwords   : password123 for all new users
-- ============================================================================
