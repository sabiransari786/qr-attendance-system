const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const { moduleFaultBoundary } = require('../../middleware/fault-isolation.middleware');
const { pool } = require('../../config');

/**
 * GET /api/faculty/my-courses
 * Returns all courses assigned to the logged-in faculty member
 * Each course includes department details
 */
router.get('/my-courses', authMiddleware, async (req, res) => {
  try {
    const facultyId = req.user.id;

    const [courses] = await pool.query(
      `SELECT 
          c.id,
          c.name,
          c.code,
          c.department_id,
          d.name AS department_name,
          d.code AS department_code
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.faculty_id = ?
       ORDER BY d.name, c.name`,
      [facultyId]
    );

    return res.status(200).json({
      success: true,
      data: courses,
      message: `${courses.length} courses found`
    });
  } catch (error) {
    console.error('Error fetching faculty courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
});

// HFR8: Faculty module ka fault boundary
router.use(moduleFaultBoundary('Faculty Service'));

module.exports = router;
