/**
 * =============================================================================
 * SESSION SERVICE - QR-based Attendance Tracking System
 * =============================================================================
 * 
 * Yeh file Service layer ka part hai jo Clean Architecture follow karti hai.
 * Session management aur QR code generation ki saari business logic yahan hoti hai.
 * 
 * REQUEST FLOW SAMJHO:
 * ====================
 * Controller → Service (Yeh file) → Database → Service → Controller
 *                         ↑
 *                    (Business Logic)
 * 
 * SERVICE LAYER KA KAAM KYA HAI?
 * ===============================
 * 1. Session creation - QR code generation, session lifecycle management
 * 2. Session closing - Status updates, validation
 * 3. Session retrieval - Active sessions, session details
 * 4. QR code generation - Secure QR payload creation
 * 5. Authorization checks - Faculty ownership validation
 * 6. Database operations - Session CRUD operations
 * 
 * SERVICE LAYER MEIN KYA NAHI HAI?
 * =================================
 * - HTTP request/response handling (Express req/res)
 * - Routes definition
 * - Middleware logic
 * - View rendering
 * 
 * IMPORTANT NOTES ABOUT SESSIONS:
 * ===============================
 * - Session ek class/lecture ko represent karti hai
 * - Faculty member session create karta hai
 * - Har session ka ek unique QR code hota hai
 * - QR code mein sessionId, expiryTime, aur security token hota hai
 * - QR codes server-side generate hote hain - frontend pe nahi
 * - Session active/closed states mein rehti hai
 * 
 * QR CODE SECURITY:
 * ================
 * - QR codes server-side generate hote hain - client pe kabhi trust nahi karte
 * - QR token random aur unpredictable hota hai (crypto.randomBytes)
 * - QR expiry time strictly enforced hota hai server-side
 * - QR validity session status se tied hoti hai
 * 
 * =============================================================================
 */

// =============================================================================
// DEPENDENCIES IMPORT KARO
// =============================================================================

/**
 * Database Pool Import
 * MySQL connection pool database queries execute karne ke liye
 */
console.log("SESSION SERVICE LOADED");
const { pool, SESSION_STATUS, QR_EXPIRY_TIME, ROLE } = require('../config');

/**
 * crypto Module Import (Node.js Built-in)
 * Secure random token generation ke liye
 * crypto.randomBytes() cryptographically secure random bytes generate karta hai
 * Frontend pe predictable tokens generate nahi kar sakte - security risk hai
 */
const crypto = require('crypto');

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

/**
 * Custom Error Classes - Business Logic Errors
 * 
 * Kyun zaroori hain?
 * - Default Error objects generic hote hain
 * - Custom errors se specific error types identify kar sakte hain
 * - Controllers mein error type ke basis pe different handling kar sakte hain
 * - Status codes properly set ho jate hain
 */

/**
 * Session Not Found Error
 * Jab session database mein exist nahi karti
 */
class SessionNotFoundError extends Error {
    constructor(message = 'Session not found. Invalid session ID.') {
        super(message);
        this.name = 'SessionNotFoundError';
        this.statusCode = 404;
    }
}

/**
 * Session Already Closed Error
 * Jab session already closed hai aur close karna chahte hain
 */
class SessionAlreadyClosedError extends Error {
    constructor(message = 'Session is already closed. Cannot close an already closed session.') {
        super(message);
        this.name = 'SessionAlreadyClosedError';
        this.statusCode = 400;
    }
}

/**
 * Invalid Session Data Error
 * Jab session data invalid hai (invalid time, duration, etc.)
 */
class InvalidSessionDataError extends Error {
    constructor(message = 'Invalid session data. Please check your input.') {
        super(message);
        this.name = 'InvalidSessionDataError';
        this.statusCode = 400;
    }
}

/**
 * Unauthorized Faculty Error
 * Jab faculty session ka owner nahi hai ya authorized nahi hai
 */
class UnauthorizedFacultyError extends Error {
    constructor(message = 'Unauthorized. You do not have permission to perform this action.') {
        super(message);
        this.name = 'UnauthorizedFacultyError';
        this.statusCode = 403;
    }
}

