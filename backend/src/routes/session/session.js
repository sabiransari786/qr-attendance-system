/**
 * Session Routes File (session.js)
 * 
 * Ye file attendance session-related routes define karti hai
 * QR-based attendance system mein sessions zaroori hain - faculty sessions create karte hain
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
// SESSION CONTROLLER IMPORT
// ============================================================================

// Session controller import kar rahe hain
// Controllers request/response handle karte hain - business logic services mein hoti hai
// Controller functions: createSession, closeSession, getActiveSessions, getSessionById
// Path: '../../controllers/session.controller' - routes/session folder se controllers folder
const {
  createSession,
  closeSession,
  getActiveSessions,
  getSessionById
} = require('../../controllers/session.controller');

// ============================================================================
// ATTENDANCE SESSION KYA HAI? (What is an Attendance Session?)
// ============================================================================

/**
 * Attendance Session Kya Hai?
 * 
 * Session = Ek time period jisme attendance mark hoti hai
 * Example: "Data Structures Class - 10:00 AM to 11:00 AM, Room 101"
 * 
 * Session Components:
 * - Session ID: Unique identifier (database mein primary key)
 * - Faculty ID: Session create karne wala faculty member
 * - Subject/Course: Kaunsi class/subject ki session hai
 * - Location: Class room number ya location
 * - Start Time: Session start hone ka time
 * - End Time: Session end hone ka time (optional)
 * - Status: ACTIVE (attendance mark ho rahi hai) ya CLOSED (session close ho chuki hai)
 * - QR Code: Session ka unique QR code jo students scan karenge
 * 
 * Kyun Sessions Zaroori Hain QR-Based Attendance Ke Liye?
 * 
 * 1. Time-Based Tracking:
 *    - Har class/period ki attendance alag track hoti hai
 *    - Session start time se pata chal jata hai ki attendance kab mark karni hai
 *    - Session end time se attendance marking automatically stop ho jati hai
 * 
 * 2. QR Code Generation:
 *    - Har session ka unique QR code generate hota hai
 *    - QR code mein sessionId, expiryTime, security token hota hai
 *    - Students QR code scan karke attendance mark karte hain
 *    - QR code expiry time ke baad invalid ho jata hai - security ke liye
 * 
 * 3. Faculty Control:
 *    - Faculty session create karke attendance start karte hain
 *    - Faculty session close kar sakte hain - uske baad attendance mark nahi ho sakti
 *    - Faculty active sessions dekh sakte hain - kaunsi sessions chal rahi hain
 * 
 * 4. Student Access:
 *    - Students active sessions dekh sakte hain
 *    - Students QR code scan karke attendance mark kar sakte hain
 *    - Session close hone ke baad students attendance mark nahi kar sakte
 * 
 * 5. Data Organization:
 *    - Attendance records session-wise organize hote hain
 *    - Reports session-wise generate ho sakte hain
 *    - Analytics session-wise data analyze karne mein help karti hai
 * 
 * Faculty Actions Kaise Backend Se Connect Hote Hain?
 * 
 * Action 1: Create Session (Faculty Session Create Karta Hai)
 * - Faculty web app mein session create form fill karta hai
 * - Frontend POST /api/session request bhejta hai
 * - Route createSession controller ko call karta hai
 * - Controller sessionService.createSession() call karta hai
 * - Service database mein session record create karta hai
 * - Service QR code generate karta hai (sessionId, expiryTime ke saath)
 * - Response mein session details aur QR code data return hota hai
 * - Faculty QR code display karke students ko dikhata hai
 * 
 * Action 2: Close Session (Faculty Session Close Karta Hai)
 * - Faculty "Close Session" button click karta hai
 * - Frontend PUT /api/session/:sessionId/close request bhejta hai
 * - Route closeSession controller ko call karta hai
 * - Controller sessionService.closeSession() call karta hai
 * - Service database mein session status CLOSED update karta hai
 * - Uske baad students attendance mark nahi kar sakte
 * 
 * Action 3: View Active Sessions (Faculty Active Sessions Dekhta Hai)
 * - Faculty "My Active Sessions" page open karta hai
 * - Frontend GET /api/session/active request bhejta hai
 * - Route getActiveSessions controller ko call karta hai
 * - Controller sessionService.getActiveSessions() call karta hai
 * - Service database se ACTIVE status wali sessions fetch karta hai
 * - Response mein active sessions list return hoti hai
 * 
 * Action 4: View Session Details (Faculty Session Details Dekhta Hai)
 * - Faculty kisi specific session ki details dekhna chahta hai
 * - Frontend GET /api/session/:sessionId request bhejta hai
 * - Route getSessionById controller ko call karta hai
 * - Controller sessionService.getSessionById() call karta hai
 * - Service database se session details fetch karta hai
 * - Response mein complete session info return hoti hai
 * 
 * Request Flow: Route → Controller → Service → Database
 * 
 * Step 1: Route Request Receive Karta Hai
 * - Frontend se HTTP request aata hai (GET, POST, PUT, DELETE)
 * - Router request catch karta hai matching route pattern se
 * - Route controller function ko call karta hai
 * 
 * Step 2: Controller Request Validate Karta Hai
 * - Controller request body/params validate karta hai
 * - Required fields check karta hai
 * - User authentication/authorization check karta hai
 * - Controller service function ko call karta hai
 * 
 * Step 3: Service Business Logic Handle Karta Hai
 * - Service business rules apply karta hai
 * - Data validation aur transformation karta hai
 * - Database queries execute karta hai (pool use karke)
 * - Business logic calculations karta hai
 * 
 * Step 4: Database Query Execute Hoti Hai
 * - Service database connection pool se connection get karta hai
 * - SQL queries execute hoti hain (SELECT, INSERT, UPDATE, DELETE)
 * - Database results return hoti hain
 * 
 * Step 5: Response Wapas Jata Hai
 * - Service → Controller → Route → Frontend
 * - Success: { success: true, data: {...} }
 * - Error: { success: false, message: "..." }
 */

