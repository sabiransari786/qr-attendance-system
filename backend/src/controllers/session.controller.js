/**
 * =============================================================================
 * SESSION CONTROLLER - QR-based Attendance Tracking System
 * =============================================================================
 * 
 * Yeh file Controller layer ka part hai jo Clean Architecture follow karti hai.
 * Session management related saari requests yahan handle hoti hain.
 * 
 * REQUEST FLOW SAMJHO:
 * ====================
 * Client Request → Route → Controller → Service → Repository → Database
 *                              ↑
 *                         (Hum yahan hain)
 * 
 * CONTROLLER KA KAAM KYA HAI?
 * ===========================
 * 1. Request se data extract karna (body, params, query, user)
 * 2. Basic validation karna (required fields check)
 * 3. Service layer ko call karna
 * 4. Response format karke client ko bhejana
 * 5. Errors ko next() se global error handler ko pass karna
 * 
 * CONTROLLER MEIN KYA NAHI LIKHNA HAI?
 * ====================================
 * - Business logic (jaise QR code generation, session state management)
 * - Database queries (SELECT, INSERT, UPDATE, DELETE)
 * - QR code encoding/encryption logic
 * - Session timing calculations
 * - Complex validation rules
 * 
 * Yeh sab Service layer mein hoga kyunki:
 * - Separation of Concerns maintain hoti hai
 * - Code reusable banta hai
 * - Testing easy ho jati hai (mock kar sakte hain service ko)
 * - Controller thin/lightweight rehta hai
 * - QR generation logic ek jagah centralize rehti hai
 * 
 * IMPORTANT NOTES ABOUT SESSIONS:
 * ===============================
 * - Session ek class/lecture ko represent karti hai
 * - Faculty member session create karta hai
 * - Har session ka ek unique QR code hota hai
 * - QR code mein sessionId, timestamp, expiry time hota hai
 * - Session active/closed states mein rehti hai
 * - Students QR scan karke attendance mark karte hain
 * 
 * FACULTY CONTROL:
 * ================
 * - req.user mein logged-in faculty ki info hoti hai
 * - Faculty sirf apni sessions create/close kar sakta hai (authorization)
 * - Session creation pe QR code automatically generate hota hai
 * - QR code service layer mein generate hoga (controller mein NAHI)
 * 
 * =============================================================================
 */

// =============================================================================
// DEPENDENCIES IMPORT KARO
// =============================================================================

/**
 * Session Service ko import kar rahe hain
 * Saari business logic, QR generation, aur database operations
 * isi service mein honge
 * 
 * Service layer mein yeh sab hoga:
 * - Session creation with QR code generation
 * - Session state management (active/closed)
 * - QR code encoding/encryption (if needed)
 * - Session expiry time calculations
 * - Database queries for session operations
 * - Faculty authorization checks
 * 
 * Controller sirf isko call karega, khud kuch nahi karega
 * 
 */
console.log("SESSION CONTROLLER LOADED");
const sessionService = require('../services/session.service');

// =============================================================================
// CONTROLLER FUNCTIONS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * CREATE SESSION CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: POST /api/session
 * 
 * Kya karta hai yeh function?
 * - Naya session/class create karne ke liye use hota hai
 * - Faculty member session create karta hai
 * - Session create hote hi QR code automatically generate hota hai
 * - Students yeh QR code scan karke attendance mark karenge
 * 
 * Request Body mein kya aana chahiye:
 * - subject: Subject ka naam (e.g., "Data Structures", "Mathematics")
 * - location: Class ka location (e.g., "Room 101", "Lab 2")
 * - startTime: Session start time (ISO format ya timestamp)
 * - duration: Session duration (minutes mein, e.g., 60)
 * - Aur optional fields (description, maxStudents, etc.)
 * 
 * req.user se kya milega:
 * - Authentication middleware ne logged-in faculty ki info daal di hogi
 * - req.user.id = facultyId (faculty ka unique ID)
 * - req.user.name = faculty name
 * - req.user.email = faculty email
 * - req.user.role = 'faculty' ya 'admin'
 * 
 * IMPORTANT: QR code generation yahan NAHI hogi!
 * - QR code generation Service layer mein hogi
 * - QR code mein sessionId, timestamp, expiry time encode hoga
 * - QR code encrypted/encoded ho sakta hai security ke liye
 * - Controller ko sirf final QR data milega service se
 * 
 * Response mein kya milega:
 * - Created session details (id, subject, location, status, etc.)
 * - QR code data (text/URL/base64 - jo format service ne generate kiya)
 * - QR code expiry time
 * - Session start/end times
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function (error handling ke liye)
 */
