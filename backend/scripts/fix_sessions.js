(async () => {
  try {
    const { pool } = require('../src/config');

    const [sessions] = await pool.query(`SELECT id, subject FROM sessions WHERE course_id IS NULL OR course_id = 0`);
    console.log(`Found ${sessions.length} sessions missing course_id`);

    for (const s of sessions) {
      const subj = s.subject || '';
      // Try to extract code inside parentheses e.g., (DCO401)
      const m = subj.match(/\(([^)]+)\)/);
      let code = m ? m[1].trim() : null;
      let course = null;
      if (code) {
        const [rows] = await pool.query(`SELECT id, department_id FROM courses WHERE code = ? LIMIT 1`, [code]);
        if (rows && rows.length > 0) course = rows[0];
      }
      if (!course) {
        // Try match by words in subject
        const token = subj.split('(')[0].trim();
        if (token) {
          const [rows] = await pool.query(`SELECT id, department_id FROM courses WHERE name LIKE ? LIMIT 1`, [`%${token}%`]);
          if (rows && rows.length > 0) course = rows[0];
        }
      }

      if (course) {
        try {
          await pool.query(`UPDATE sessions SET course_id = ?, department_id = ? WHERE id = ?`, [course.id, course.department_id, s.id]);
          console.log(`Updated session ${s.id} -> course ${course.id}`);
        } catch (updErr) {
          console.error(`Failed update session ${s.id}:`, updErr.message);
        }
      } else {
        console.log(`No course match for session ${s.id} ('${subj}')`);
      }
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();