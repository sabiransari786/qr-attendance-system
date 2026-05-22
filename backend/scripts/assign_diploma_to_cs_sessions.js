(async () => {
  try {
    const { pool } = require('../src/config');

    // Find Computer Engineering department id (match name)
    const [drows] = await pool.query(`SELECT id FROM departments WHERE name LIKE ? LIMIT 1`, ['%Computer%Engineering%']);
    if (!drows || drows.length === 0) {
      console.error('Computer Engineering department not found');
      process.exit(1);
    }
    const deptId = drows[0].id;

    // Get diploma courses for this department
    const [courses] = await pool.query(`SELECT id FROM courses WHERE department_id = ? ORDER BY id`, [deptId]);
    if (!courses || courses.length === 0) {
      console.error('No courses found for Computer Engineering');
      process.exit(1);
    }

    // Find sessions missing course_id where faculty's department is Computer Engineering OR session.department_id is null
    const [sessions] = await pool.query(`
      SELECT s.id, s.subject, u.department as faculty_department, s.department_id
      FROM sessions s
      JOIN users u ON u.id = s.faculty_id
      WHERE (s.course_id IS NULL OR s.course_id = 0)
        AND (LOWER(u.department) LIKE ? OR s.department_id IS NULL)
    `, ['%computer%engineering%']);

    console.log(`Found ${sessions.length} sessions to assign`);
    let idx = 0;
    for (const s of sessions) {
      const courseId = courses[idx % courses.length].id;
      await pool.query(`UPDATE sessions SET course_id = ?, department_id = ? WHERE id = ?`, [courseId, deptId, s.id]);
      console.log(`Assigned session ${s.id} -> course ${courseId}`);
      idx++;
    }

    console.log('Assignment complete');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
