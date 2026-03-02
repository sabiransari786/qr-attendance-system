/**
 * Insert Active Sessions for QR Generation
 * Run: node database/insert_active_sessions.js
 * 
 * Ye script faculty users ke liye active sessions insert karta hai
 * taaki QR Generation page pe sessions dikhe aur QR generate ho sake.
 */

const mysql = require('mysql2/promise');

async function insertActiveSessions() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'attendance_tracker'
  });

  try {
    console.log('🔗 Database se connect ho rahe hain...');

    // Pehle existing active sessions delete kar do (fresh start)
    const [deleted] = await pool.execute("DELETE FROM sessions WHERE status = 'active'");
    console.log(`🗑️  ${deleted.affectedRows} purane active sessions delete kiye`);

    const now = new Date();
    const formatTs = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

    // Session definitions: [faculty_id, subject, location, course_id, duration_hrs]
    const sessionDefs = [
      // Faculty ID 3 (teacher@demo.com)
      [3, 'Communication Skills-I',  'Room 101', 196, 1, 1],
      [3, 'Applied Physics',         'Lab 201',  197, 1, 2],
      [3, 'Applied Mathematics-I',   'Room 202', 199, 1, 3],
      [3, 'Applied Chemistry',       'Lab 102',  198, 1, 4],
      [3, 'Workshop Practice',       'Workshop', 204, 2, 5],

      // Faculty ID 5 (kumar@demo.com)
      [5, 'Operating Systems',       'Room 301', null, 1, 1],
      [5, 'Data Structures',         'Lab 302',  null, 1, 2],

      // Faculty ID 35 (faculty@demo.com)
      [35, 'Web Technologies',       'Lab 401',  null, 1, 1],
      [35, 'Database Management',    'Room 402', null, 1, 2],

      // Faculty ID 39 (faculty@test.com)
      [39, 'Algorithm Design',       'Room 501', null, 1, 1],

      // Faculty ID 41 (faculty1@test.com)
      [41, 'Computer Networks',      'Lab 601',  null, 1, 1],
    ];

    const insertedSessions = [];

    for (const [fac_id, subject, location, course_id, dur_hrs, offsetHrs] of sessionDefs) {
      // Start time: stagger by offsetHrs hours back from now so they feel spread out
      const startTime = new Date(now.getTime() - offsetHrs * 60 * 60 * 1000 + 30 * 60 * 1000); // 30 min into class
      const endTime   = new Date(startTime.getTime() + dur_hrs * 60 * 60 * 1000);
      const qrExpiry  = new Date(now.getTime() + 2 * 60 * 60 * 1000); // expires 2 hrs from now

      const [result] = await pool.execute(
        `INSERT INTO sessions 
          (faculty_id, course_id, subject, location, start_time, end_time, status, qr_expiry_time) 
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
        [
          fac_id,
          course_id || null,
          subject,
          location,
          formatTs(startTime),
          formatTs(endTime),
          formatTs(qrExpiry)
        ]
      );

      insertedSessions.push({
        id: result.insertId,
        faculty_id: fac_id,
        subject,
        location,
        status: 'active'
      });

      console.log(`✅ Session inserted: [ID=${result.insertId}] ${subject} (Faculty: ${fac_id})`);
    }

    console.log('\n🎉 Saare active sessions successfully insert ho gaye!');
    console.log(`📊 Total: ${insertedSessions.length} active sessions`);
    console.log('\n📋 Summary:');
    insertedSessions.forEach(s => {
      console.log(`   • Session #${s.id}: "${s.subject}" @ ${s.location} (Faculty ID: ${s.faculty_id})`);
    });

    console.log('\n🔑 Login Credentials:');
    console.log('   teacher@demo.com  → 5 active sessions');
    console.log('   kumar@demo.com    → 2 active sessions');
    console.log('   faculty@demo.com  → 2 active sessions');
    console.log('   faculty@test.com  → 1 active session');
    console.log('   faculty1@test.com → 1 active session');
    console.log('\n✨ Ab Faculty Module mein login karo aur QR generate karo!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

insertActiveSessions();