/**
 * Faculty Not Found Error
 * Jab faculty database mein exist nahi karta
 */
class FacultyNotFoundError extends Error {
    constructor(message = 'Faculty not found. Invalid faculty ID.') {
        super(message);
        this.name = 'FacultyNotFoundError';
        this.statusCode = 404;
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * GENERATE UNIQUE SESSION ID
 * -----------------------------------------------------------------------------
 * 
 * Unique session identifier generate karta hai
 * Format: sess_<timestamp>_<randomString>
 * 
 * @returns {string} Unique session ID
 */
const generateSessionId = () => {
    // Timestamp use karke uniqueness ensure karte hain
    const timestamp = Date.now();
    
    // Random string generate karo extra uniqueness ke liye
    const randomString = crypto.randomBytes(4).toString('hex');
    
    // Format: sess_<timestamp>_<random>
    return `sess_${timestamp}_${randomString}`;
};

/**
 * -----------------------------------------------------------------------------
 * GENERATE SECURE QR TOKEN
 * -----------------------------------------------------------------------------
 * 
 * Cryptographically secure random token generate karta hai QR code ke liye
 * Crypto.randomBytes() use karte hain - unpredictable aur secure
 * 
 * @returns {string} Secure random token (hex format)
 */
const generateSecureQRToken = () => {
    // 32 bytes = 64 hex characters - strong enough for security
    // Random bytes generate karo - cryptographically secure
    const randomBytes = crypto.randomBytes(32);
    
    // Hex format mein convert karo - readable format
    return randomBytes.toString('hex');
};

/**
 * -----------------------------------------------------------------------------
 * GENERATE QR PAYLOAD
 * -----------------------------------------------------------------------------
 * 
 * QR code ke liye payload generate karta hai
 * Payload JSON format mein hai jo frontend pe QR code generate karne ke liye use hoga
 * 
 * QR Payload Structure:
 * {
 *   sessionId: string,
 *   expiryTime: number (timestamp),
 *   token: string (security token)
 * }
 * 
 * IMPORTANT: Payload ko encrypt kar sakte hain production mein additional security ke liye
 * 
 * @param {string} sessionId - Session ka unique ID
 * @param {number} expiryTime - QR expiry timestamp (milliseconds)
 * @param {string} qrToken - Security token
 * @returns {string} JSON stringified QR payload
 */
const generateQRPayload = (sessionId, expiryTime, qrToken) => {
    // QR payload object
    const payload = {
        sessionId: sessionId,
        expiryTime: expiryTime,
        token: qrToken
    };
    
    // JSON string mein convert karo - QR code scanner easily parse kar sakta hai
    // Frontend pe QR code generate karte waqt is string ko use karenge
    return JSON.stringify(payload);
};

/**
 * -----------------------------------------------------------------------------
 * CALCULATE SESSION END TIME
 * -----------------------------------------------------------------------------
 * 
 * Session end time calculate karta hai start time aur duration se
 * 
 * @param {Date|string|number} startTime - Session start time
 * @param {number} duration - Session duration in minutes
 * @returns {Date} Session end time
 */
const calculateEndTime = (startTime, duration) => {
    // Start time ko Date object mein convert karo
    const start = new Date(startTime);
    
    // Duration ko milliseconds mein convert karo
    // Duration minutes mein hai, milliseconds = minutes * 60 * 1000
    const durationMs = duration * 60 * 1000;
    
    // End time = start time + duration
    const endTime = new Date(start.getTime() + durationMs);
    
    return endTime;
};

/**
 * -----------------------------------------------------------------------------
 * CALCULATE QR EXPIRY TIME
 * -----------------------------------------------------------------------------
 * 
 * QR code expiry time calculate karta hai
 * QR codes limited time ke liye valid hote hain - security ke liye
 * 
 * @param {Date|string|number} startTime - Session start time
 * @returns {Date} QR expiry time
 */
const calculateQRExpiryTime = (startTime) => {
    // Start time ko Date object mein convert karo
    const start = new Date(startTime);
    
    // Current time se QR_EXPIRY_TIME add karo
    // QR codes session start se pehle bhi expire ho sakte hain agar late generate hue
    // Better approach: session start time + QR_EXPIRY_TIME
    const expiryTime = new Date(start.getTime() + QR_EXPIRY_TIME);
    
    return expiryTime;
};

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * CREATE SESSION
 * -----------------------------------------------------------------------------
 * 
 * Naya session create karta hai with QR code generation
 * 
 * BUSINESS LOGIC FLOW:
 * ====================
 * 1. Input validation (subject, location, startTime, duration)
 * 2. Faculty existence check (facultyId valid hai ya nahi)
 * 3. Time validation (startTime future mein hai ya nahi)
 * 4. Calculate session end time (startTime + duration)
 * 5. Generate unique session ID
 * 6. Generate secure QR token
 * 7. Calculate QR expiry time
 * 8. Generate QR payload
 * 9. Insert session into database
 * 10. Return session details with QR data
 * 
 * @param {number|string} facultyId - Faculty ka unique ID
 * @param {Object} sessionData - Session data object
 * @param {string} sessionData.subject - Subject name
 * @param {string} sessionData.location - Location
 * @param {Date|string|number} sessionData.startTime - Session start time
 * @param {number} sessionData.duration - Session duration in minutes
 * @returns {Promise<Object>} Created session object with QR data
 */
const createSession = async (facultyId, sessionData) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Input Validation
        // ---------------------------------------------------------------------
        const { subject, location, startTime, duration, courseId } = sessionData;
        
        // Required fields check
        if (!subject || !location || !startTime || !duration) {
            throw new InvalidSessionDataError('Subject, location, startTime, and duration are required.');
        }
        
        // Subject validation
        if (typeof subject !== 'string' || subject.trim().length === 0) {
            throw new InvalidSessionDataError('Subject must be a non-empty string.');
        }
        
        // Location validation
        if (typeof location !== 'string' || location.trim().length === 0) {
            throw new InvalidSessionDataError('Location must be a non-empty string.');
        }
        
        // Duration validation
        if (typeof duration !== 'number' || duration <= 0) {
            throw new InvalidSessionDataError('Duration must be a positive number (in minutes).');
        }
        
        // Maximum duration check (optional - prevent extremely long sessions)
        if (duration > 480) { // 8 hours max
            throw new InvalidSessionDataError('Duration cannot exceed 480 minutes (8 hours).');
        }
        
        // Start time validation
        const startTimeDate = new Date(startTime);
        if (isNaN(startTimeDate.getTime())) {
            throw new InvalidSessionDataError('Invalid start time format.');
        }
        
        // Start time future mein honi chahiye (or current time se pehle nahi honi chahiye)
        const now = new Date();
        if (startTimeDate < now) {
            // Optional: Allow past sessions for testing, but warn
            // Production mein usually future sessions allow karte hain
        }
        
        // ---------------------------------------------------------------------
        // STEP 2: Faculty Validation
        // ---------------------------------------------------------------------
        // Faculty exist karta hai ya nahi check karo
        // Faculty authorized hai ya nahi (role = faculty ya admin)
        const [faculty] = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.department, d.id AS dept_id
             FROM users u
             LEFT JOIN departments d ON d.name = u.department
             WHERE u.id = ? AND (u.role = ? OR u.role = ?)`,
            [facultyId, ROLE.FACULTY, ROLE.ADMIN]
        );
        
        if (!faculty || faculty.length === 0) {
            throw new FacultyNotFoundError('Faculty not found or not authorized to create sessions.');
        }
        
        // ---------------------------------------------------------------------
        // STEP 3: Calculate Session Times
        // ---------------------------------------------------------------------
        // Session end time calculate karo
        const endTime = calculateEndTime(startTimeDate, duration);
        
        // QR expiry time calculate karo
        const qrExpiryTime = calculateQRExpiryTime(startTimeDate);
        
        // ---------------------------------------------------------------------
        // STEP 4: Generate Session Identifiers
        // ---------------------------------------------------------------------
        // Secure QR token generate karo
        const qrToken = generateSecureQRToken();
        
        // ---------------------------------------------------------------------
        // STEP 4.5: Validate courseId belongs to this faculty (if provided)
        // Then resolve department_id — always set from faculty's department
        // ---------------------------------------------------------------------
        let resolvedCourseId = null;
        let resolvedDeptId = faculty[0].dept_id || null; // default: faculty's own dept

        if (courseId) {
            const [courseRows] = await pool.query(
                `SELECT c.id, c.department_id FROM courses c WHERE c.id = ? AND c.faculty_id = ?`,
                [courseId, facultyId]
            );
            if (!courseRows || courseRows.length === 0) {
                throw new InvalidSessionDataError('Selected course does not belong to this faculty.');
            }
            resolvedCourseId = courseRows[0].id;
            resolvedDeptId = courseRows[0].department_id;

            // Department consistency check: course's department must match faculty's department
            if (faculty[0].dept_id && resolvedDeptId &&
                Number(resolvedDeptId) !== Number(faculty[0].dept_id)) {
                throw new InvalidSessionDataError(
                    `This course belongs to a different department than yours (${faculty[0].department}). ` +
                    `You can only create sessions for courses in your own department.`
                );
            }
        }

        // ---------------------------------------------------------------------
        // STEP 5: Insert Session into Database
        // ---------------------------------------------------------------------
        // Session record database mein insert karo
        // QR token aur expiry time bhi store karte hain - validation ke liye
        // ID auto-increment hogi, so we don't provide it
        const [result] = await pool.query(
            `INSERT INTO sessions (
                faculty_id, 
                course_id,
                department_id,
                subject, 
                location, 
                status, 
                start_time, 
                end_time, 
                qr_code, 
                qr_expiry_time, 
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                facultyId,
                resolvedCourseId,
                resolvedDeptId,
                subject.trim(),
                location.trim(),
                SESSION_STATUS.ACTIVE,
                startTimeDate,
                endTime,
                qrToken,
                qrExpiryTime,
            ]
        );
        