// ============================================================================
// SESSION ROUTES DEFINITION
// ============================================================================

/**
 * POST / - Create Session Route
 * 
 * Request: POST /api/session
 * Body: { subject: "Data Structures", location: "Room 101", startTime: "2024-01-01T10:00:00Z", duration: 60 }
 * Headers: { Authorization: "Bearer <faculty_token>" }
 * 
 * Flow:
 * - Faculty session create form fill karke request bhejta hai
 * - Route createSession controller function ko call karta hai
 * - Controller request validate karke sessionService.createSession() call karta hai
 * - Service database mein session record create karta hai (status: ACTIVE)
 * - Service QR code generate karta hai (sessionId, expiryTime ke saath)
 * - Controller response return karta hai (session details aur QR code data)
 * 
 * Response: { success: true, data: { session: { id, subject, location, status, qrCode: "..." } } }
 */
router.post('/', createSession);

/**
 * PUT /:sessionId/close - Close Session Route
 * 
 * Request: PUT /api/session/123/close
 * Headers: { Authorization: "Bearer <faculty_token>" }
 * Params: { sessionId: "123" }
 * 
 * Flow:
 * - Faculty session close karna chahta hai
 * - Route closeSession controller function ko call karta hai
 * - Controller sessionId extract karke sessionService.closeSession() call karta hai
 * - Service database mein session status CLOSED update karta hai
 * - Service session end time set karta hai (current timestamp)
 * - Controller response return karta hai
 * 
 * Response: { success: true, data: { session: { id, status: "closed", endTime: "..." } } }
 */
router.put('/:sessionId/close', closeSession);