const createSession = async (req, res, next) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Request body se session data extract karo
        // ---------------------------------------------------------------------
        // Destructuring use kar rahe hain - clean aur readable hai
        const { subject, location, startTime, duration, ...extraFields } = req.body;

        // ---------------------------------------------------------------------
        // STEP 2: Logged-in faculty ki info nikalo
        // ---------------------------------------------------------------------
        // req.user authentication middleware ne populate kiya hai
        // Agar faculty login nahi hai toh auth middleware pehle hi rok dega
        const facultyId = req.user?.id;

        // ---------------------------------------------------------------------
        // STEP 3: Basic Validation - Required fields check karo
        // ---------------------------------------------------------------------
        // Yeh sirf basic check hai - "field hai ya nahi"
        // Complex validation (jaise time validation, duration limits)
        // Service layer mein hogi

        // Faculty ID check - agar auth middleware ne user nahi diya toh problem hai
        if (!facultyId) {
            // 401 Unauthorized - User authenticated nahi hai
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Faculty login karna padega session create karne ke liye.'
            });
        }

        // Subject check - subject ka naam toh chahiye hi
        if (!subject || subject.trim() === '') {
            // 400 Bad Request - Client ne required data nahi bheja
            return res.status(400).json({
                success: false,
                message: 'Subject is required. Kaunsi subject ki class hai?'
            });
        }

        // Location check - class kahan ho rahi hai yeh bhi important hai
        if (!location || location.trim() === '') {
            // 400 Bad Request - Location missing hai
            return res.status(400).json({
                success: false,
                message: 'Location is required. Class kahan ho rahi hai?'
            });
        }

        // Start Time check - kab start hogi class yeh toh batao
        if (!startTime) {
            // 400 Bad Request - Start time missing hai
            return res.status(400).json({
                success: false,
                message: 'Start time is required. Class kab shuru hogi?'
            });
        }

        // Duration check - kitne time tak chalegi class
        if (!duration) {
            // 400 Bad Request - Duration missing hai
            return res.status(400).json({
                success: false,
                message: 'Duration is required. Class kitne minutes ki hogi?'
            });
        }

        // Optional: Basic duration validation (minutes mein positive number)
        if (typeof duration !== 'number' || duration <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Duration must be a positive number (in minutes).'
            });
        }

        // ---------------------------------------------------------------------
        // STEP 4: Session Data Object prepare karo
        // ---------------------------------------------------------------------
        // Service ko clean data object bhejna hai
        // Extra fields bhi include kar sakte hain (schema mein allowed ho toh)
        const sessionData = {
            subject: subject.trim(),
            location: location.trim(),
            startTime: startTime,
            duration: duration,
            ...extraFields  // Koi extra fields ho toh include karo (description, etc.)
        };

        // ---------------------------------------------------------------------
        // STEP 5: Service Layer ko call karo
        // ---------------------------------------------------------------------
        // Dekho - yahan humne koi business logic nahi likhi
        // Bas data extract kiya, validate kiya (basic), aur service ko de diya
        // 
        // Service layer mein yeh sab hoga:
        // - Session record database mein create karna
        // - Unique sessionId generate karna
        // - QR code generate karna (sessionId + timestamp + expiry encode karke)
        // - QR code encrypt/encode karna (security ke liye)
        // - Session expiry time calculate karna (startTime + duration)
        // - Session status set karna (active)
        // - QR code data aur session details return karna
        const createdSession = await sessionService.createSession(facultyId, sessionData);

        // ---------------------------------------------------------------------
        // STEP 6: Success Response bhejo
        // ---------------------------------------------------------------------
        // 201 Created - Nayi session ban gayi
        // Session details aur QR code data dono bhej rahe hain
        return res.status(201).json({
            success: true,
            message: 'Session created successfully! QR code generate ho gaya hai.',
            data: createdSession  // Isme session details + QR code data hoga
        });

    } catch (error) {
        // ---------------------------------------------------------------------
        // ERROR HANDLING
        // ---------------------------------------------------------------------
        // Koi bhi error aaye - service se ya kahi se bhi
        // Hum use next() se global error handler ko pass kar denge
        // 
        // Common errors jo service se aayengi:
        // - Invalid time format (400)
        // - Faculty not found (404)
        // - Database errors (500)
        // - QR generation errors (500)
        // 
        // Global error handler proper error response format karega
        next(error);
    }
};