        // Get the auto-generated session ID
        const sessionId = result.insertId;
        
        // QR payload generate karo with auto-generated session ID
        const qrPayload = generateQRPayload(
            sessionId,
            qrExpiryTime.getTime(), // Timestamp in milliseconds
            qrToken
        );
        
        // ---------------------------------------------------------------------
        // STEP 6: Fetch Created Session
        // ---------------------------------------------------------------------
        // Inserted session ko fetch karo with faculty details
        const [sessions] = await pool.query(
            `SELECT 
                s.id,
                s.faculty_id,
                s.course_id,
                s.department_id,
                s.subject,
                s.location,
                s.status,
                s.start_time,
                s.end_time,
                s.qr_code,
                s.qr_expiry_time,
                s.created_at,
                u.name as faculty_name,
                u.email as faculty_email,
                c.name as course_name,
                c.code as course_code,
                d.name as department_name,
                d.code as department_code
             FROM sessions s
             LEFT JOIN users u ON s.faculty_id = u.id
             LEFT JOIN courses c ON s.course_id = c.id
             LEFT JOIN departments d ON s.department_id = d.id
             WHERE s.id = ?`,
            [sessionId]
        );
        
        const createdSession = sessions[0];
        
        // ---------------------------------------------------------------------
        // STEP 7: Prepare Response
        // ---------------------------------------------------------------------
        // Session data aur QR payload return karo
        // QR payload frontend pe QR code generate karne ke liye use hoga
        return {
            id: createdSession.id,
            facultyId: createdSession.faculty_id,
            subject: createdSession.subject,
            location: createdSession.location,
            status: createdSession.status,
            startTime: createdSession.start_time,
            endTime: createdSession.end_time,
            qrExpiry: createdSession.qr_expiry_time,
            createdAt: createdSession.created_at,
            faculty: {
                name: createdSession.faculty_name,
                email: createdSession.faculty_email
            },
            // QR data - frontend pe QR code generate karne ke liye
            qrData: {
                payload: qrPayload, // JSON string - QR scanner directly parse kar sakta hai
                expiryTime: qrExpiryTime.getTime() // Timestamp for client-side expiry check
            }
        };
        
    } catch (error) {
        // Custom errors directly throw karo
        if (error.name && error.statusCode) {
            throw error;
        }
        
        // Generic error handle karo
        throw new Error(`Failed to create session: ${error.message}`);
    }
};

