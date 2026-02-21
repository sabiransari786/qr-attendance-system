/**
 * Attendance Routes File (attendance.js)
 * 
 * Ye file attendance-related routes define karti hai
 * QR-based attendance system ke liye endpoints handle karta hai
 * Yahan sirf route definitions hain - business logic controllers mein hogi
 */

// ============================================================================
// EXPRESS ROUTER IMPORT
// ============================================================================

// Express library import kar rahe hain - Router functionality ke liye
// Express framework HTTP requests handle karne ke liye use hota hai
const express = require('express');

// express.Router() se router instance create kar rahe hain
// Router kya hai? - Ye mini Express app hota hai jo routes manage karta hai
// Router use kyun karte hain app instance directly use karne ki jagah?
// 1. Modularity: Har feature ka apna router - code organize rehta hai
// 2. Scalability: Multiple routers alag-alag files mein - maintain karna easy
// 3. Reusability: Router ko easily mount/unmount kar sakte hain
// 4. Clean Code: app.js clean rehta hai - sab routes alag files mein
// 5. Testing: Router ko individually test kar sakte hain
const router = express.Router();

// ============================================================================
// ATTENDANCE CONTROLLER IMPORT
// ============================================================================

// Attendance controller import kar rahe hain
// Controllers request/response handle karte hain - business logic services mein hoti hai
// Controller functions: markAttendance, getAttendanceBySession, getAttendanceByStudent, getAttendanceReport
// Path: '../../controllers/attendance.controller' - routes/attendance folder se controllers folder
const {
  markAttendance,
  getAttendanceBySession,
  getAttendanceByStudent,
  getAttendanceReport
} = require('../../controllers/attendance.controller');

const authMiddleware = require('../../middleware/auth.middleware');
const { requireStudent, requireFaculty } = require('../../middleware/auth.middleware');
const { attendanceMarkLimiter } = require('../../middleware/rate-limit.middleware');

// ============================================================================
// ATTENDANCE ROUTES KYA HAIN? (What are Attendance Routes?)
// ============================================================================

/**
 * Attendance Routes Kya Hain?
 * - Attendance routes = URL endpoints jo attendance-related operations handle karte hain
 * - QR scan, attendance view, reports generate karne ke liye endpoints
 * - Har route = URL pattern + HTTP method (GET, POST, PUT, DELETE) + handler function
 * 
 * QR Scan Request Kaise Backend Tak Pahunchta Hai?
 * 
 * Step 1: Student QR Code Scan Karta Hai
 * - Student mobile app se QR code scan karta hai (camera se)
 * - QR code mein sessionId aur expiryTime encrypted/formatted hota hai
 * 
 * Step 2: Frontend Request Bhejta Hai
 * - Frontend QR code data extract karta hai (sessionId, expiryTime, etc.)
 * - POST request bhejta hai backend ko: POST /api/attendance/mark
 * - Request body: { sessionId: "123", qrData: "...", timestamp: "..." }
 * - Headers: { Authorization: "Bearer <student_token>" }
 * 
 * Step 3: Route Request Receive Karta Hai
 * - Router request catch karta hai: router.post('/mark', markAttendance)
 * - Route markAttendance controller function ko call karta hai
 * 
 * Step 4: Controller Request Validate Karta Hai
 * - Controller request body validate karta hai (sessionId present hai ya nahi)
 * - User authentication check karta hai (req.user - middleware se aata hai)
 * - Controller attendanceService.markAttendance() call karta hai
 * 
 * Step 5: Service Business Logic Handle Karta Hai
 * - Service QR code validate karta hai (expiry check, session active check)
 * - Service database query karta hai (session exist karti hai ya nahi)
 * - Service duplicate attendance check karta hai (student already marked ya nahi)
 * - Service attendance record create/update karta hai database mein
 * 
 * Step 6: Database Query Execute Hoti Hai
 * - Database mein attendance record insert/update hota hai
 * - Session validation queries execute hoti hain
 * 
 * Step 7: Response Wapas Jata Hai
 * - Service → Controller → Route → Frontend
 * - Success: { success: true, data: { attendance: {...} } }
 * - Error: { success: false, message: "..." }
 * 
 * Backend Validation Kaise Hota Hai?
 * - Controller: Request validation (required fields, data types)
 * - Service: Business logic validation (QR expiry, session status, duplicate check)
 * - Database: Data integrity validation (constraints, foreign keys)
 * 
 * Routing Layer Kyun Thin Hona Chahiye?
 * - Single Responsibility: Routes ka kaam sirf URL mapping hai, logic nahi
 * - Separation of Concerns: Business logic controllers/services mein honi chahiye
 * - Testability: Thin routes easily test kar sakte hain
 * - Maintainability: Logic change karni ho to controllers/services mein change karo
 * - Reusability: Controllers/services ko alag-alag routes se use kar sakte hain
 * - Clean Architecture: Layer separation - routes, controllers, services alag
 */

