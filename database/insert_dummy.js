const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function run() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'attendance_tracker'
  });

  try {
    // Check current max session id
    const [[{maxId}]] = await pool.execute('SELECT MAX(id) as maxId FROM sessions');
    console.log('Current max session id:', maxId);

    // Insert sessions
    const sessions = [
      ['Data Structures',     'active', '2026-02-21 10:00:00', '2026-02-21 11:30:00', 'Room 301'],
      ['Web Development',     'active', '2026-02-21 14:00:00', '2026-02-21 15:30:00', 'Lab 201'],
      ['Database Management', 'closed', '2026-02-20 10:00:00', '2026-02-20 11:30:00', 'Room 302'],
      ['Algorithm Design',    'closed', '2026-02-20 14:00:00', '2026-02-20 15:30:00', 'Room 303'],
      ['Operating Systems',   'closed', '2026-02-19 10:00:00', '2026-02-19 11:30:00', 'Lab 101'],
      ['Data Structures',     'closed', '2026-02-19 13:00:00', '2026-02-19 14:30:00', 'Room 301'],
      ['Web Development',     'closed', '2026-02-18 09:00:00', '2026-02-18 10:30:00', 'Lab 201'],
      ['Database Management', 'closed', '2026-02-18 14:00:00', '2026-02-18 15:30:00', 'Room 302'],
      ['Operating Systems',   'closed', '2026-02-17 10:00:00', '2026-02-17 11:30:00', 'Lab 101'],
      ['Algorithm Design',    'closed', '2026-02-17 13:00:00', '2026-02-17 14:30:00', 'Room 303'],
      ['Data Structures',     'closed', '2026-02-14 10:00:00', '2026-02-14 11:30:00', 'Room 301'],
      ['Web Development',     'closed', '2026-02-14 13:00:00', '2026-02-14 14:30:00', 'Lab 201'],
      ['Database Management', 'closed', '2026-02-13 10:00:00', '2026-02-13 11:30:00', 'Room 302'],
      ['Operating Systems',   'closed', '2026-02-13 14:00:00', '2026-02-13 15:30:00', 'Lab 101'],
      ['Algorithm Design',    'closed', '2026-02-12 09:00:00', '2026-02-12 10:30:00', 'Room 303'],
      ['Data Structures',     'closed', '2026-02-12 13:00:00', '2026-02-12 14:30:00', 'Room 301'],
      ['Web Development',     'closed', '2026-02-11 10:00:00', '2026-02-11 11:30:00', 'Lab 201'],
      ['Database Management', 'closed', '2026-02-11 14:00:00', '2026-02-11 15:30:00', 'Room 302'],
      ['Operating Systems',   'closed', '2026-02-10 09:00:00', '2026-02-10 10:30:00', 'Lab 101'],
      ['Algorithm Design',    'closed', '2026-02-10 13:00:00', '2026-02-10 14:30:00', 'Room 303'],
    ];

    const insertedIds = [];
    for (const s of sessions) {
      const [r] = await pool.execute(
        'INSERT INTO sessions (subject, faculty_id, status, start_time, end_time, location) VALUES (?, 3, ?, ?, ?, ?)',
        s
      );
      insertedIds.push(r.insertId);
    }
    console.log('Sessions inserted, IDs:', insertedIds[0], 'to', insertedIds[insertedIds.length - 1]);

    // Map: index 0 = today DS, 1 = today WD, 2 = Feb20 DB, 3 = Feb20 Algo, 4 = Feb19 OS
    // 5 = Feb19 DS, 6 = Feb18 WD, 7 = Feb18 DB, 8 = Feb17 OS, 9 = Feb17 Algo
    // 10 = Feb14 DS, 11 = Feb14 WD, 12 = Feb13 DB, 13 = Feb13 OS, 14 = Feb12 Algo
    // 15 = Feb12 DS, 16 = Feb11 WD, 17 = Feb11 DB, 18 = Feb10 OS, 19 = Feb10 Algo

    const attendance = [
      [insertedIds[0],  2, 'present', '2026-02-21 10:05:00'],  // today DS - present
      [insertedIds[2],  2, 'present', '2026-02-20 10:04:00'],  // Feb20 DB
      [insertedIds[3],  2, 'late',    '2026-02-20 14:10:00'],  // Feb20 Algo - late
      [insertedIds[4],  2, 'present', '2026-02-19 10:02:00'],  // Feb19 OS
      [insertedIds[5],  2, 'present', '2026-02-19 13:03:00'],  // Feb19 DS
      [insertedIds[6],  2, 'absent',  '2026-02-18 09:00:00'],  // Feb18 WD - absent
      [insertedIds[7],  2, 'present', '2026-02-18 14:05:00'],  // Feb18 DB
      [insertedIds[8],  2, 'present', '2026-02-17 10:03:00'],  // Feb17 OS
      [insertedIds[9],  2, 'present', '2026-02-17 13:04:00'],  // Feb17 Algo
      [insertedIds[10], 2, 'present', '2026-02-14 10:02:00'],  // Feb14 DS
      [insertedIds[11], 2, 'late',    '2026-02-14 13:12:00'],  // Feb14 WD - late
      [insertedIds[12], 2, 'present', '2026-02-13 10:01:00'],  // Feb13 DB
      [insertedIds[13], 2, 'absent',  '2026-02-13 14:00:00'],  // Feb13 OS - absent
      [insertedIds[14], 2, 'present', '2026-02-12 09:03:00'],  // Feb12 Algo
      [insertedIds[15], 2, 'present', '2026-02-12 13:02:00'],  // Feb12 DS
      [insertedIds[16], 2, 'present', '2026-02-11 10:04:00'],  // Feb11 WD
      [insertedIds[17], 2, 'present', '2026-02-11 14:06:00'],  // Feb11 DB
      [insertedIds[18], 2, 'present', '2026-02-10 09:02:00'],  // Feb10 OS
      [insertedIds[19], 2, 'present', '2026-02-10 13:01:00'],  // Feb10 Algo
    ];

    for (const a of attendance) {
      await pool.execute(
        'INSERT INTO attendance (session_id, student_id, status, marked_at) VALUES (?, ?, ?, ?)',
        a
      );
    }
    console.log('Attendance inserted:', attendance.length, 'records');

    // QR Requests for the sessions
    const qrReqs = [
      [insertedIds[0],  '2026-02-21 11:00:00', 'expired', 1],
      [insertedIds[1],  '2026-02-21 15:00:00', 'active',  0],
      [insertedIds[2],  '2026-02-20 10:30:00', 'expired', 1],
      [insertedIds[4],  '2026-02-19 10:30:00', 'expired', 1],
      [insertedIds[10], '2026-02-14 10:30:00', 'expired', 1],
    ];
    for (const q of qrReqs) {
      const uuid = crypto.randomUUID();
      await pool.execute(
        'INSERT INTO attendance_request (request_id, faculty_id, session_id, attendance_value, latitude, longitude, radius_meters, expires_at, status, accepted_count) VALUES (?, 3, ?, 1, 28.6139, 77.2090, 50, ?, ?, ?)',
        [uuid, q[0], q[1], q[2], q[3]]
      );
    }
    console.log('QR requests inserted: 5');

    const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM attendance WHERE student_id = 2');
    console.log('Total attendance records for student 2:', total);

    await pool.end();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

run();