/**
 * -----------------------------------------------------------------------------
 * CLOSE SESSION
 * -----------------------------------------------------------------------------
 * 
 * Ek active session ko close karta hai
 * 
 * BUSINESS LOGIC FLOW:
 * ====================
 * 1. Session ID validation
 * 2. Session existence check
 * 3. Session status check (already closed nahi hai)
 * 4. Update session status to CLOSED
 * 5. Set end time to current timestamp
 * 6. Return updated session
 * 
 * NOTE: Authorization check optional hai - agar specific faculty ko sirf apni sessions
 * close karne ki permission deni hai, toh facultyId check karo
 * 
 * @param {string} sessionId - Session ka unique ID
 * @returns {Promise<Object>} Updated session object
 */
const closeSession = async (sessionId) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Session ID Validation
        // ---------------------------------------------------------------------
        if (!sessionId) {
            throw new InvalidSessionDataError('Session ID is required.');
        }
        
        // ---------------------------------------------------------------------
        // STEP 2: Fetch Session
        // ---------------------------------------------------------------------
        // Session exist karti hai ya nahi check karo
        const [sessions] = await pool.query(
            `SELECT id, status, end_time, faculty_id
             FROM sessions 
             WHERE id = ?`,
            [sessionId]
        );
        
        if (!sessions || sessions.length === 0) {
            throw new SessionNotFoundError();
        }
        
        const session = sessions[0];
        
        // ---------------------------------------------------------------------
        // STEP 3: Status Validation
        // ---------------------------------------------------------------------
        // Session already closed hai ya nahi check karo
        if (session.status === SESSION_STATUS.CLOSED) {
            throw new SessionAlreadyClosedError();
        }
        
        // ---------------------------------------------------------------------
        // STEP 4: Update Session Status
        // ---------------------------------------------------------------------
        // Session status ko CLOSED mein update karo
        // End time ko current timestamp set karo (agar pehle se set nahi hai)
        const currentTime = new Date();
        
        await pool.query(
            `UPDATE sessions 
             SET status = ?, end_time = ?
             WHERE id = ?`,
            [SESSION_STATUS.CLOSED, currentTime, sessionId]
        );
        
        // ---------------------------------------------------------------------
        // STEP 5: Fetch Updated Session
        // ---------------------------------------------------------------------
        // Updated session ko fetch karo with complete details
        const [updatedSessions] = await pool.query(
            `SELECT 
                s.id,
                s.faculty_id,
                s.subject,
                s.location,
                s.status,
                s.start_time,
                s.end_time,
                s.created_at,
                u.name as faculty_name,
                u.email as faculty_email
             FROM sessions s
             LEFT JOIN users u ON s.faculty_id = u.id
             WHERE s.id = ?`,
            [sessionId]
        );
        
        const updatedSession = updatedSessions[0];
        
        // ---------------------------------------------------------------------
        // STEP 6: Prepare Response
        // ---------------------------------------------------------------------
        return {
            id: updatedSession.id,
            facultyId: updatedSession.faculty_id,
            subject: updatedSession.subject,
            location: updatedSession.location,
            status: updatedSession.status,
            startTime: updatedSession.start_time,
            endTime: updatedSession.end_time,
            createdAt: updatedSession.created_at,
            faculty: {
                name: updatedSession.faculty_name,
                email: updatedSession.faculty_email
            }
        };
        
    } catch (error) {
        // Custom errors directly throw karo
        if (error.name && error.statusCode) {
            throw error;
        }
        
        // Generic error handle karo
        throw new Error(`Failed to close session: ${error.message}`);
    }
};

