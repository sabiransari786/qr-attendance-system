const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/auth.middleware');
const { pool } = require('../../config');

// POST /api/admin/import-diploma-courses
// Inserts the provided Diploma-in-Computer-Engineering course list into `courses` table if missing
router.post('/import-diploma-courses', authMiddleware, requireAdmin, async (req, res) => {
  try {
    // Find Computer Engineering department id
    const [deptRows] = await pool.query(`SELECT id FROM departments WHERE name LIKE ? LIMIT 1`, ['%Computer Engineering%']);
    if (!deptRows || deptRows.length === 0) return res.status(400).json({ success: false, message: 'Computer Engineering department not found' });
    const deptId = deptRows[0].id;

    const courses = [
      // Semester 1
      ['Communication Skill-I', 'DCOS101', 1],
      ['Applied Maths-I', 'DCOM102', 1],
      ['Electrical and Electronics Engineering', 'DEE103', 1],
      ['Elements of Mechanical Engineering', 'DME104', 1],
      ['Fundamental of Computers', 'DCO105', 1],
      ['Electrical and Electronics Engineering Lab', 'DEE113', 1],
      ['Workshop Practice', 'DME116', 1],
      ['Engineering Drawing', 'DME117', 1],
      ['P.C. Software Lab', 'DCO115', 1],
      // Semester 2
      ['Applied Maths-II', 'DCOM201', 2],
      ['Applied Physics', 'DCOP202', 2],
      ['Electronics Devices and Application', 'DEL203', 2],
      ['Engineering Chemistry & Environmental Science', 'DCOC204', 2],
      ['Programming in C', 'DCO205', 2],
      ['Applied Physics Lab', 'DCOP212', 2],
      ['Electronics Devices and Application Lab', 'DEL213', 2],
      ['Engineering Chemistry Lab', 'DCOC214', 2],
      ['Programming in C Lab', 'DCO215', 2],
      // Semester 3
      ['Computer Oriented Numerical Methods', 'DCO301', 3],
      ['Object Oriented Programming', 'DCO302', 3],
      ['Signals & Systems', 'DEE303', 3],
      ['Computer Architecture', 'DCO304', 3],
      ['Digital Electronics', 'DEL306', 3],
      ['Object Oriented Programming Lab', 'DCO312', 3],
      ['Computer Workshop', 'DCO314', 3],
      ['Computer System & Maintenance', 'DCO315', 3],
      ['Digital Electronics Lab', 'DEL316', 3],
      // Semester 4
      ['Communication Skills-II', 'DCOS401', 4],
      ['Database Management System', 'DCO402', 4],
      ['Operating System', 'DCO403', 4],
      ['Data Structures', 'DCO404', 4],
      ['Microprocessor & Microcontroller', 'DEL405', 4],
      ['Database Management System Lab', 'DCO412', 4],
      ['Operating System Lab', 'DCO413', 4],
      ['Data Structures Lab', 'DCO414', 4],
      ['Microprocessor Programming Lab', 'DEL415', 4],
      // Semester 5
      ['Computer Graphics', 'DCO501', 5],
      ['Web Technology', 'DCO502', 5],
      ['Data Communication & Computer Networks', 'DCO503', 5],
      ['Software Engineering', 'DCO504', 5],
      ['Java Programming', 'DCO505', 5],
      ['Computer Graphics & Multimedia Lab', 'DCO511', 5],
      ['Web Technology Lab', 'DCO512', 5],
      ['Computer Networks Lab', 'DCO513', 5],
      ['Java Programming Lab', 'DCO515', 5],
      ['Minor Project', 'DCO520', 5],
      // Semester 6
      ['Advanced RDBMS', 'DCO601', 6],
      ['Visual Programming', 'DCO602', 6],
      ['Information Security & Cyber Law', 'DCO603', 6],
      ['Embedded System', 'DCO604', 6],
      ['Artificial Intelligence', 'DCO605', 6],
      ['Mobile Computing', 'DCO606', 6],
      ['ICT Management & Entrepreneurship Development', 'DCO608', 6],
      ['RDBMS Lab', 'DCO611', 6],
      ['Visual Programming Lab', 'DCO612', 6],
      ['Project', 'DCO620', 6],
      ['Industrial Training & Visits', 'DCO630', 6]
    ];

    let inserted = 0;
    for (const [name, code, sem] of courses) {
      const canon = (code || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const [exists] = await pool.query(`SELECT id FROM courses WHERE code = ? LIMIT 1`, [canon]);
      if (exists && exists.length > 0) continue;
      await pool.query(`INSERT INTO courses (name, code, semester, department_id) VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name)`, [name, canon, sem, deptId]);
      inserted++;
    }

    return res.status(200).json({ success: true, message: `Imported diploma courses. Inserted: ${inserted}` });
  } catch (error) {
    console.error('Import diploma courses error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/fix-sessions
// Matches sessions with course codes in subject or matches by name, updates course_id and department_id, and fills missing subject
router.post('/fix-sessions', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [sessions] = await pool.query(`SELECT id, subject FROM sessions`);
    let updated = 0;
    for (const s of sessions) {
      const subj = s.subject || '';
      let codeMatch = null;
      const m = subj.match(/\(([^)]+)\)/);
      if (m) codeMatch = m[1].replace(/[^A-Za-z0-9]/g, '').toUpperCase();

      let course = null;
      if (codeMatch) {
        const [rows] = await pool.query(`SELECT id, department_id, name FROM courses WHERE code = ? LIMIT 1`, [codeMatch]);
        if (rows && rows.length > 0) course = rows[0];
      }

      if (!course && subj) {
        const token = subj.split('(')[0].trim();
        if (token) {
          const [rows] = await pool.query(`SELECT id, department_id, name FROM courses WHERE name LIKE ? LIMIT 1`, [`%${token}%`]);
          if (rows && rows.length > 0) course = rows[0];
        }
      }

      if (course) {
        const updates = [];
        const params = [];
        updates.push('course_id = ?'); params.push(course.id);
        updates.push('department_id = ?'); params.push(course.department_id);
        if (!subj || subj.trim() === '') {
          updates.push('subject = ?'); params.push(course.name);
        }
        params.push(s.id);
        await pool.query(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`, params);
        updated++;
      }
    }

    return res.status(200).json({ success: true, message: `Fix completed. Sessions updated: ${updated}` });
  } catch (error) {
    console.error('Fix sessions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

// POST /api/admin/set-course-semesters
// Sets semester numbers for known Diploma course codes (idempotent)
router.post('/set-course-semesters', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const mapping = {
      'DCOS101':1,'DCOM102':1,'DEE103':1,'DME104':1,'DCO105':1,'DEE113':1,'DME116':1,'DME117':1,'DCO115':1,
      'DCOM201':2,'DCOP202':2,'DEL203':2,'DCOC204':2,'DCO205':2,'DCOP212':2,'DEL213':2,'DCOC214':2,'DCO215':2,
      'DCO301':3,'DCO302':3,'DEE303':3,'DCO304':3,'DEL306':3,'DCO312':3,'DCO314':3,'DCO315':3,'DEL316':3,
      'DCOS401':4,'DCO402':4,'DCO403':4,'DCO404':4,'DEL405':4,'DCO412':4,'DCO413':4,'DCO414':4,'DEL415':4,
      'DCO501':5,'DCO502':5,'DCO503':5,'DCO504':5,'DCO505':5,'DCO511':5,'DCO512':5,'DCO513':5,'DCO515':5,'DCO520':5,
      'DCO601':6,'DCO602':6,'DCO603':6,'DCO604':6,'DCO605':6,'DCO606':6,'DCO608':6,'DCO611':6,'DCO612':6,'DCO620':6,'DCO630':6
    };

    let updated = 0;
    for (const [code, sem] of Object.entries(mapping)) {
      const [r] = await pool.query(`UPDATE courses SET semester = ? WHERE UPPER(REPLACE(code, '-', '')) = ? AND (semester IS NULL OR semester = 0)`, [sem, code]);
      if (r && r.affectedRows) updated += r.affectedRows;
    }
    const [remaining] = await pool.query(`SELECT COUNT(*) AS cnt FROM courses WHERE semester IS NULL OR semester = 0`);
    return res.status(200).json({ success: true, updated, remaining: remaining[0].cnt });
  } catch (error) {
    console.error('set-course-semesters error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/import-diploma-sessions
// Create future sessions for Computer Engineering faculty for each Diploma course (idempotent)
router.post('/import-diploma-sessions', authMiddleware, requireAdmin, async (req, res) => {
  try {
    // Find Computer Engineering department id
    const [deptRows] = await pool.query(`SELECT id FROM departments WHERE name LIKE ? LIMIT 1`, ['%Computer Engineering%']);
    if (!deptRows || deptRows.length === 0) return res.status(400).json({ success: false, message: 'Computer Engineering department not found' });
    const deptId = deptRows[0].id;

    // Find faculty in this department (prefer demo teacher if available)
    const [facRows] = await pool.query(`SELECT id FROM users WHERE role = 'faculty' AND (department = ? OR LOWER(department) LIKE ?)`, ['Computer Engineering', '%computer%']);
    let facultyIds = (facRows || []).map(r => r.id);
    if (!facultyIds || facultyIds.length === 0) {
      const [demo] = await pool.query(`SELECT id FROM users WHERE LOWER(email) = 'teacher@demo.com' LIMIT 1`);
      if (demo && demo.length > 0) facultyIds = [demo[0].id];
    }
    if (!facultyIds || facultyIds.length === 0) return res.status(400).json({ success: false, message: 'No faculty found to assign sessions' });

    // Diploma course codes (canonical)
    const codes = ['DCOS101','DCOM102','DEE103','DME104','DCO105','DEE113','DME116','DME117','DCO115','DCOM201','DCOP202','DEL203','DCOC204','DCO205','DCOP212','DEL213','DCOC214','DCO215','DCO301','DCO302','DEE303','DCO304','DEL306','DCO312','DCO314','DCO315','DEL316','DCOS401','DCO402','DCO403','DCO404','DEL405','DCO412','DCO413','DCO414','DEL415','DCO501','DCO502','DCO503','DCO504','DCO505','DCO511','DCO512','DCO513','DCO515','DCO520','DCO601','DCO602','DCO603','DCO604','DCO605','DCO606','DCO608','DCO611','DCO612','DCO620','DCO630'];

    let created = 0;
    // Assign sessions round-robin to available faculty
    let idx = 0;
    for (const code of codes) {
      // find course id
      const [cRows] = await pool.query(`SELECT id, name FROM courses WHERE UPPER(REPLACE(code, '-', '')) = ? LIMIT 1`, [code]);
      if (!cRows || cRows.length === 0) continue;
      const course = cRows[0];

      const facultyId = facultyIds[idx % facultyIds.length];
      idx++;

      // Skip if a near-future session already exists for this course and faculty
      const [exist] = await pool.query(`SELECT id FROM sessions WHERE course_id = ? AND faculty_id = ? AND DATE(start_time) >= CURDATE() LIMIT 1`, [course.id, facultyId]);
      if (exist && exist.length > 0) continue;

      // Create a session scheduled on successive days at 10:00 for clarity
      const dayOffset = idx; // 1..n
      await pool.query(`INSERT INTO sessions (faculty_id, course_id, department_id, subject, location, start_time, end_time, status)
        VALUES (?, ?, ?, ?, ?, DATE_ADD(DATE(CONCAT(CURDATE(), ' 10:00:00')), INTERVAL ? DAY), DATE_ADD(DATE(CONCAT(CURDATE(), ' 11:00:00')), INTERVAL ? DAY), 'active')`, [facultyId, course.id, deptId, `${course.name} (${code})`, 'Room 101', dayOffset, dayOffset]);
      created++;
    }

    return res.status(200).json({ success: true, message: `Imported diploma sessions. Created: ${created}` });
  } catch (error) {
    console.error('Import diploma sessions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