/**
 * GET /active - Get Active Sessions Route
 * 
 * Request: GET /api/session/active
 * Headers: { Authorization: "Bearer <faculty/admin_token>" }
 * Query (optional): { facultyId: "456" } - specific faculty ki sessions
 * 
 * Flow:
 * - Faculty/Admin active sessions list dekhna chahte hain
 * - Route getActiveSessions controller function ko call karta hai
 * - Controller query params extract karke sessionService.getActiveSessions() call karta hai
 * - Service database se ACTIVE status wali sessions fetch karta hai
 * - Service session data format karke return karta hai
 * - Controller response return karta hai
 * 
 * Response: { success: true, data: { sessions: [{ id, subject, location, status, startTime, ... }] } }
 */
router.get('/active', getActiveSessions);

/**
 * GET /:sessionId - Get Session Details By ID Route
 * 
 * Request: GET /api/session/123
 * Headers: { Authorization: "Bearer <faculty/admin/student_token>" }
 * Params: { sessionId: "123" }
 * 
 * Flow:
 * - Faculty/Admin/Student session ki complete details dekhna chahte hain
 * - Route getSessionById controller function ko call karta hai
 * - Controller sessionId extract karke sessionService.getSessionById() call karta hai
 * - Service database se session details fetch karta hai (including attendance count, etc.)
 * - Service session data format karke return karta hai
 * - Controller response return karta hai
 * 
 * Response: { success: true, data: { session: { id, subject, location, status, startTime, endTime, qrCode, attendanceCount, ... } } }
 */
router.get('/:sessionId', getSessionById);

// ============================================================================
// ROUTER EXPORT
// ============================================================================

/**
 * Router ko export kar rahe hain - app.js mein use hoga
 * 
 * app.js mein usage:
 * const sessionRoutes = require('./routes/session/session');
 * app.use('/api/session', sessionRoutes);
 * 
 * Final URLs:
 * - POST /api/session
 * - PUT /api/session/:sessionId/close
 * - GET /api/session/active
 * - GET /api/session/:sessionId
 * 
 * Kyun '/api/session' prefix?
 * - API versioning: /api/v1/session (future mein versioning ke liye)
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
//    - '/path': Route path (e.g., '/', '/:sessionId', '/active')
//    - controllerFunction: Controller function jo execute hogi
//
// 2. RESTful Conventions:
//    - GET: Data read karne ke liye (get sessions, get session details)
//    - POST: Data create karne ke liye (create session)
//    - PUT: Data update karne ke liye (close session, update session)
//    - DELETE: Data delete karne ke liye (delete session - if needed)
//
// 3. URL Parameters:
//    - :sessionId - route parameter jo URL se extract hota hai
//    - req.params se access hota hai: req.params.sessionId
//
// 4. Query Parameters:
//    - ?facultyId=456 - query string se
//    - req.query se access hota hai: req.query.facultyId
//
// 5. Route Order Matters:
//    - '/active' route ko '/:sessionId' se pehle define karna zaroori hai
//    - Express routes top-to-bottom match karta hai
//    - Agar '/:sessionId' pehle ho to '/active' ko sessionId samajh lega
//
// 6. No Business Logic:
//    - Yahan sirf route definitions hain
//    - Business logic controllers aur services mein hogi
//    - Routes bas URL map karte hain controller functions se
//
// 7. Request Flow:
//    Frontend → Route → Controller → Service → Database → Service → Controller → Route → Frontend
//
// 8. Adding New Routes:
//    - Naya route add karna ho to yahan add karo
//    - Controller function pehle se exist karni chahiye
//    - Route path clear aur RESTful honi chahiye
//
// 9. Middleware Integration:
//    - Authentication middleware: router.post('/', authenticate, createSession)
//    - Authorization middleware: router.post('/', authenticate, authorizeFaculty, createSession)
//    - Validation middleware: router.post('/', authenticate, validateCreateSession, createSession)
//
// 10. Best Practices:
//     - Route paths clear aur descriptive honi chahiye
//     - RESTful conventions follow karo
//     - Related routes ek hi file mein group karo
//     - Routing layer thin rakho - logic controllers/services mein
//
// ============================================================================

