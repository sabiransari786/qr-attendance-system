/**
 * Demo Users Seed Script
 * 
 * Ye script server start hone pe automatically run hota hai
 * Agar demo users nahi milte toh create kar deta hai
 * Deployment ke baad bhi demo login kaam karega
 * 
 * Demo Credentials:
 *   Student → student@demo.com / demo1234
 *   Teacher → teacher@demo.com / demo1234
 *   Admin   → admin@demo.com   / demo1234
 */

const { pool } = require('./config');
const bcrypt = require('bcrypt');

const DEMO_PASSWORD = 'demo1234';
const BCRYPT_ROUNDS = 10;

const DEMO_USERS = [
  {
    name: 'Demo Student',
    email: 'student@demo.com',
    contact_number: '9999900001',
    role: 'student',
    student_id: 'STU-DEMO-001',
    teacher_id: null,
    department: 'Computer Engineering',
    semester: '3rd',
    section: 'A',
  },
  {
    name: 'Demo Teacher',
    email: 'teacher@demo.com',
    contact_number: '9999900002',
    role: 'faculty',
    student_id: null,
    teacher_id: 'FAC-DEMO-001',
    department: 'Computer Engineering',
    semester: null,
    section: null,
  },
  {
    name: 'Demo Admin',
    email: 'admin@demo.com',
    contact_number: '9999900003',
    role: 'admin',
    student_id: null,
    teacher_id: null,
    department: null,
    semester: null,
    section: null,
  },
];

/**
 * seedDemoUsers — Sab demo users ko insert karo agar exist nahi karte
 */
async function seedDemoUsers() {
  try {
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

    for (const user of DEMO_USERS) {
      // Pehle check karo user exist karta hai ya nahi
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
        [user.email]
      );

      if (existing.length > 0) {
        // User already hai — sirf profile fields update karo, password NAHI overwrite karna
        await pool.query(
          `UPDATE users SET department = COALESCE(department, ?), 
           semester = COALESCE(semester, ?), section = COALESCE(section, ?) WHERE id = ?`,
          [user.department, user.semester, user.section, existing[0].id]
        );
        continue;
      }

      // User nahi mila, insert karo
      await pool.query(
        `INSERT INTO users (name, email, contact_number, password, role, student_id, teacher_id, department, semester, section, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          user.name,
          user.email,
          user.contact_number,
          hashedPassword,
          user.role,
          user.student_id,
          user.teacher_id,
          user.department,
          user.semester,
          user.section,
        ]
      );
      console.log(`  ✅ Demo user created: ${user.email} (${user.role})`);
    }

    // ---- Seed sessions & attendance data ---- 
    const [studentRows] = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = 'student@demo.com'"
    );
    const [teacherRows] = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = 'teacher@demo.com'"
    );

    if (studentRows.length && teacherRows.length) {
      const studentId = studentRows[0].id;
      const teacherId = teacherRows[0].id;

      // Check if student already has attendance records
      const [existingAttendance] = await pool.query(
        'SELECT COUNT(*) as cnt FROM attendance WHERE student_id = ?',
        [studentId]
      );

      if (existingAttendance[0].cnt < 5) {
        // Seed sessions for teacher (last 10 days, 2 per day = 20 sessions)
        const subjects = [
          'Data Structures (DCO301)',
          'Web Development (DCO501)',
          'Database Management (DCO401)',
          'Operating Systems (DCO402)',
          'Algorithm Design (DCO502)',
        ];
        const locations = ['Room 301', 'Lab 201', 'Room 302', 'Lab 101', 'Room 303'];

        const sessionIds = [];
        for (let dayOffset = 1; dayOffset <= 10; dayOffset++) {
          for (let slotIdx = 0; slotIdx < 2; slotIdx++) {
            const subject = subjects[(dayOffset + slotIdx) % subjects.length];
            const location = locations[(dayOffset + slotIdx) % locations.length];
            const hour = slotIdx === 0 ? 10 : 14;

            try {
              const [result] = await pool.query(
                `INSERT INTO sessions (faculty_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time)
                 VALUES (?, ?, ?, 
                   DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), CONCAT('%Y-%m-%d ', LPAD(?, 2, '0'), ':00:00')),
                   DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), CONCAT('%Y-%m-%d ', LPAD(?, 2, '0'), ':30:00')),
                   'closed', 'demo-qr-seed',
                   DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), CONCAT('%Y-%m-%d ', LPAD(?, 2, '0'), ':15:00'))
                 )`,
                [teacherId, subject, location, dayOffset, hour, dayOffset, hour + 1, dayOffset, hour]
              );
              sessionIds.push(result.insertId);
            } catch (err) {
              // Skip if duplicate
            }
          }
        }

        // Attendance for student — realistic mix: 14 present, 3 late, 3 absent
        const statuses = [
          'present', 'present', 'late',    'present',
          'present', 'present', 'absent',  'present',
          'present', 'late',   'present',  'present',
          'absent',  'present', 'present', 'present',
          'late',    'present', 'absent',  'present',
        ];

        for (let i = 0; i < sessionIds.length; i++) {
          const status = statuses[i] || 'present';
          const dayOffset = Math.floor(i / 2) + 1;
          try {
            await pool.query(
              `INSERT INTO attendance (session_id, student_id, status, marked_at)
               VALUES (?, ?, ?, DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), CONCAT('%Y-%m-%d ', LPAD(?, 2, '0'), ':05:00')))
               ON DUPLICATE KEY UPDATE status = VALUES(status)`,
              [sessionIds[i], studentId, status, dayOffset, i % 2 === 0 ? 10 : 14]
            );
          } catch (err) {
            // Ignore duplicate
          }
        }

        if (sessionIds.length > 0) {
          console.log(`  ✅ Demo sessions & attendance seeded (${sessionIds.length} sessions, student id=${studentId}, teacher id=${teacherId})`);
        }
      }
    }

    console.log('🌱 Demo users seed complete.');
  } catch (err) {
    // Schema might not exist yet on very first run — don't crash server
    console.error('⚠️  Demo seed skipped (table may not exist yet):', err.message);
  }
}

module.exports = seedDemoUsers;
