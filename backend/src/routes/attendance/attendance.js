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
router.post('/mark', authMiddleware, markAttendance);

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