// ============================================================================
// ATTENDANCE ROUTES DEFINITION
// ============================================================================

/**
 * POST /mark - Mark Attendance Route (QR Scan)
 * 
 * Request: POST /api/attendance/mark
 * Body: { sessionId: "123", qrData: "encrypted_data", timestamp: "2024-01-01T10:00:00Z" }
 * Headers: { Authorization: "Bearer <student_token>" }
 * 
 * Flow:
 * - Student QR code scan karke request bhejta hai
 * - Route markAttendance controller function ko call karta hai
 * - Controller request validate karke attendanceService.markAttendance() call karta hai
 * - Service QR code validate karta hai (expiry, session status)
 * - Service database mein attendance record create/update karta hai
 * - Controller response return karta hai
 * 
 * Response: { success: true, data: { attendance: { id, sessionId, studentId, status, timestamp } } }
 */
router.post('/mark', attendanceMarkLimiter, authMiddleware, requireStudent, markAttendance);

/**
 * GET /session/:sessionId - Get Attendance By Session Route
 * 
 * Request: GET /api/attendance/session/123
 * Headers: { Authorization: "Bearer <faculty/admin_token>" }
 * Params: { sessionId: "123" }
 * 
 * Flow:
 * - Faculty/Admin session ki attendance list dekhna chahte hain
 * - Route getAttendanceBySession controller function ko call karta hai
 * - Controller sessionId extract karke attendanceService.getAttendanceBySession() call karta hai
 * - Service database se session ki sab attendance records fetch karta hai
 * - Service attendance data format karke return karta hai
 * - Controller response return karta hai
 * 
 * Response: { success: true, data: { sessionId: "123", attendances: [...] } }
 */
router.get('/session/:sessionId', getAttendanceBySession);

/**
 * GET /student/:studentId - Get Attendance By Student Route
 * 
 * Request: GET /api/attendance/student/456
 * Headers: { Authorization: "Bearer <student/faculty/admin_token>" }
 * Params: { studentId: "456" }
 * Query (optional): { sessionId: "123", startDate: "2024-01-01", endDate: "2024-01-31" }
 * 
 * Flow:
 * - Student apni attendance history dekhna chahta hai
 * - Faculty/Admin kisi student ki attendance dekh sakte hain
 * - Route getAttendanceByStudent controller function ko call karta hai
 * - Controller studentId aur query params extract karke attendanceService.getAttendanceByStudent() call karta hai
 * - Service database se student ki attendance records fetch karta hai (filters ke saath)
 * - Service attendance data format karke return karta hai
 * - Controller response return karta hai
 * 
 * Response: { success: true, data: { studentId: "456", attendances: [...] } }
 */
router.get('/student/:studentId', getAttendanceByStudent);

/**
 * GET /report/:sessionId - Get Attendance Report Route (Faculty Reports)
 * 
 * Request: GET /api/attendance/report/123
 * Headers: { Authorization: "Bearer <faculty/admin_token>" }
 * Params: { sessionId: "123" }
 * Query (optional): { format: "detailed" | "summary" }
 * 
 * Flow:
 * - Faculty session ka detailed attendance report generate karna chahte hain
 * - Route getAttendanceReport controller function ko call karta hai
 * - Controller sessionId extract karke attendanceService.getAttendanceReport() call karta hai
 * - Service database se session ki attendance data fetch karta hai
 * - Service statistics calculate karta hai (total students, present count, absent count, late count)
 * - Service report format karke return karta hai
 * - Controller response return karta hai
 * 
 * Response: { success: true, data: { sessionId: "123", report: { total, present, absent, late, details: [...] } } }
 */
router.get('/report/:sessionId', getAttendanceReport);

// ============================================================================
// MANUAL ATTENDANCE REQUEST ROUTES (student → teacher)
// Jab student QR scan nahi kar paya, woh teacher ko request bhejta hai
// ============================================================================

const { pool } = require('../../config/database');

/**
 * GET /api/attendance/requestable-sessions
 * Sessions from last 7 days that student can request attendance for
 * (excludes sessions already attended or already requested)
 */
