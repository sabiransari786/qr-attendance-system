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