/**
 * -----------------------------------------------------------------------------
 * GET ACTIVE SESSIONS
 * -----------------------------------------------------------------------------
 * 
 * Currently active sessions ki list fetch karta hai
 * 
 * BUSINESS LOGIC FLOW:
 * ====================
 * 1. Filters validate karo
 * 2. Authorization-based filtering (optional - faculty ko sirf apni sessions)
 * 3. Query build karo with filters
 * 4. Active sessions fetch karo
 * 5. Return formatted list
 * 
 * @param {Object} filters - Optional filters object
 * @param {string} filters.facultyId - Filter by faculty ID (optional)
 * @param {string} filters.subject - Filter by subject (optional)
 * @param {string} filters.location - Filter by location (optional)
 * @param {Object} userContext - User context for authorization (optional)
 * @param {number|string} userContext.userId - Logged-in user ID
 * @param {string} userContext.userRole - Logged-in user role
 * @returns {Promise<Array>} Active sessions array
 */
const getActiveSessions = async (filters = {}, userContext = {}) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Build Query with Filters
        // ---------------------------------------------------------------------
        // Base query - active sessions fetch karo
        let query = `
            SELECT 
                s.id,
                s.faculty_id,
                s.course_id,
                s.department_id,
                s.subject,
                s.location,
                s.status,
                s.start_time,
                s.end_time,
                s.qr_expiry_time,
                s.created_at,
                u.name as faculty_name,
                u.email as faculty_email,
                c.name as course_name,
                c.code as course_code,
                d.name as department_name,
                d.code as department_code
            FROM sessions s
            LEFT JOIN users u ON s.faculty_id = u.id
            LEFT JOIN courses c ON s.course_id = c.id
            LEFT JOIN departments d ON s.department_id = d.id
            WHERE s.status = ?
        `;
        
        const queryParams = [SESSION_STATUS.ACTIVE];
        
        // Faculty filter
        if (filters.facultyId) {
            query += ` AND s.faculty_id = ?`;
            queryParams.push(filters.facultyId);
        }
        
        // Subject filter (case-insensitive partial match)
        if (filters.subject) {
            query += ` AND s.subject LIKE ?`;
            queryParams.push(`%${filters.subject}%`);
        }
        
        // Location filter (case-insensitive partial match)
        if (filters.location) {
            query += ` AND s.location LIKE ?`;
            queryParams.push(`%${filters.location}%`);
        }
        
        // ---------------------------------------------------------------------
        // STEP 2: Authorization-Based Filtering
        // ---------------------------------------------------------------------
        // Agar user context diya hai, toh authorization check karo
        // Faculty ko sirf apni sessions dikhayi jayengi (unless admin)
        if (userContext.userId && userContext.userRole) {
            // Agar admin hai, toh sab sessions dikhayi jayengi
            if (userContext.userRole === ROLE.ADMIN) {
                // Admin ko sab dikhayi jayengi - koi filter nahi
            }
            // Agar faculty hai aur facultyId filter nahi diya
            else if (userContext.userRole === ROLE.FACULTY && !filters.facultyId) {
                // Faculty ko sirf apni sessions dikhayi jayengi
                query += ` AND s.faculty_id = ?`;
                queryParams.push(userContext.userId);
            }
            // Students ko sab active sessions dikhayi jayengi (attendance mark karne ke liye)
        }
        
        // Order by start_time DESC - latest sessions pehle
        query += ` ORDER BY s.start_time DESC`;
        
        // ---------------------------------------------------------------------
        // STEP 3: Execute Query
        // ---------------------------------------------------------------------
        const [sessions] = await pool.query(query, queryParams);
        
        // ---------------------------------------------------------------------
        // STEP 4: Format Response
        // ---------------------------------------------------------------------
        // Sessions ko formatted format mein return karo
        return sessions.map(session => ({
            id: session.id,
            facultyId: session.faculty_id,
            courseId: session.course_id,
            departmentId: session.department_id,
            subject: session.subject,
            location: session.location,
            status: session.status,
            startTime: session.start_time,
            endTime: session.end_time,
            qrExpiry: session.qr_expiry_time,
            createdAt: session.created_at,
            faculty: {
                name: session.faculty_name,
                email: session.faculty_email
            },
            course: {
                name: session.course_name,
                code: session.course_code
            },
            department: {
                name: session.department_name,
                code: session.department_code
            }
        }));
        
    } catch (error) {
        // Generic error handle karo
        throw new Error(`Failed to fetch active sessions: ${error.message}`);
    }
};

