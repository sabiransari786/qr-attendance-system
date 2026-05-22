#!/usr/bin/env node
(async () => {
  try {
    const { pool } = require('../src/config');

    const courses = [
      // Semester 1
      { name: 'Communication Skills – I', code: 'DCOS101', semester: 1, department_id: 1 },
      { name: 'Applied Mathematics – I', code: 'DCOM102', semester: 1, department_id: 1 },
      { name: 'Electrical & Electronics Engineering', code: 'DEE103', semester: 1, department_id: 1 },
      { name: 'Elements of Mechanical Engineering', code: 'DME104', semester: 1, department_id: 1 },
      { name: 'Fundamentals of Computers', code: 'DCO105', semester: 1, department_id: 1 },
      { name: 'Electrical & Electronics Engineering Lab', code: 'DEE113', semester: 1, department_id: 1 },
      { name: 'Workshop Practice', code: 'DME116', semester: 1, department_id: 1 },
      { name: 'Engineering Drawing – I', code: 'DME117', semester: 1, department_id: 1 },
      { name: 'P.C. Software Lab', code: 'DCO115', semester: 1, department_id: 1 },

      // Semester 2
      { name: 'Applied Mathematics – II', code: 'DCOM201', semester: 2, department_id: 1 },
      { name: 'Applied Physics', code: 'DCOP202', semester: 2, department_id: 1 },
      { name: 'Electronics Devices & Applications', code: 'DEL203', semester: 2, department_id: 1 },
      { name: 'Engineering Chemistry & Environmental Science', code: 'DCOC204', semester: 2, department_id: 1 },
      { name: 'Programming in C', code: 'DCO205', semester: 2, department_id: 1 },
      { name: 'Applied Physics Lab', code: 'DCOP212', semester: 2, department_id: 1 },
      { name: 'Electronics Devices & Applications Lab', code: 'DEL213', semester: 2, department_id: 1 },
      { name: 'Engineering Chemistry Lab', code: 'DCOC214', semester: 2, department_id: 1 },
      { name: 'Programming in C Lab', code: 'DCO215', semester: 2, department_id: 1 },

      // Semester 3
      { name: 'Computer Oriented Numerical Methods', code: 'DCO301', semester: 3, department_id: 1 },
      { name: 'Object Oriented Programming', code: 'DCO302', semester: 3, department_id: 1 },
      { name: 'Signals & Systems', code: 'DEE303', semester: 3, department_id: 1 },
      { name: 'Computer Architecture', code: 'DCO304', semester: 3, department_id: 1 },
      { name: 'Digital Electronics', code: 'DEL306', semester: 3, department_id: 1 },
      { name: 'Object Oriented Programming Lab', code: 'DCO312', semester: 3, department_id: 1 },
      { name: 'Computer Workshop Lab', code: 'DCO314', semester: 3, department_id: 1 },
      { name: 'Computer System & Maintenance Lab', code: 'DCO315', semester: 3, department_id: 1 },
      { name: 'Digital Electronics Lab', code: 'DEL316', semester: 3, department_id: 1 },

      // Semester 4
      { name: 'Communication Skills – II', code: 'DCOS401', semester: 4, department_id: 1 },
      { name: 'Database Management System', code: 'DCO402', semester: 4, department_id: 1 },
      { name: 'Operating System', code: 'DCO403', semester: 4, department_id: 1 },
      { name: 'Data Structures', code: 'DCO404', semester: 4, department_id: 1 },
      { name: 'Microprocessor & Microcontroller', code: 'DEL405', semester: 4, department_id: 1 },
      { name: 'Database Management System Lab', code: 'DCO412', semester: 4, department_id: 1 },
      { name: 'Operating System Lab', code: 'DCO413', semester: 4, department_id: 1 },
      { name: 'Data Structures Lab', code: 'DCO414', semester: 4, department_id: 1 },
      { name: 'Microprocessor Programming Lab', code: 'DEL415', semester: 4, department_id: 1 },

      // Semester 5
      { name: 'Computer Graphics', code: 'DCO501', semester: 5, department_id: 1 },
      { name: 'Web Technology', code: 'DCO502', semester: 5, department_id: 1 },
      { name: 'Data Communication & Computer Networks', code: 'DCO503', semester: 5, department_id: 1 },
      { name: 'Software Engineering', code: 'DCO504', semester: 5, department_id: 1 },
      { name: 'Java Programming', code: 'DCO505', semester: 5, department_id: 1 },
      { name: 'Computer Graphics & Multimedia Lab', code: 'DCO511', semester: 5, department_id: 1 },
      { name: 'Web Technology Lab', code: 'DCO512', semester: 5, department_id: 1 },
      { name: 'Computer Networks Lab', code: 'DCO513', semester: 5, department_id: 1 },
      { name: 'Java Programming Lab', code: 'DCO515', semester: 5, department_id: 1 },
      { name: 'Minor Project', code: 'DCO520', semester: 5, department_id: 1 },

      // Semester 6
      { name: 'Advanced RDBMS', code: 'DCO601', semester: 6, department_id: 1 },
      { name: 'Visual Programming', code: 'DCO602', semester: 6, department_id: 1 },
      { name: 'Information Security & Cyber Law', code: 'DCO603', semester: 6, department_id: 1 },
      { name: 'Embedded System (Elective)', code: 'DCO604', semester: 6, department_id: 1 },
      { name: 'Artificial Intelligence (Elective)', code: 'DCO605', semester: 6, department_id: 1 },
      { name: 'Mobile Computing (Elective)', code: 'DCO606', semester: 6, department_id: 1 },
      { name: 'ICT Management & Entrepreneurship Development', code: 'DCO608', semester: 6, department_id: 1 },
      { name: 'RDBMS Lab', code: 'DCO611', semester: 6, department_id: 1 },
      { name: 'Visual Programming Lab', code: 'DCO612', semester: 6, department_id: 1 },
      { name: 'Project', code: 'DCO620', semester: 6, department_id: 1 },
      { name: 'Industrial Training & Visits', code: 'DCO630', semester: 6, department_id: 1 }
    ];

    let inserted = 0;
    for (const c of courses) {
      const norm = c.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const [rows] = await pool.query(`SELECT id FROM courses WHERE UPPER(REPLACE(code, '-', '')) = ? LIMIT 1`, [norm]);
      if (!rows || rows.length === 0) {
        const [res] = await pool.query(`INSERT INTO courses (name, code, semester, department_id) VALUES (?, ?, ?, ?)`, [c.name, c.code, c.semester, c.department_id]);
        if (res && res.affectedRows === 1) { inserted += 1; console.log(`Inserted ${c.code} - ${c.name}`); }
      } else {
        const existingId = rows[0].id;
        await pool.query(`UPDATE courses SET name = ?, semester = ?, department_id = ? WHERE id = ?`, [c.name, c.semester, c.department_id, existingId]);
      }
    }

    console.log(`Done. Inserted: ${inserted}.`);
    process.exit(0);
  } catch (err) {
    console.error('Error inserting diploma courses:', err.message || err);
    process.exit(1);
  }
})();
