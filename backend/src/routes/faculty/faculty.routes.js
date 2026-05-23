const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const { moduleFaultBoundary } = require('../../middleware/fault-isolation.middleware');
const { pool } = require('../../config');
const fs = require('fs');
const path = require('path');

const seedCoursesPath = path.join(__dirname, '../../../../database/seed_courses.sql');

const FALLBACK_DEPARTMENTS = {
  1: { department_name: 'Computer Engineering', department_code: 'CE' },
  4: { department_name: 'Civil Engineering', department_code: 'CV' }
};

let fallbackCourseCatalog = null;

const loadFallbackCourseCatalog = () => {
  if (fallbackCourseCatalog) return fallbackCourseCatalog;

  if (!fs.existsSync(seedCoursesPath)) {
    fallbackCourseCatalog = [];
    return fallbackCourseCatalog;
  }

  const sql = fs.readFileSync(seedCoursesPath, 'utf8');
  const catalog = [];
  const insertBlocks = sql.match(/INSERT\s+(?:IGNORE\s+)?INTO\s+courses[\s\S]*?;/gi) || [];

  insertBlocks.forEach((block) => {
    const valuesMatch = block.match(/VALUES\s*([\s\S]*?);/i);
    if (!valuesMatch) return;

    const tuples = valuesMatch[1].match(/\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g) || [];

    tuples.forEach((tuple, index) => {
      const parts = tuple.match(/\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (!parts) return;

      const name = parts[1];
      const code = parts[2];
      const semester = Number(parts[3]);
      const departmentId = Number(parts[4]);
      const departmentMeta = FALLBACK_DEPARTMENTS[departmentId] || {
        department_name: `Department ${departmentId}`,
        department_code: `D${departmentId}`
      };

      catalog.push({
        id: -(catalog.length + 1),
        name,
        code,
        semester,
        department_id: departmentId,
        department_name: departmentMeta.department_name,
        department_code: departmentMeta.department_code,
        is_fallback: true
      });
    });
  });

  fallbackCourseCatalog = catalog;
  return fallbackCourseCatalog;
};

/**
 * GET /api/faculty/my-courses
 * Returns all courses assigned to the logged-in faculty member
 * Each course includes department details
 */
router.get('/my-courses', authMiddleware, async (req, res) => {
  try {
    const facultyId = req.user.id;
    // Get department name of the logged-in faculty (users table has 'department' as varchar)
    const [facultyRows] = await pool.query(
      `SELECT department FROM users WHERE id = ? AND role = 'faculty'`,
      [facultyId]
    );
    if (!facultyRows || facultyRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Faculty not found or department not set.' });
    }
    const departmentName = facultyRows[0].department;
    
    // Lookup department_id from departments table using department name
    let departmentId = null;
    if (departmentName) {
      const [deptRows] = await pool.query(
        `SELECT id FROM departments WHERE name = ?`,
        [departmentName]
      );
      if (deptRows && deptRows.length > 0) {
        departmentId = deptRows[0].id;
      }
    }
    
    // Get all courses from this department OR assigned directly to this faculty.
    // Fallbacks:
    //  - If department_id lookup succeeded, use it.
    //  - If department_id not found but department name exists, try fuzzy match on department name.
    //  - Otherwise return courses assigned to the faculty only.
    let coursesQuery;
    let params = [];
    // If the faculty belongs to a Computer-type department, return all
    // Computer department courses (semesters 1-6) plus Diploma department
    // courses so CS teachers can create sessions across semesters.
    const userEmail = req.user && req.user.email ? req.user.email.toLowerCase() : '';
    const isComputerDept = departmentName && /computer/i.test(departmentName);
    if (isComputerDept) {
      coursesQuery = `SELECT 
          c.id,
          c.name,
          c.code,
          c.semester,
          c.department_id,
          d.name AS department_name,
          d.code AS department_code
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE (d.name LIKE '%Computer%' OR d.name LIKE '%Diploma%') OR c.faculty_id = ?
       ORDER BY c.semester, d.name, c.name`;
      params = [facultyId];
    } else if (departmentId) {
      // Include courses that belong to the faculty's department,
      // courses explicitly assigned to the faculty, and also courses
      // from departments whose name contains 'Diploma' so diploma
      // subjects are available to related faculty.
      coursesQuery = `SELECT 
          c.id,
          c.name,
          c.code,
          c.semester,
          c.department_id,
          d.name AS department_name,
          d.code AS department_code
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE (c.department_id = ? OR (d.name LIKE '%Diploma%')) OR c.faculty_id = ?
       ORDER BY c.semester, d.name, c.name`;
      params = [departmentId, facultyId];
    } else if (departmentName) {
      // Fallback: try fuzzy matching on department name, also include Diploma depts
      coursesQuery = `SELECT 
          c.id,
          c.name,
          c.code,
          c.semester,
          c.department_id,
          d.name AS department_name,
          d.code AS department_code
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE (d.name LIKE ? OR d.name LIKE '%Diploma%') OR c.faculty_id = ?
       ORDER BY c.semester, d.name, c.name`;
      params = [`%${departmentName}%`, facultyId];
    } else {
      // As a last resort, return courses explicitly assigned to this faculty
      // plus any diploma department courses so faculty can pick diploma subjects
      coursesQuery = `SELECT 
          c.id,
          c.name,
          c.code,
          c.semester,
          c.department_id,
          d.name AS department_name,
          d.code AS department_code
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.faculty_id = ? OR d.name LIKE '%Diploma%'
       ORDER BY c.semester, d.name, c.name`;
      params = [facultyId];
    }
    let [courses] = await pool.query(coursesQuery, params);

    const fallbackCatalog = loadFallbackCourseCatalog();
    if (fallbackCatalog.length > 0) {
      const courseMap = new Map();
      for (const course of courses || []) {
        courseMap.set(String(course.code).toUpperCase(), course);
      }

      for (const fallbackCourse of fallbackCatalog) {
        if (!courseMap.has(String(fallbackCourse.code).toUpperCase())) {
          courseMap.set(String(fallbackCourse.code).toUpperCase(), fallbackCourse);
        }
      }

      courses = Array.from(courseMap.values()).sort((a, b) => {
        const semesterA = a.semester || 0;
        const semesterB = b.semester || 0;
        if (semesterA !== semesterB) return semesterA - semesterB;
        const departmentA = (a.department_name || '').localeCompare(b.department_name || '');
        if (departmentA !== 0) return departmentA;
        return (a.name || '').localeCompare(b.name || '');
      });
    }

    return res.status(200).json({
      success: true,
      data: courses,
      message: `${courses.length} courses found.`
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

/**
 * GET /api/faculty/suspicious-activity
 * Faculty ke sessions se related suspicious activities return karta hai:
 *  1. Unauthorized / duplicate attendance attempts (4xx on /mark)
 *  2. Failed QR generate/validate attempts
 *  3. Failed login attempts (brute-force indicator)
 *  4. Duplicate attendance (student same session mein baar baar try kare)
 */
router.get('/suspicious-activity', authMiddleware, async (req, res) => {
  try {
    const facultyId = req.user.id;
    const limit = parseInt(req.query.limit) || 100;

    // 1. Faculty ke sessions ka attendance mark attempts with 4xx/5xx
    const [attendanceAlerts] = await pool.query(
      `SELECT 
          al.id,
          al.user_id,
          al.user_role,
          al.action,
          al.status_code,
          al.ip_address,
          al.path,
          al.method,
          al.created_at,
          al.metadata,
          u.name  AS student_name,
          u.email AS student_email,
          CASE
            WHEN al.status_code = 409 THEN 'duplicate_attendance'
            WHEN al.status_code = 403 THEN 'unauthorized_attempt'
            WHEN al.status_code = 400 THEN 'invalid_qr'
            WHEN al.status_code >= 500 THEN 'system_error'
            ELSE 'suspicious'
          END AS alert_type
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.status_code >= 400
         AND (
           al.path LIKE '%/mark%' OR
           al.path LIKE '%/validate%' OR
           al.path LIKE '%/generate%' OR
           al.path LIKE '%/qr%' OR
           al.action IN ('AUTH_LOGIN','AUTH_FAILED')
         )
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [limit]
    );

    // 2. Students who marked attendance multiple times in same session (duplicates in DB)
    const [duplicates] = await pool.query(
      `SELECT 
          a.student_id,
          u.name  AS student_name,
          u.email AS student_email,
          a.session_id,
          s.subject,
          COUNT(*) AS attempt_count,
          MIN(a.marked_at) AS first_attempt,
          MAX(a.marked_at) AS last_attempt,
          'duplicate_attendance' AS alert_type
       FROM attendance a
       JOIN sessions s ON a.session_id = s.id
       JOIN users u ON a.student_id = u.id
       WHERE s.faculty_id = ?
       GROUP BY a.student_id, a.session_id
       HAVING attempt_count > 1
       ORDER BY attempt_count DESC
       LIMIT 50`,
      [facultyId]
    );

    // 3. Failed login attempts (AUTH_LOGIN with 400/401)
    const [loginFails] = await pool.query(
      `SELECT 
          al.id,
          al.user_id,
          al.ip_address,
          al.created_at,
          al.status_code,
          al.action,
          al.metadata,
          u.name  AS student_name,
          u.email AS student_email,
          'failed_login' AS alert_type
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.action IN ('AUTH_LOGIN','POST /login')
         AND al.status_code IN (400, 401, 403)
       ORDER BY al.created_at DESC
       LIMIT 30`
    );

    // Merge and format
    const formatted = [
      ...attendanceAlerts.map(a => ({
        id: `log-${a.id}`,
        type: a.alert_type,
        action: a.action,
        statusCode: a.status_code,
        ipAddress: a.ip_address,
        path: a.path,
        studentName: a.student_name || 'Unknown',
        studentEmail: a.student_email || null,
        userId: a.user_id,
        userRole: a.user_role,
        metadata: a.metadata,
        createdAt: a.created_at,
        source: 'activity_log'
      })),
      ...duplicates.map(d => ({
        id: `dup-${d.student_id}-${d.session_id}`,
        type: 'duplicate_attendance',
        action: `${d.attempt_count}x attendance attempts`,
        subject: d.subject,
        sessionId: d.session_id,
        studentName: d.student_name || 'Unknown',
        studentEmail: d.student_email || null,
        userId: d.student_id,
        attemptCount: d.attempt_count,
        firstAttempt: d.first_attempt,
        lastAttempt: d.last_attempt,
        createdAt: d.last_attempt,
        source: 'attendance_table'
      })),
      ...loginFails.map(l => ({
        id: `login-${l.id}`,
        type: 'failed_login',
        action: 'Failed Login Attempt',
        statusCode: l.status_code,
        ipAddress: l.ip_address,
        studentName: l.student_name || 'Unknown IP',
        studentEmail: l.student_email || null,
        userId: l.user_id,
        metadata: l.metadata,
        createdAt: l.created_at,
        source: 'activity_log'
      }))
    ];

    // Sort by date desc
    formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      data: formatted.slice(0, limit),
      total: formatted.length,
      message: `${formatted.length} suspicious activities found`
    });
  } catch (error) {
    console.error('Error fetching suspicious activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch suspicious activities',
      error: error.message
    });
  }
});

// HFR8: Faculty module ka fault boundary
router.use(moduleFaultBoundary('Faculty Service'));

module.exports = router;
