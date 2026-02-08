-- Insert Test Users for Login
-- Password for all: password123 (hashed with bcrypt)

-- Student Account
INSERT INTO users (name, email, contact_number, password, role, student_id, is_active) 
VALUES (
  'Test Student', 
  'student@demo.com', 
  '1234567890', 
  '$2b$10$rZ5kJzYvH5c9qKj6Z8KZ8OeHZqHZqHZqHZqHZqHZqHZqHZqHZqHZq', 
  'student', 
  'STU001', 
  TRUE
) ON DUPLICATE KEY UPDATE name=name;

-- Faculty Account  
INSERT INTO users (name, email, contact_number, password, role, teacher_id, is_active) 
VALUES (
  'Test Faculty', 
  'faculty@demo.com', 
  '1234567891', 
  '$2b$10$rZ5kJzYvH5c9qKj6Z8KZ8OeHZqHZqHZqHZqHZqHZqHZqHZqHZqHZq', 
  'faculty', 
  'FAC001', 
  TRUE
) ON DUPLICATE KEY UPDATE name=name;

-- Admin Account
INSERT INTO users (name, email, contact_number, password, role, is_active) 
VALUES (
  'Test Admin', 
  'admin@demo.com', 
  '1234567892', 
  '$2b$10$rZ5kJzYvH5c9qKj6Z8KZ8OeHZqHZqHZqHZqHZqHZqHZqHZqHZqHZq', 
  'admin', 
  TRUE
) ON DUPLICATE KEY UPDATE name=name;

SELECT 'Users created successfully!' as message;
SELECT email, role, name FROM users;