router.get('/requestable-sessions', authMiddleware, requireStudent, async (req, res) => {
  try {
    const student_id = req.user.id;
    const [rows] = await pool.query(
      `SELECT s.id, s.subject, s.location, s.start_time, s.status,
              u.name AS faculty_name
       FROM sessions s
       JOIN users u ON u.id = s.faculty_id
       WHERE s.start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         AND s.id NOT IN (
           SELECT session_id FROM attendance WHERE student_id = ?
         )
         AND s.id NOT IN (
           SELECT session_id FROM manual_attendance_request WHERE student_id = ? AND status = 'pending'
         )
       ORDER BY s.start_time DESC
       LIMIT 50`,
      [student_id, student_id]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching requestable sessions:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch sessions.' });
  }
});

/**
 * POST /api/attendance/manual-request
 * Student submits a manual attendance request for a session
 * Body: { session_id, reason }
 */
router.post('/manual-request', authMiddleware, requireStudent, async (req, res) => {
  try {
    const student_id = req.user.id;
    const { session_id, reason } = req.body;

    if (!session_id || !reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Session ID and reason are required.' });
    }

    // Verify session exists
    const [sessions] = await pool.query(
      'SELECT id, faculty_id, subject, status FROM sessions WHERE id = ?',
      [session_id]
    );
    if (!sessions.length) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    // Check student not already marked present in this session
    const [existing] = await pool.query(
      'SELECT id FROM attendance WHERE student_id = ? AND session_id = ?',
      [student_id, session_id]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Your attendance is already marked for this session.' });
    }

    // Upsert: one request per student per session
    await pool.query(
      `INSERT INTO manual_attendance_request (student_id, session_id, reason, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', NOW(), NOW())
       ON DUPLICATE KEY UPDATE reason = VALUES(reason), status = 'pending', reviewed_by = NULL, reviewed_at = NULL, rejection_note = NULL, updated_at = NOW()`,
      [student_id, session_id, reason.trim()]
    );

    const [rows] = await pool.query(
      'SELECT id FROM manual_attendance_request WHERE student_id = ? AND session_id = ?',
      [student_id, session_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Attendance request sent to teacher successfully.',
      data: { id: rows[0].id }
    });
  } catch (error) {
    console.error('Error creating manual attendance request:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit request.' });
  }
});

/**
 * GET /api/attendance/manual-requests/student
 * Student sees all their own requests with status
 */
router.get('/manual-requests/student', authMiddleware, requireStudent, async (req, res) => {
  try {
    const student_id = req.user.id;
    const [rows] = await pool.query(
      `SELECT r.id, r.session_id, r.reason, r.status, r.rejection_note, r.created_at, r.reviewed_at,
              s.subject, s.location, s.start_time,
              u.name AS faculty_name
       FROM manual_attendance_request r
       JOIN sessions s ON s.id = r.session_id
       JOIN users u ON u.id = s.faculty_id
       WHERE r.student_id = ?
       ORDER BY r.created_at DESC`,
      [student_id]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching student manual requests:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
});

/**
 * GET /api/attendance/manual-requests/faculty
 * Faculty sees all pending (+ recent) requests for their sessions
 * Query: ?status=pending|approved|rejected|all (default: pending)
 */
router.get('/manual-requests/faculty', authMiddleware, requireFaculty, async (req, res) => {
  try {
    const faculty_id = req.user.id;
    const status = req.query.status || 'pending';

    let where = 'WHERE s.faculty_id = ?';
    const params = [faculty_id];

    if (status !== 'all') {
      where += ' AND r.status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT r.id, r.reason, r.status, r.rejection_note, r.created_at, r.reviewed_at,
              r.session_id, s.subject, s.location, s.start_time, s.status AS session_status,
              r.student_id, u.name AS student_name, u.email AS student_email, u.student_id AS student_roll
       FROM manual_attendance_request r
       JOIN sessions s ON s.id = r.session_id
       JOIN users u ON u.id = r.student_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT 100`,
      params
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching faculty manual requests:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
});

/**
 * PATCH /api/attendance/manual-request/:id/approve
 * Faculty approves request → marks attendance as present (1)
 */
router.patch('/manual-request/:id/approve', authMiddleware, requireFaculty, async (req, res) => {
  try {
    const faculty_id = req.user.id;
    const { id } = req.params;

    // Fetch request + verify session belongs to this faculty
    const [rows] = await pool.query(
      `SELECT r.*, s.faculty_id, s.subject FROM manual_attendance_request r
       JOIN sessions s ON s.id = r.session_id
       WHERE r.id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });
    const request = rows[0];
    if (Number(request.faculty_id) !== Number(faculty_id)) {
      return res.status(403).json({ success: false, message: 'You can only review requests for your own sessions.' });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({ success: false, message: `Request already ${request.status}.` });
    }

    // Mark attendance as present
    await pool.query(
      `INSERT INTO attendance (student_id, session_id, status, marked_at, created_at)
       VALUES (?, ?, 'present', NOW(), NOW())
       ON DUPLICATE KEY UPDATE status = 'present', marked_at = NOW()`,
      [request.student_id, request.session_id]
    );

    // Update request status
    await pool.query(
      `UPDATE manual_attendance_request SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [faculty_id, id]
    );

    return res.status(200).json({ success: true, message: 'Attendance marked as present. Request approved.' });
  } catch (error) {
    console.error('Error approving manual request:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve request.' });
  }
});

/**
 * PATCH /api/attendance/manual-request/:id/reject
 * Faculty rejects request with optional note
 * Body: { note? }
 */
router.patch('/manual-request/:id/reject', authMiddleware, requireFaculty, async (req, res) => {
  try {
    const faculty_id = req.user.id;
    const { id } = req.params;
    const { note } = req.body;

    const [rows] = await pool.query(
      `SELECT r.*, s.faculty_id FROM manual_attendance_request r
       JOIN sessions s ON s.id = r.session_id
       WHERE r.id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });
    const request = rows[0];
    if (Number(request.faculty_id) !== Number(faculty_id)) {
      return res.status(403).json({ success: false, message: 'You can only review requests for your own sessions.' });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({ success: false, message: `Request already ${request.status}.` });
    }

    await pool.query(
      `UPDATE manual_attendance_request SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), rejection_note = ?, updated_at = NOW() WHERE id = ?`,
      [faculty_id, note?.trim() || null, id]
    );

    return res.status(200).json({ success: true, message: 'Request rejected.' });
  } catch (error) {
    console.error('Error rejecting manual request:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject request.' });
  }
});