/**
 * -----------------------------------------------------------------------------
 * GET SESSION BY ID
 * -----------------------------------------------------------------------------
 * 
 * Ek specific session ki complete details fetch karta hai
 * 
 * BUSINESS LOGIC FLOW:
 * ====================
 * 1. Session ID validation
 * 2. Session fetch karo with all details
 * 3. Attendance statistics calculate karo (optional)
 * 4. Return complete session object
 * 
 * @param {string} sessionId - Session ka unique ID
 * @returns {Promise<Object>} Complete session object with details
 */
const getSessionById = async (sessionId) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Session ID Validation
        // ---------------------------------------------------------------------
        if (!sessionId) {
            throw new InvalidSessionDataError('Session ID is required.');
        }
        
        // ---------------------------------------------------------------------
        // STEP 2: Fetch Session Details
        // ---------------------------------------------------------------------
        // Session ko complete details ke saath fetch karo
        const [sessions] = await pool.query(
            `SELECT 
                s.id,
                s.faculty_id,
                s.course_id,
                s.department_id,
                s.subject,
                s.location,
                s.status,
                s.start_time,
                s.end_time,
                s.qr_expiry_time,
                s.qr_code,
                s.created_at,
                u.name as faculty_name,
                u.email as faculty_email,
                c.name as course_name,
                c.code as course_code,
                d.name as department_name,
                d.code as department_code
             FROM sessions s
             LEFT JOIN users u ON s.faculty_id = u.id
             LEFT JOIN courses c ON s.course_id = c.id
             LEFT JOIN departments d ON s.department_id = d.id
             WHERE s.id = ?`,
            [sessionId]
        );
        
        if (!sessions || sessions.length === 0) {
            throw new SessionNotFoundError();
        }
        
        const session = sessions[0];
        
        // ---------------------------------------------------------------------
        // STEP 3: Calculate Attendance Statistics (Optional)
        // ---------------------------------------------------------------------
        // Session ki attendance statistics calculate karo
        // Total students, present count, etc.
        const [attendanceStats] = await pool.query(
            `SELECT 
                COUNT(*) as total_attendance,
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count
             FROM attendance
             WHERE session_id = ?`,
            [sessionId]
        );
        
        const stats = attendanceStats[0] || {
            total_attendance: 0,
            present_count: 0,
            late_count: 0
        };
        
        // ---------------------------------------------------------------------
        // STEP 4: Prepare Response
        // ---------------------------------------------------------------------
        // Complete session object return karo
        return {
            id: session.id,
            facultyId: session.faculty_id,
            courseId: session.course_id,
            departmentId: session.department_id,
            subject: session.subject,
            location: session.location,
            status: session.status,
            startTime: session.start_time,
            endTime: session.end_time,
            qrExpiry: session.qr_expiry_time,
            createdAt: session.created_at,
            faculty: {
                name: session.faculty_name,
                email: session.faculty_email
            },
            course: {
                name: session.course_name,
                code: session.course_code
            },
            department: {
                name: session.department_name,
                code: session.department_code
            },
            // QR data - agar session active hai toh QR payload bhi de sakte hain
            // Security: QR token expose nahi karte - sirf expiry time
            qrInfo: {
                expiryTime: session.qr_expiry_time ? new Date(session.qr_expiry_time).getTime() : null,
                isValid: session.status === SESSION_STATUS.ACTIVE && 
                         session.qr_expiry_time && 
                         new Date(session.qr_expiry_time) > new Date()
            },
            // Attendance statistics
            attendance: {
                total: stats.total_attendance,
                present: stats.present_count,
                late: stats.late_count
            }
        };
        
    } catch (error) {
        // Custom errors directly throw karo
        if (error.name && error.statusCode) {
            throw error;
        }
        
        // Generic error handle karo
        throw new Error(`Failed to fetch session: ${error.message}`);
    }
};

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Module exports - CommonJS syntax
 * 
 * Controllers mein aise import hoga:
 * const sessionService = require('../services/session.service');
 * 
 * Usage:
 * await sessionService.createSession(facultyId, sessionData);
 * await sessionService.closeSession(sessionId);
 * await sessionService.getActiveSessions(filters, userContext);
 * await sessionService.getSessionById(sessionId);
 */
module.exports = {
    createSession,
    closeSession,
    getActiveSessions,
    getSessionById
};