/**
 * -----------------------------------------------------------------------------
 * CLOSE SESSION CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: PUT /api/session/:sessionId/close
 * 
 * Kya karta hai yeh function?
 * - Ek active session ko close karne ke liye use hota hai
 * - Faculty member apni session close kar sakta hai
 * - Session close hone ke baad attendance mark nahi ho sakti
 * - QR code invalid/expired ho jayega
 * 
 * URL Parameter:
 * - sessionId: Kis session ko close karna hai
 * 
 * Example: PUT /api/session/sess_12345/close
 * 
 * req.user se kya milega:
 * - Logged-in faculty ki info (facultyId)
 * - Authorization check service layer mein hogi (sirf owner close kar sakta hai)
 * 
 * IMPORTANT: Session state management yahan NAHI hogi!
 * - Session closing logic Service layer mein hogi
 * - Authorization check (faculty owner hai ya nahi) Service layer mein hogi
 * - QR code invalidation Service layer mein hogi
 * - Controller sirf ID pass karega service ko
 * 
 * Response mein kya milega:
 * - Updated session details (status: 'closed')
 * - Closed timestamp
 * - Final attendance statistics (optional)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const closeSession = async (req, res, next) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: URL params se session ID nikalo
        // ---------------------------------------------------------------------
        // req.params mein URL ke dynamic parts aate hain
        // /session/:sessionId/close - toh :sessionId ki value req.params.sessionId mein milegi
        const { sessionId } = req.params;

        // ---------------------------------------------------------------------
        // STEP 2: Basic Validation
        // ---------------------------------------------------------------------
        // Session ID toh honi chahiye - bina iske session kaise close karenge
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required. Kaunsi session close karni hai?'
            });
        }

        // ---------------------------------------------------------------------
        // STEP 3: Service Layer ko call karo
        // ---------------------------------------------------------------------
        // Service layer mein yeh sab hoga:
        // - Session exist karti hai ya nahi check
        // - Session already closed toh nahi hai check
        // - Authorization check (faculty session ka owner hai ya nahi)
        // - Session status update karna (active → closed)
        // - Closed timestamp set karna
        // - QR code invalidate karna (if needed)
        // - Final attendance statistics calculate karna (optional)
        const closedSession = await sessionService.closeSession(sessionId);

        // ---------------------------------------------------------------------
        // STEP 4: Success Response bhejo
        // ---------------------------------------------------------------------
        // 200 OK - Session successfully close ho gayi
        return res.status(200).json({
            success: true,
            message: 'Session closed successfully! Ab attendance mark nahi ho sakti.',
            data: closedSession
        });

    } catch (error) {
        // ---------------------------------------------------------------------
        // ERROR HANDLING
        // ---------------------------------------------------------------------
        // Koi bhi error aaye - service se ya kahi se bhi
        // 
        // Common errors jo service se aayengi:
        // - Session not found (404)
        // - Session already closed (400)
        // - Unauthorized (403) - Faculty owner nahi hai
        // - Database errors (500)
        // 
        // Global error handler proper error response format karega
        next(error);
    }
};

/**
 * -----------------------------------------------------------------------------
 * GET ACTIVE SESSIONS CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: GET /api/session/active
 * 
 * Kya karta hai yeh function?
 * - Currently active sessions ki list laata hai
 * - Faculty apni active sessions dekh sakta hai
 * - Admin saari active sessions dekh sakta hai
 * - Students bhi dekh sakte hain (jismein unki attendance mark karni hai)
 * 
 * Query Parameters (Optional Filters):
 * - facultyId: Specific faculty ki sessions filter karna (optional)
 * - subject: Subject ke basis pe filter (optional)
 * - location: Location ke basis pe filter (optional)
 * 
 * Example: GET /api/session/active?facultyId=fac_123
 * 
 * req.user se kya milega:
 * - Logged-in user ki info (faculty ya student)
 * - Agar faculty hai toh sirf apni sessions dikhayi jayengi (default)
 * - Agar admin hai toh saari sessions dikhayi jayengi
 * 
 * IMPORTANT: Filtering logic yahan NAHI hogi!
 * - Active session filtering Service layer mein hogi
 * - Authorization-based filtering Service layer mein hogi
 * - Controller sirf filters pass karega service ko
 * 
 * Response mein kya milega:
 * - Active sessions ki array
 * - Har session mein: id, subject, location, startTime, QR code, etc.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getActiveSessions = async (req, res, next) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Query parameters se optional filters nikalo
        // ---------------------------------------------------------------------
        // req.query mein URL ke ? ke baad wale parameters aate hain
        // Example: ?facultyId=123&subject=Maths
        // 
        // Yeh filters optional hain - agar nahi diye toh saari active sessions aa jayengi
        // (with proper authorization - faculty ko sirf apni dikhayi jayengi)
        const { facultyId, subject, location } = req.query;

        // Filters ko ek object mein pack kar do - service ko pass karna easy hoga
        const filters = {
            facultyId: facultyId || null,     // Specific faculty filter
            subject: subject || null,         // Subject filter
            location: location || null        // Location filter
        };

        // ---------------------------------------------------------------------
        // STEP 2: Logged-in user ki info (optional - authorization ke liye)
        // ---------------------------------------------------------------------
        // req.user se user info mil sakti hai
        // Service layer mein authorization check hogi
        // Agar faculty hai toh default apni hi sessions dikhayi jayengi
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // ---------------------------------------------------------------------
        // STEP 3: Service Layer ko call karo
        // ---------------------------------------------------------------------
        // Service layer mein yeh sab hoga:
        // - Active sessions fetch karna (status = 'active')
        // - Authorization-based filtering (faculty ko sirf apni sessions)
        // - Query filters apply karna (facultyId, subject, location)
        // - Session expiry check (time over ho gaya toh auto-close)
        // - QR code data include karna (if needed)
        // - Session details populate karna
        const activeSessions = await sessionService.getActiveSessions(filters, {
            userId,
            userRole
        });

        // ---------------------------------------------------------------------
        // STEP 4: Success Response bhejo
        // ---------------------------------------------------------------------
        // 200 OK - Active sessions successfully mil gayi
        return res.status(200).json({
            success: true,
            message: 'Active sessions fetched successfully.',
            data: activeSessions,
            count: activeSessions.length,
            // Applied filters bhi bhej do for transparency
            appliedFilters: filters
        });

    } catch (error) {
        // Error handling - global handler ko pass karo
        next(error);
    }
};

/**
 * -----------------------------------------------------------------------------
 * GET SESSION BY ID CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: GET /api/session/:sessionId
 * 
 * Kya karta hai yeh function?
 * - Ek specific session ki complete details laata hai
 * - Faculty apni session details dekh sakta hai
 * - Students session details dekh sakte hain (QR code, timing, etc.)
 * - Attendance statistics bhi mil sakti hai (present/absent count)
 * 
 * URL Parameter:
 * - sessionId: Kis session ki details chahiye
 * 
 * Example: GET /api/session/sess_12345
 * 
 * Response mein kya milega:
 * - Session complete details (subject, location, timing, status)
 * - QR code data (if session active hai)
 * - Faculty details
 * - Attendance statistics (total, present, absent, percentage)
 * - Enrolled students list (optional)
 * 
 * IMPORTANT: Data aggregation yahan NAHI hogi!
 * - Session details fetching Service layer mein hogi
 * - Attendance statistics calculation Service layer mein hogi
 * - Authorization check Service layer mein hogi
 * - Controller sirf ID pass karega service ko
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getSessionById = async (req, res, next) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: URL params se session ID nikalo
        // ---------------------------------------------------------------------
        // req.params mein URL ke dynamic parts aate hain
        // /session/:sessionId - toh :sessionId ki value req.params.sessionId mein milegi
        const { sessionId } = req.params;

        // ---------------------------------------------------------------------
        // STEP 2: Basic Validation
        // ---------------------------------------------------------------------
        // Session ID toh honi chahiye - bina iske details kaise layenge
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required. Kaunsi session ki details chahiye?'
            });
        }

        // ---------------------------------------------------------------------
        // STEP 3: Service Layer ko call karo
        // ---------------------------------------------------------------------
        // Service layer mein yeh sab hoga:
        // - Session exist karti hai ya nahi check
        // - Session details fetch karna (subject, location, timing, status)
        // - Faculty details populate karna
        // - QR code data include karna (if session active hai)
        // - Attendance statistics calculate karna (present/absent count, percentage)
        // - Enrolled students list fetch karna (optional)
        // - Authorization check (if needed - sensitive data ke liye)
        const sessionDetails = await sessionService.getSessionById(sessionId);

        // ---------------------------------------------------------------------
        // STEP 4: Success Response bhejo
        // ---------------------------------------------------------------------
        // 200 OK - Session details successfully mil gayi
        return res.status(200).json({
            success: true,
            message: 'Session details fetched successfully.',
            data: sessionDetails
        });

    } catch (error) {
        // ---------------------------------------------------------------------
        // ERROR HANDLING
        // ---------------------------------------------------------------------
        // Koi bhi error aaye - service se ya kahi se bhi
        // 
        // Common errors jo service se aayengi:
        // - Session not found (404)
        // - Unauthorized access (403) - if sensitive data
        // - Database errors (500)
        // 
        // Global error handler proper error response format karega
        next(error);
    }
};

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Module exports - CommonJS syntax use kar rahe hain
 * 
 * Routes file (session.routes.js) mein aise import hoga:
 * const sessionController = require('./controllers/session.controller');
 * 
 * Aur aise use hoga:
 * router.post('/', authMiddleware, sessionController.createSession);
 * router.put('/:sessionId/close', authMiddleware, sessionController.closeSession);
 * router.get('/active', sessionController.getActiveSessions);
 * router.get('/:sessionId', sessionController.getSessionById);
 */
module.exports = {
    createSession,
    closeSession,
    getActiveSessions,
    getSessionById
};