// ============================================================================
// ROUTER EXPORT
// ============================================================================

/**
 * Router ko export kar rahe hain - app.js mein use hoga
 * 
 * app.js mein usage:
 * const attendanceRoutes = require('./routes/attendance/attendance');
 * app.use('/api/attendance', attendanceRoutes);
 * 
 * Final URLs:
 * - POST /api/attendance/mark
 * - GET /api/attendance/session/:sessionId
 * - GET /api/attendance/student/:studentId
 * - GET /api/attendance/report/:sessionId
 * 
 * Kyun '/api/attendance' prefix?
 * - API versioning: /api/v1/attendance (future mein versioning ke liye)
 * - Organization: Sab API routes /api se start - clear structure
 * - Separation: API routes aur static files alag - routing clear
 */
module.exports = router;

// ============================================================================
// IMPORTANT NOTES:
// ============================================================================
//
// 1. Route Definition Pattern:
//    router.METHOD('/path', controllerFunction)
//    - METHOD: GET (read), POST (create), PUT (update), DELETE (delete)
//    - '/path': Route path (e.g., '/mark', '/session/:sessionId')
//    - controllerFunction: Controller function jo execute hogi
//
// 2. RESTful Conventions:
//    - GET: Data read karne ke liye (attendance list, reports)
//    - POST: Data create karne ke liye (mark attendance)
//    - PUT: Data update karne ke liye (update attendance status)
//    - DELETE: Data delete karne ke liye (delete attendance record)
//
// 3. URL Parameters:
//    - :sessionId, :studentId - route parameters jo URL se extract hote hain
//    - req.params se access hota hai: req.params.sessionId
//
// 4. Query Parameters:
//    - ?startDate=2024-01-01&endDate=2024-01-31 - query string se
//    - req.query se access hota hai: req.query.startDate
//
// 5. No Business Logic:
//    - Yahan sirf route definitions hain
//    - Business logic controllers aur services mein hogi
//    - Routes bas URL map karte hain controller functions se
//
// 6. Request Flow:
//    Frontend → Route → Controller → Service → Database → Service → Controller → Route → Frontend
//
// 7. Adding New Routes:
//    - Naya route add karna ho to yahan add karo
//    - Controller function pehle se exist karni chahiye
//    - Route path clear aur RESTful honi chahiye
//
// 8. Middleware Integration:
//    - Authentication middleware: router.post('/mark', authenticate, markAttendance)
//    - Authorization middleware: router.get('/report/:sessionId', authenticate, authorizeFaculty, getAttendanceReport)
//    - Validation middleware: router.post('/mark', authenticate, validateMarkAttendance, markAttendance)
//
// 9. Best Practices:
//    - Route paths clear aur descriptive honi chahiye
//    - RESTful conventions follow karo
//    - Related routes ek hi file mein group karo
//    - Routing layer thin rakho - logic controllers/services mein
//
// ============================================================================

