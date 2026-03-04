-- Add faculty users for each department (password: demo1234)
-- Using the same bcrypt hash as existing demo teacher

INSERT INTO users (name, email, contact_number, password, role, teacher_id, department) VALUES
('Prof. Sharma (EE)', 'teacher.ee@demo.com', '9999900003', '$2b$10$29hFtUYYGdZFB9bTjCiRlOMOKyNlgjlSPXJQg0FvOKqsjT8J0NsV6', 'faculty', 'FAC-EE-001', 'Electrical Engineering'),
('Prof. Verma (CV)', 'teacher.cv@demo.com', '9999900004', '$2b$10$29hFtUYYGdZFB9bTjCiRlOMOKyNlgjlSPXJQg0FvOKqsjT8J0NsV6', 'faculty', 'FAC-CV-001', 'Civil Engineering'),
('Prof. Patel (EC)', 'teacher.ec@demo.com', '9999900005', '$2b$10$29hFtUYYGdZFB9bTjCiRlOMOKyNlgjlSPXJQg0FvOKqsjT8J0NsV6', 'faculty', 'FAC-EC-001', 'Electronics & Communication');
