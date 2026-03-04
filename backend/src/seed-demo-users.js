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
 * 
 * Admin Credentials (Only 2 Admins):
 *   Admin 1 → admin@qrattendance.com / Admin@123
 *   Admin 2 → superadmin@qrattendance.com / SuperAdmin@123
 */

const { pool } = require('./config');
const bcrypt = require('bcrypt');

const DEMO_PASSWORD = 'demo1234';
const BCRYPT_ROUNDS = 10;

// Allowed Admin Emails - Only these 2 admin accounts will exist
const ALLOWED_ADMIN_EMAILS = ['admin@qrattendance.com', 'superadmin@qrattendance.com'];

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
    password: DEMO_PASSWORD,
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
    password: DEMO_PASSWORD,
  },
];

// Admin accounts with custom passwords
const ADMIN_USERS = [
  {
    name: 'System Administrator',
    email: 'admin@qrattendance.com',
    contact_number: '9999988881',
    role: 'admin',
    student_id: null,
    teacher_id: null,
    department: null,
    semester: null,
    section: null,
    password: 'Admin@123',
  },
  {
    name: 'Super Administrator',
    email: 'superadmin@qrattendance.com',
    contact_number: '9999988882',
    role: 'admin',
    student_id: null,
    teacher_id: null,
    department: null,
    semester: null,
    section: null,
    password: 'SuperAdmin@123',
  },
];

/**
 * seedDemoUsers — Sab demo users ko insert karo agar exist nahi karte
 */
async function seedDemoUsers() {
  try {
    // ============================================================================
    // STEP 1: Delete all admin accounts except the 2 allowed ones
    // ============================================================================
    const placeholders = ALLOWED_ADMIN_EMAILS.map(() => '?').join(', ');
    const [deletedAdmins] = await pool.query(
      `DELETE FROM users WHERE role = 'admin' AND LOWER(email) NOT IN (${placeholders.toLowerCase()})`,
      ALLOWED_ADMIN_EMAILS.map(e => e.toLowerCase())
    );
    if (deletedAdmins.affectedRows > 0) {
      console.log(`  🗑️  Removed ${deletedAdmins.affectedRows} extra admin account(s)`);
    }

    // ============================================================================
    // STEP 1.5: Keep only 1 student and 1 teacher (cleanup extra demo users)
    // ============================================================================
    const allowedDemoEmails = DEMO_USERS.map(u => u.email.toLowerCase());
    const [deletedStudents] = await pool.query(
      `DELETE FROM users WHERE role = 'student' AND LOWER(email) NOT IN (?)`,
      [allowedDemoEmails]
    );
    const [deletedFaculty] = await pool.query(
      `DELETE FROM users WHERE role = 'faculty' AND LOWER(email) NOT IN (?)`,
      [allowedDemoEmails]
    );
    if (deletedStudents.affectedRows > 0 || deletedFaculty.affectedRows > 0) {
      console.log(`  🗑️  Removed ${deletedStudents.affectedRows} extra student(s) and ${deletedFaculty.affectedRows} extra faculty`);
    }

    // ============================================================================
    // STEP 2: Seed demo users (student, teacher) with default password
    // ============================================================================
    const hashedDemoPassword = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

    for (const user of DEMO_USERS) {
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
        [user.email]
      );

      if (existing.length > 0) {
        await pool.query(
          `UPDATE users SET department = COALESCE(department, ?), 
           semester = COALESCE(semester, ?), section = COALESCE(section, ?) WHERE id = ?`,
          [user.department, user.semester, user.section, existing[0].id]
        );
        continue;
      }

      await pool.query(
        `INSERT INTO users (name, email, contact_number, password, role, student_id, teacher_id, department, semester, section, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          user.name,
          user.email,
          user.contact_number,
          hashedDemoPassword,
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

    // ============================================================================
    // STEP 3: Seed admin users with custom passwords
    // ============================================================================
    for (const admin of ADMIN_USERS) {
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
        [admin.email]
      );

      if (existing.length > 0) {
        // Admin exists - don't overwrite password
        continue;
      }

      const hashedAdminPassword = await bcrypt.hash(admin.password, BCRYPT_ROUNDS);
      await pool.query(
        `INSERT INTO users (name, email, contact_number, password, role, student_id, teacher_id, department, semester, section, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          admin.name,
          admin.email,
          admin.contact_number,
          hashedAdminPassword,
          admin.role,
          admin.student_id,
          admin.teacher_id,
          admin.department,
          admin.semester,
          admin.section,
        ]
      );
      console.log(`  ✅ Admin user created: ${admin.email}`);
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

        // ============================================================================
        // STEP 5: Seed manual attendance requests (sample requests for faculty review)
        // ============================================================================
        const [existingRequests] = await pool.query(
          'SELECT COUNT(*) as cnt FROM manual_attendance_request WHERE student_id = ?',
          [studentId]
        );

        if (existingRequests[0].cnt < 3 && sessionIds.length >= 3) {
          // Add sample manual attendance requests
          const requestReasons = [
            { sessionIdx: 0, reason: 'Phone battery died during QR scan', status: 'pending' },
            { sessionIdx: 1, reason: 'Network issue, could not scan QR', status: 'approved' },
            { sessionIdx: 2, reason: 'Was late due to bus delay', status: 'rejected' },
          ];

          for (const req of requestReasons) {
            try {
              await pool.query(
                `INSERT INTO manual_attendance_request (student_id, session_id, reason, status, reviewed_by, reviewed_at)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status)`,
                [
                  studentId,
                  sessionIds[req.sessionIdx],
                  req.reason,
                  req.status,
                  req.status !== 'pending' ? teacherId : null,
                  req.status !== 'pending' ? new Date() : null,
                ]
              );
            } catch (err) {
              // Ignore duplicates
            }
          }
          console.log(`  ✅ Demo manual attendance requests seeded`);
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
