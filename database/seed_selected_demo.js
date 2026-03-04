/**
 * ============================================================================
 * SELECTED DEMO ACCOUNTS - Sample Data Seed Script
 * ============================================================================
 * 
 * Ye script sirf 1 Teacher + 1 Student ke liye full sample data create karta hai.
 * Deployment ke baad bhi ye accounts mein data dikhega.
 * 
 * Demo Accounts:
 *   Teacher → demo.faculty@attendance.com / Demo@1234
 *   Student → demo.student@attendance.com / Demo@1234
 * 
 * Data Included:
 *   ✓ User accounts (teacher + student)
 *   ✓ Approved users entries
 *   ✓ 30 sessions (last 30 days, multiple subjects)
 *   ✓ Attendance records (present/late/absent mix)
 *   ✓ Manual attendance requests (pending/approved/rejected)
 *   ✓ Activity logs
 * 
 * Usage:
 *   cd backend && node ../database/seed_selected_demo.js
 * 
 * ============================================================================
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// ─── Configuration ──────────────────────────────────────────────────────────
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'attendance_tracker',
};

const PASSWORD = 'Demo@1234';
const BCRYPT_ROUNDS = 10;

// ─── Demo Account Details ───────────────────────────────────────────────────
const DEMO_TEACHER = {
  name: 'Prof. Rajesh Kumar',
  email: 'demo.faculty@attendance.com',
  contact: '9876500001',
  teacherId: 'DEMO-FAC-001',
  department: 'Computer Engineering',
};

const DEMO_TEACHER_2 = {
  name: 'Prof. Neha Sharma',
  email: 'neha.faculty@attendance.com',
  contact: '9876500003',
  teacherId: 'DEMO-FAC-002',
  department: 'Computer Engineering',
};

const DEMO_STUDENT = {
  name: 'Aryan Verma',
  email: 'demo.student@attendance.com',
  contact: '9876500002',
  studentId: 'DEMO-STU-001',
  department: 'Computer Engineering',
  semester: '3rd',
  section: 'A',
};

// ─── Subjects & Locations ───────────────────────────────────────────────────
const SUBJECTS = [
  'Data Structures & Algorithms (CO301)',
  'Web Development (CO501)',
  'Database Management System (CO401)',
  'Operating Systems (CO402)',
  'Computer Networks (CO502)',
  'Software Engineering (CO601)',
];

const SUBJECTS_2 = [
  'Object Oriented Programming (CO302)',
  'Microprocessors & Interfaces (CO503)',
  'Digital Electronics (CO202)',
  'Theory of Computation (CO403)',
  'Machine Learning (CO602)',
  'Cloud Computing (CO604)',
];

const LOCATIONS = [
  'Room 301 - Main Building',
  'Computer Lab 201',
  'Room 102 - Block A',
  'Computer Lab 301',
  'Room 205 - Block B',
  'Seminar Hall 101',
];

// ─── Main Seed Function ─────────────────────────────────────────────────────
async function seedSelectedDemo() {
  const pool = await mysql.createPool(DB_CONFIG);
  
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   SELECTED DEMO ACCOUNTS - SEED SCRIPT                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const hashedPassword = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);
  console.log('🔐 Password hashed successfully\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Create/Update Demo Teacher Account
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── STEP 1: Creating Demo Teacher ──');

  const [existingTeacher] = await pool.query(
    "SELECT id FROM users WHERE LOWER(email) = LOWER(?)", [DEMO_TEACHER.email]
  );

  let teacherId;
  if (existingTeacher.length > 0) {
    teacherId = existingTeacher[0].id;
    await pool.query(
      `UPDATE users SET password = ?, name = ?, department = ?, 
       teacher_id = COALESCE(teacher_id, ?), contact_number = ?, is_active = TRUE, role = 'faculty'
       WHERE id = ?`,
      [hashedPassword, DEMO_TEACHER.name, DEMO_TEACHER.department, DEMO_TEACHER.teacherId, DEMO_TEACHER.contact, teacherId]
    );
    console.log(`   ✅ Teacher updated: ${DEMO_TEACHER.email}`);
  } else {
    const [result] = await pool.query(
      `INSERT INTO users (name, email, contact_number, password, role, teacher_id, department, is_active)
       VALUES (?, ?, ?, ?, 'faculty', ?, ?, TRUE)`,
      [DEMO_TEACHER.name, DEMO_TEACHER.email, DEMO_TEACHER.contact, hashedPassword, DEMO_TEACHER.teacherId, DEMO_TEACHER.department]
    );
    teacherId = result.insertId;
    console.log(`   ✅ Teacher created: ${DEMO_TEACHER.email}`);
  }

  // Approved users entry for teacher
  await pool.query(
    `INSERT INTO approved_users (name, email, contact_number, role, teacher_id, department, is_registered, registered_user_id)
     VALUES (?, ?, ?, 'faculty', ?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE is_registered = 1, registered_user_id = ?, updated_at = NOW()`,
    [DEMO_TEACHER.name, DEMO_TEACHER.email, DEMO_TEACHER.contact, DEMO_TEACHER.teacherId, DEMO_TEACHER.department, teacherId, teacherId]
  );
  console.log(`   ✅ Teacher approved_users entry added\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1B: Create/Update Demo Teacher 2 (Computer Engineering)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── STEP 1B: Creating Demo Teacher 2 (CE) ──');

  const [existingTeacher2] = await pool.query(
    "SELECT id FROM users WHERE LOWER(email) = LOWER(?)", [DEMO_TEACHER_2.email]
  );

  let teacher2Id;
  if (existingTeacher2.length > 0) {
    teacher2Id = existingTeacher2[0].id;
    await pool.query(
      `UPDATE users SET password = ?, name = ?, department = ?, 
       teacher_id = COALESCE(teacher_id, ?), contact_number = ?, is_active = TRUE, role = 'faculty'
       WHERE id = ?`,
      [hashedPassword, DEMO_TEACHER_2.name, DEMO_TEACHER_2.department, DEMO_TEACHER_2.teacherId, DEMO_TEACHER_2.contact, teacher2Id]
    );
    console.log(`   ✅ Teacher 2 updated: ${DEMO_TEACHER_2.email}`);
  } else {
    const [result] = await pool.query(
      `INSERT INTO users (name, email, contact_number, password, role, teacher_id, department, is_active)
       VALUES (?, ?, ?, ?, 'faculty', ?, ?, TRUE)`,
      [DEMO_TEACHER_2.name, DEMO_TEACHER_2.email, DEMO_TEACHER_2.contact, hashedPassword, DEMO_TEACHER_2.teacherId, DEMO_TEACHER_2.department]
    );
    teacher2Id = result.insertId;
    console.log(`   ✅ Teacher 2 created: ${DEMO_TEACHER_2.email}`);
  }

  // Approved users entry for teacher 2
  await pool.query(
    `INSERT INTO approved_users (name, email, contact_number, role, teacher_id, department, is_registered, registered_user_id)
     VALUES (?, ?, ?, 'faculty', ?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE is_registered = 1, registered_user_id = ?, updated_at = NOW()`,
    [DEMO_TEACHER_2.name, DEMO_TEACHER_2.email, DEMO_TEACHER_2.contact, DEMO_TEACHER_2.teacherId, DEMO_TEACHER_2.department, teacher2Id, teacher2Id]
  );
  console.log(`   ✅ Teacher 2 approved_users entry added\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Create/Update Demo Student Account
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── STEP 2: Creating Demo Student ──');

  const [existingStudent] = await pool.query(
    "SELECT id FROM users WHERE LOWER(email) = LOWER(?)", [DEMO_STUDENT.email]
  );

  let studentId;
  if (existingStudent.length > 0) {
    studentId = existingStudent[0].id;
    await pool.query(
      `UPDATE users SET password = ?, name = ?, department = ?, semester = ?, section = ?,
       student_id = COALESCE(student_id, ?), contact_number = ?, is_active = TRUE, role = 'student'
       WHERE id = ?`,
      [hashedPassword, DEMO_STUDENT.name, DEMO_STUDENT.department, DEMO_STUDENT.semester, DEMO_STUDENT.section, DEMO_STUDENT.studentId, DEMO_STUDENT.contact, studentId]
    );
    console.log(`   ✅ Student updated: ${DEMO_STUDENT.email}`);
  } else {
    const [result] = await pool.query(
      `INSERT INTO users (name, email, contact_number, password, role, student_id, department, semester, section, is_active)
       VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, TRUE)`,
      [DEMO_STUDENT.name, DEMO_STUDENT.email, DEMO_STUDENT.contact, hashedPassword, DEMO_STUDENT.studentId, DEMO_STUDENT.department, DEMO_STUDENT.semester, DEMO_STUDENT.section]
    );
    studentId = result.insertId;
    console.log(`   ✅ Student created: ${DEMO_STUDENT.email}`);
  }

  // Approved users entry for student
  await pool.query(
    `INSERT INTO approved_users (name, email, contact_number, role, student_id, department, semester, section, is_registered, registered_user_id)
     VALUES (?, ?, ?, 'student', ?, ?, ?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE is_registered = 1, registered_user_id = ?, updated_at = NOW()`,
    [DEMO_STUDENT.name, DEMO_STUDENT.email, DEMO_STUDENT.contact, DEMO_STUDENT.studentId, DEMO_STUDENT.department, 3, DEMO_STUDENT.section, studentId, studentId]
  );
  console.log(`   ✅ Student approved_users entry added\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Create Sessions (last 30 days)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── STEP 3: Creating Sessions ──');

  // Clean old demo sessions for this teacher
  await pool.query(
    `DELETE FROM sessions WHERE faculty_id = ? AND qr_code = 'DEMO-SEED-QR'`,
    [teacherId]
  );

  const sessionIds = [];
  const sessionDetails = [];

  for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
    // Skip Sundays (dayOffset % 7 === 0)
    if (dayOffset % 7 === 0) continue;

    const subjectIdx = (dayOffset - 1) % SUBJECTS.length;
    const hour = dayOffset % 2 === 0 ? 9 : 14; // Alternate morning/afternoon
    const status = dayOffset <= 2 ? 'active' : 'closed'; // Last 2 days = active sessions

    const [result] = await pool.query(
      `INSERT INTO sessions (faculty_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time)
       VALUES (?, ?, ?,
         DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL ? HOUR,
         DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL ? HOUR,
         ?, 'DEMO-SEED-QR',
         DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL ? HOUR
       )`,
      [
        teacherId,
        SUBJECTS[subjectIdx],
        LOCATIONS[subjectIdx],
        dayOffset, hour,
        dayOffset, hour + 1,
        status,
        dayOffset, hour + 1,
      ]
    );
    sessionIds.push(result.insertId);
    sessionDetails.push({
      id: result.insertId,
      subject: SUBJECTS[subjectIdx],
      dayOffset,
      status,
    });
  }
  console.log(`   ✅ ${sessionIds.length} sessions created (last 30 days)\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3B: Create Sessions for Teacher 2 (last 30 days)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── STEP 3B: Creating Sessions for Teacher 2 ──');

  // Clean old demo sessions for this teacher
  await pool.query(
    `DELETE FROM sessions WHERE faculty_id = ? AND qr_code = 'DEMO-SEED-QR-T2'`,
    [teacher2Id]
  );

  const session2Ids = [];
  const session2Details = [];

  for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
    // Skip Sundays (dayOffset % 7 === 0)
    if (dayOffset % 7 === 0) continue;

    const subjectIdx = (dayOffset - 1) % SUBJECTS_2.length;
    const hour = dayOffset % 2 === 0 ? 11 : 15; // Different times from Teacher 1
    const status = dayOffset <= 2 ? 'active' : 'closed';

    const [result] = await pool.query(
      `INSERT INTO sessions (faculty_id, subject, location, start_time, end_time, status, qr_code, qr_expiry_time)
       VALUES (?, ?, ?,
         DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL ? HOUR,
         DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL ? HOUR,
         ?, 'DEMO-SEED-QR-T2',
         DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL ? HOUR
       )`,
      [
        teacher2Id,
        SUBJECTS_2[subjectIdx],
        LOCATIONS[subjectIdx],
        dayOffset, hour,
        dayOffset, hour + 1,
        status,
        dayOffset, hour + 1,
      ]
    );
    session2Ids.push(result.insertId);
    session2Details.push({
      id: result.insertId,
      subject: SUBJECTS_2[subjectIdx],
      dayOffset,
      status,
    });
  }
  console.log(`   ✅ ${session2Ids.length} sessions created for Teacher 2\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Add Attendance Records for Demo Student
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── STEP 4: Adding Attendance Records ──');

  // Realistic attendance pattern: ~75% present, ~12% late, ~13% absent
  const attendancePattern = [
    'present', 'present', 'late',    'present', 'present',
    'present', 'absent',  'present', 'present', 'present',
    'late',    'present', 'present', 'present', 'absent',
    'present', 'present', 'present', 'late',    'present',
    'present', 'present', 'absent',  'present', 'present',
    'present', 'present', 'present', 'present', 'late',
  ];

  let attendanceCount = 0;
  for (let i = 0; i < sessionIds.length; i++) {
    const sessId = sessionIds[i];
    const status = attendancePattern[i % attendancePattern.length];
    const dayOffset = sessionDetails[i].dayOffset;

    try {
      await pool.query(
        `INSERT INTO attendance (session_id, student_id, status, marked_at)
         VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL 10 HOUR)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [sessId, studentId, status, dayOffset]
      );
      attendanceCount++;
    } catch (err) { /* skip */ }
  }

  // Count stats
  const presentCount = attendancePattern.slice(0, sessionIds.length).filter(s => s === 'present').length;
  const lateCount = attendancePattern.slice(0, sessionIds.length).filter(s => s === 'late').length;
  const absentCount = attendancePattern.slice(0, sessionIds.length).filter(s => s === 'absent').length;

  console.log(`   ✅ ${attendanceCount} attendance records added (Teacher 1)`);
  console.log(`      Present: ${presentCount} | Late: ${lateCount} | Absent: ${absentCount}\n`);

  // Attendance for Teacher 2 sessions
  let attendance2Count = 0;
  const attendancePattern2 = [
    'present', 'present', 'present', 'late',    'present',
    'present', 'present', 'absent',  'present', 'present',
    'present', 'present', 'late',    'present', 'present',
    'absent',  'present', 'present', 'present', 'present',
    'present', 'late',    'present', 'present', 'present',
    'present', 'present', 'present', 'absent',  'present',
  ];

  for (let i = 0; i < session2Ids.length; i++) {
    const sessId = session2Ids[i];
    const status = attendancePattern2[i % attendancePattern2.length];
    const dayOffset = session2Details[i].dayOffset;

    try {
      await pool.query(
        `INSERT INTO attendance (session_id, student_id, status, marked_at)
         VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL 12 HOUR)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [sessId, studentId, status, dayOffset]
      );
      attendance2Count++;
    } catch (err) { /* skip */ }
  }

  const present2Count = attendancePattern2.slice(0, session2Ids.length).filter(s => s === 'present').length;
  const late2Count = attendancePattern2.slice(0, session2Ids.length).filter(s => s === 'late').length;
  const absent2Count = attendancePattern2.slice(0, session2Ids.length).filter(s => s === 'absent').length;

  console.log(`   ✅ ${attendance2Count} attendance records added (Teacher 2)`);
  console.log(`      Present: ${present2Count} | Late: ${late2Count} | Absent: ${absent2Count}\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: Add Manual Attendance Requests
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── STEP 5: Adding Manual Attendance Requests ──');

  // Find sessions where student was absent for manual request
  const absentSessions = sessionDetails.filter((s, i) => 
    attendancePattern[i % attendancePattern.length] === 'absent'
  );

  let requestCount = 0;
  const requestReasons = [
    'I was present in class but QR code expired before I could scan it.',
    'Network issue - my phone could not connect to scan the QR code.',
    'I was in the class but forgot to bring my phone that day.',
    'Medical emergency - I came late and missed the QR window.',
    'Phone battery died during class, could not scan QR.',
  ];
  const requestStatuses = ['pending', 'approved', 'rejected', 'pending', 'approved'];

  for (let i = 0; i < Math.min(absentSessions.length, 5); i++) {
    const sess = absentSessions[i];
    const reqStatus = requestStatuses[i];
    const reason = requestReasons[i];

    try {
      // Check if request already exists
      const [existing] = await pool.query(
        'SELECT id FROM manual_attendance_request WHERE student_id = ? AND session_id = ?',
        [studentId, sess.id]
      );

      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO manual_attendance_request (student_id, session_id, reason, status, reviewed_by, reviewed_at, rejection_note, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 
             DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL 16 HOUR,
             DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL 18 HOUR)`,
          [
            studentId,
            sess.id,
            reason,
            reqStatus,
            reqStatus !== 'pending' ? teacherId : null,
            reqStatus !== 'pending' ? new Date() : null,
            reqStatus === 'rejected' ? 'Student was not seen in class during the session.' : null,
            sess.dayOffset,
            sess.dayOffset,
          ]
        );
        requestCount++;
      }
    } catch (err) { /* skip duplicates */ }
  }
  console.log(`   ✅ ${requestCount} manual attendance requests added\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: Add Activity Logs
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── STEP 6: Adding Activity Logs ──');

  const activities = [
    { userId: teacherId, role: 'faculty', action: 'AUTH_LOGIN', method: 'POST', path: '/api/auth/login', status: 200 },
    { userId: teacherId, role: 'faculty', action: 'SESSION_CREATE', method: 'POST', path: '/api/session', status: 201 },
    { userId: teacherId, role: 'faculty', action: 'QR_GENERATE', method: 'POST', path: '/api/qr-request', status: 201 },
    { userId: teacherId, role: 'faculty', action: 'ATTENDANCE_VIEW', method: 'GET', path: '/api/attendance/session/1', status: 200 },
    { userId: studentId, role: 'student', action: 'AUTH_LOGIN', method: 'POST', path: '/api/auth/login', status: 200 },
    { userId: studentId, role: 'student', action: 'QR_SCAN', method: 'POST', path: '/api/attendance/mark', status: 200 },
    { userId: studentId, role: 'student', action: 'ATTENDANCE_VIEW', method: 'GET', path: '/api/attendance/student', status: 200 },
    { userId: studentId, role: 'student', action: 'MANUAL_REQUEST', method: 'POST', path: '/api/attendance/manual-request', status: 201 },
    { userId: teacherId, role: 'faculty', action: 'REQUEST_APPROVE', method: 'PUT', path: '/api/attendance/approve-request/1', status: 200 },
    { userId: teacherId, role: 'faculty', action: 'AUTH_LOGOUT', method: 'POST', path: '/api/auth/logout', status: 200 },
  ];

  let activityCount = 0;
  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    try {
      await pool.query(
        `INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, method, path, status_code, ip_address, user_agent, duration_ms, created_at)
         VALUES (?, ?, ?, 'user', ?, ?, ?, ?, '127.0.0.1', 'Demo-Seed/1.0', ?, DATE_SUB(NOW(), INTERVAL ? HOUR))`,
        [a.userId, a.role, a.action, String(a.userId), a.method, a.path, a.status, Math.floor(Math.random() * 200) + 20, (activities.length - i) * 2]
      );
      activityCount++;
    } catch (err) { /* skip */ }
  }
  console.log(`   ✅ ${activityCount} activity logs added\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   ✅ SEED COMPLETE - SUMMARY                                ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║                                                              ║');
  console.log('║   Demo Teacher 1 Account:                                    ║');
  console.log(`║     Name:      ${DEMO_TEACHER.name.padEnd(42)}║`);
  console.log(`║     Email:     ${DEMO_TEACHER.email.padEnd(42)}║`);
  console.log(`║     Password:  ${PASSWORD.padEnd(42)}║`);
  console.log('║                                                              ║');
  console.log('║   Demo Teacher 2 Account (CE):                               ║');
  console.log(`║     Name:      ${DEMO_TEACHER_2.name.padEnd(42)}║`);
  console.log(`║     Email:     ${DEMO_TEACHER_2.email.padEnd(42)}║`);
  console.log(`║     Password:  ${PASSWORD.padEnd(42)}║`);
  console.log('║                                                              ║');
  console.log('║   Demo Student Account:                                      ║');
  console.log(`║     Name:      ${DEMO_STUDENT.name.padEnd(42)}║`);
  console.log(`║     Email:     ${DEMO_STUDENT.email.padEnd(42)}║`);
  console.log(`║     Password:  ${PASSWORD.padEnd(42)}║`);
  console.log(`║     Department:${DEMO_STUDENT.department.padEnd(42)}║`);
  console.log('║                                                              ║');
  console.log('║   Data Created:                                              ║');
  console.log(`║     Sessions (T1):      ${String(sessionIds.length).padEnd(33)}║`);
  console.log(`║     Sessions (T2):      ${String(session2Ids.length).padEnd(33)}║`);
  console.log(`║     Attendance (T1):    ${String(attendanceCount).padEnd(33)}║`);
  console.log(`║     Attendance (T2):    ${String(attendance2Count).padEnd(33)}║`);
  console.log(`║     Manual Requests:    ${String(requestCount).padEnd(33)}║`);
  console.log(`║     Activity Logs:      ${String(activityCount).padEnd(33)}║`);
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  await pool.end();
}

// ─── Run ─────────────────────────────────────────────────────────────────────
seedSelectedDemo().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
