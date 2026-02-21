/**
 * =============================================================================
 * ATTENDANCE SERVICE - QR-based Attendance Tracking System
 * =============================================================================
 * 
 * Yeh file Service layer ka part hai jo Clean Architecture follow karti hai.
 * Saari business logic yahan hoti hai - controllers sirf request/response handle karte hain.
 * 
 * REQUEST FLOW SAMJHO:
 * ====================
 * Controller → Service (Yeh file) → Database → Service → Controller
 *                         ↑
 *                    (Business Logic)
 * 
 * SERVICE LAYER KA KAAM KYA HAI?
 * ===============================
 * 1. Business logic implement karna (QR validation, duplicate checks, status calculation)
 * 2. Database queries execute karna
 * 3. Data validation aur security checks
 * 4. Error handling (custom errors throw karna)
 * 5. Data transformation (raw DB data ko formatted objects mein convert)
 * 
 * SERVICE LAYER MEIN KYA NAHI HAI?
 * =================================
 * - HTTP request/response handling (Express req/res)
 * - Routes definition
 * - Middleware logic
 * - View rendering
 * 
 * IMPORTANT NOTES:
 * ================
 * - Service functions pure functions hain - Express se independent
 * - Service functions async hain kyunki database operations async hote hain
 * - Error handling: Custom errors throw karte hain, controllers catch karenge
 * - Database queries: MySQL pool use karte hain
 * - QR Security: QR code decode, expiry validation, session validation
 * 
 * =============================================================================
 */

// =============================================================================
// DEPENDENCIES IMPORT KARO
// =============================================================================

/**
 * Database Pool Import
 * MySQL connection pool database queries execute karne ke liye
 * Pool se connection borrow karte hain, query execute karte hain, phir release
 */
console.log("ATTENDANCE SERVICE LOADED");
const { pool, ATTENDANCE_STATUS, SESSION_STATUS, QR_EXPIRY_TIME } = require('../config');

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

/**
 * Custom Error Classes - Business Logic Errors
 * 
 * Kyun zaroori hain?
 * - Default Error objects generic hote hain
 * - Custom errors se specific error types identify kar sakte hain
 * - Error messages aur status codes consistent rehte hain
 * - Controllers mein error type ke basis pe different handling kar sakte hain
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
 * Session Not Active Error
 * Jab session closed ho chuki hai ya active nahi hai
 */
class SessionNotActiveError extends Error {
    constructor(message = 'Session is not active. Cannot mark attendance for closed session.') {
        super(message);
        this.name = 'SessionNotActiveError';
        this.statusCode = 400;
    }
}

/**
 * QR Code Expired Error
 * Jab QR code expiry time cross ho chuka hai
 */
class QRCodeExpiredError extends Error {
    constructor(message = 'QR code has expired. Please scan a fresh QR code.') {
        super(message);
        this.name = 'QRCodeExpiredError';
        this.statusCode = 400;
    }
}

/**
 * Invalid QR Code Error
 * Jab QR code decode nahi ho sakta ya invalid format hai
 */
class InvalidQRCodeError extends Error {
    constructor(message = 'Invalid QR code. QR code could not be decoded.') {
        super(message);
        this.name = 'InvalidQRCodeError';
        this.statusCode = 400;
    }
}

/**
 * Duplicate Attendance Error
 * Jab student already attendance mark kar chuka hai
 */
class DuplicateAttendanceError extends Error {
    constructor(message = 'Attendance already marked. Cannot mark attendance twice for the same session.') {
        super(message);
        this.name = 'DuplicateAttendanceError';
        this.statusCode = 409; // Conflict
    }
}

/**
 * Student Not Found Error
 * Jab student database mein exist nahi karta
 */
class StudentNotFoundError extends Error {
    constructor(message = 'Student not found. Invalid student ID.') {
        super(message);
        this.name = 'StudentNotFoundError';
        this.statusCode = 404;
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * DECODE QR DATA
 * -----------------------------------------------------------------------------
 * 
 * QR code data ko decode karta hai
 * QR code mein sessionId, timestamp, expiry time encoded/encrypted hota hai
 * 
 * Current Implementation: Simple JSON decode (for demo)
 * Production mein encrypted QR codes use kar sakte hain (JWT tokens, etc.)
 * 
 * @param {string} qrData - Encoded QR code data from client
 * @returns {Object} Decoded QR data { sessionId, timestamp, expiryTime }
 */
const decodeQRData = (qrData) => {
    try {
        // Simple JSON decode (agar QR code JSON format mein hai)
        // Production mein encrypted QR codes ke liye JWT decode ya crypto use kare
        const decoded = JSON.parse(qrData);
        
        // Validate decoded data structure
        if (!decoded.sessionId || !decoded.timestamp) {
            throw new InvalidQRCodeError('QR code missing required fields.');
        }
        
        return decoded;
    } catch (error) {
        // Agar decode nahi ho sakta toh invalid QR code
        if (error instanceof InvalidQRCodeError) {
            throw error;
        }
        throw new InvalidQRCodeError('Failed to decode QR code data.');
    }
};

/**
 * -----------------------------------------------------------------------------
 * VALIDATE QR EXPIRY
 * -----------------------------------------------------------------------------
 * 
 * QR code ka expiry time check karta hai
 * QR codes limited time ke liye valid hote hain security ke liye
 * 
 * @param {number} expiryTime - QR code expiry timestamp (milliseconds)
 * @param {number} scanTime - Current scan timestamp (milliseconds)
 */
const validateQRExpiry = (expiryTime, scanTime) => {
    // QR code expiry check
    // Agar expiryTime scanTime se pehle hai, matlab QR expire ho chuka hai
    if (expiryTime < scanTime) {
        throw new QRCodeExpiredError();
    }
    
    // Optional: Server time vs client time validation
    // Agar client timestamp bahut zyada different hai server se, toh suspicious
    const serverTime = Date.now();
    const timeDifference = Math.abs(scanTime - serverTime);
    
    // Agar 5 minutes se zyada difference hai, toh warning (timezone issue ho sakta hai)
    // But strict validation nahi kar rahe kyunki client timezone different ho sakta hai
    // Production mein iska better handling chahiye
};

/**
 * -----------------------------------------------------------------------------
 * DETERMINE ATTENDANCE STATUS
 * -----------------------------------------------------------------------------
 * 
 * Student ka attendance status determine karta hai
 * PRESENT: Time pe attendance mark ki
 * LATE: Session start time ke baad attendance mark ki
 * 
 * @param {Date} sessionStartTime - Session ka start time
 * @param {Date} scanTime - QR scan ka time
 * @param {number} lateThresholdMinutes - Late consider karne ke liye threshold (default: 15 minutes)
 * @returns {string} Attendance status (ATTENDANCE_STATUS.PRESENT or ATTENDANCE_STATUS.LATE)
 */
const determineAttendanceStatus = (sessionStartTime, scanTime, lateThresholdMinutes = 15) => {
    // Convert to Date objects agar strings hain
    const startTime = new Date(sessionStartTime);
    const markedTime = new Date(scanTime);
    
    // Calculate time difference in minutes
    const timeDifferenceMs = markedTime - startTime;
    const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);
    
    // Agar scan time start time se pehle hai (rare case - timezone issue)
    // Toh PRESENT consider karte hain (defensive programming)
    if (timeDifferenceMinutes < 0) {
        return ATTENDANCE_STATUS.PRESENT;
    }
    
    // Agar late threshold se zyada late hai, toh LATE
    // Otherwise PRESENT
    if (timeDifferenceMinutes > lateThresholdMinutes) {
        return ATTENDANCE_STATUS.LATE;
    }
    
    return ATTENDANCE_STATUS.PRESENT;
};

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * MARK ATTENDANCE
 * -----------------------------------------------------------------------------
 * 
 * Student ki attendance mark karta hai QR code scan ke basis pe
 * 
 * BUSINESS LOGIC FLOW:
 * ====================
 * 1. QR code data decode karo
 * 2. QR code expiry validate karo
 * 3. Session exist karti hai ya nahi check karo
 * 4. Session active hai ya nahi check karo
 * 5. Student exist karta hai ya nahi check karo
 * 6. Duplicate attendance check karo
 * 7. Attendance status determine karo (PRESENT/LATE)
 * 8. Database mein attendance record insert karo
 * 9. Created record return karo
 * 
 * @param {number|string} studentId - Student ka unique ID
 * @param {number|string} sessionId - Session ka unique ID (from QR code validation)
 * @param {string} qrData - Encoded QR code data from client
 * @param {number} timestamp - Client scan timestamp (milliseconds)
 * @returns {Promise<Object>} Created attendance record
 */
const markAttendance = async (studentId, sessionId, qrData, timestamp) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: QR Code Decode aur Validation (optional)
        // ---------------------------------------------------------------------
        // Agar qrData provided hai aur valid JSON session payload hai, validate karo
        // Agar nahi hai (qr-request UUID system), skip karo - request system ne validate kar liya
        if (qrData) {
            try {
                const decodedQR = decodeQRData(qrData);
                if (decodedQR && decodedQR.sessionId !== undefined && decodedQR.sessionId != sessionId) {
                    throw new InvalidQRCodeError('QR code session ID does not match request session ID.');
                }
                if (decodedQR && decodedQR.expiryTime && timestamp) {
                    validateQRExpiry(decodedQR.expiryTime, timestamp);
                }
            } catch (qrError) {
                // Re-throw only critical errors (session mismatch, expired)
                if (qrError instanceof QRCodeExpiredError ||
                    (qrError instanceof InvalidQRCodeError && qrError.message.includes('does not match'))) {
                    throw qrError;
                }
                // UUID-format or undecodable QR - qr-request system validated it already, continue
            }
        }
        
        // ---------------------------------------------------------------------
        // STEP 2: Session Validation
        // ---------------------------------------------------------------------
        // Session exist karti hai ya nahi check karo
        // Session details fetch karni hai - status, start_time, end_time check karne ke liye
        const [sessions] = await pool.query(
            `SELECT id, status, start_time, end_time, faculty_id, subject, location, course_id
             FROM sessions 
             WHERE id = ?`,
            [sessionId]
        );
        
        // Session nahi mili toh error
        if (!sessions || sessions.length === 0) {
            throw new SessionNotFoundError();
        }
        
        const session = sessions[0];
        
        // Session active hai ya nahi check karo
        // Closed sessions mein attendance mark nahi kar sakte
        if (session.status !== SESSION_STATUS.ACTIVE) {
            throw new SessionNotActiveError(`Session status is '${session.status}'. Only active sessions accept attendance.`);
        }
        
        // Optional: Session time window validation
        // Agar scan time session start_time se pehle hai ya end_time ke baad hai
        // Toh error throw kar sakte hain (but currently allow kar rahe hain kyunki faculty control karta hai)
        
        // ---------------------------------------------------------------------
        // STEP 3: Student Validation
        // ---------------------------------------------------------------------
        // Student exist karta hai ya nahi check karo
        // Database query se student verify karo
        const [students] = await pool.query(
            `SELECT id, name, student_id, email
             FROM users 
             WHERE id = ? AND role = 'student'`,
            [studentId]
        );
        
        // Student nahi mila toh error
        if (!students || students.length === 0) {
            throw new StudentNotFoundError();
        }
        
        // ---------------------------------------------------------------------
        // STEP 4: Duplicate Attendance Check
        // ---------------------------------------------------------------------
        // Same student, same session ki pehle se attendance hai ya nahi check karo
        // Duplicate attendance prevent karna zaroori hai - cheating prevent ke liye
        const [existingAttendance] = await pool.query(
            `SELECT id, status, marked_at
             FROM attendance 
             WHERE student_id = ? AND session_id = ?`,
            [studentId, sessionId]
        );
        
        // Agar pehle se attendance marked hai, toh error
        if (existingAttendance && existingAttendance.length > 0) {
            throw new DuplicateAttendanceError(
                `Attendance already marked at ${new Date(existingAttendance[0].marked_at).toLocaleString()}.`
            );
        }
        
        // ---------------------------------------------------------------------
        // STEP 4.5: Course Enrollment Check
        // ---------------------------------------------------------------------
        // Agar session ke saath course linked hai, toh student ka enrollment verify karo
        // Only enrolled students of that course can mark attendance
        if (session.course_id) {
            const [enrollment] = await pool.query(
                `SELECT ce.id FROM course_enrollment ce
                 WHERE ce.course_id = ? AND ce.student_id = ? AND ce.status = 'active'`,
                [session.course_id, studentId]
            );
            if (!enrollment || enrollment.length === 0) {
                throw new Error('You are not enrolled in this course. Attendance cannot be marked.');
            }
        }
        
        // ---------------------------------------------------------------------
        // STEP 5: Determine Attendance Status
        // ---------------------------------------------------------------------
        // Attendance status calculate karo - PRESENT ya LATE
        // Session start time aur scan time compare karke status decide karo
        const attendanceStatus = determineAttendanceStatus(
            session.start_time,
            timestamp,
            15 // Late threshold: 15 minutes (configurable)
        );
        
        // ---------------------------------------------------------------------
        // STEP 6: Insert Attendance Record
        // ---------------------------------------------------------------------
        // Database mein attendance record insert karo
        // marked_at field mein scan timestamp use kare (client timestamp)
        const [result] = await pool.query(
            `INSERT INTO attendance (student_id, session_id, status, marked_at, created_at)
             VALUES (?, ?, ?, FROM_UNIXTIME(?/1000), NOW())`,
            [studentId, sessionId, attendanceStatus, timestamp]
        );
        
        // Inserted record ka ID mil gaya
        const attendanceId = result.insertId;
        
        // ---------------------------------------------------------------------
        // STEP 7: Fetch Complete Record
        // ---------------------------------------------------------------------
        // Inserted record ko student details ke saath fetch karo
        // Frontend ko complete data chahiye
        const [attendanceRecords] = await pool.query(
            `SELECT 
                a.id,
                a.student_id,
                a.session_id,
                a.status,
                a.marked_at,
                a.created_at,
                u.name as student_name,
                u.student_id as student_roll_no,
                u.email as student_email,
                s.subject,
                s.location,
                s.start_time as session_start_time
             FROM attendance a
             INNER JOIN users u ON a.student_id = u.id
             INNER JOIN sessions s ON a.session_id = s.id
             WHERE a.id = ?`,
            [attendanceId]
        );
        
        // Record return karo
        return attendanceRecords[0];
        
    } catch (error) {
        // Agar custom error hai (SessionNotFoundError, etc.), toh directly throw karo
        // Custom errors already proper format mein hain
        if (error.name && error.statusCode) {
            throw error;
        }
        
        // Agar database error hai ya koi aur unexpected error
        // Toh generic error throw karo with details
        // Controllers global error handler ko pass kar denge
        throw new Error(`Failed to mark attendance: ${error.message}`);
    }
};

/**
 * -----------------------------------------------------------------------------
 * GET ATTENDANCE BY SESSION
 * -----------------------------------------------------------------------------
 * 
 * Ek particular session ki saari attendance records fetch karta hai
 * 
 * BUSINESS LOGIC:
 * ===============
 * 1. Session exist karti hai ya nahi validate karo
 * 2. Session ki saari attendance records fetch karo
 * 3. Student details join karo (name, student_id, email)
 * 4. Data ko formatted object mein return karo
 * 
 * @param {number|string} sessionId - Session ka unique ID
 * @returns {Promise<Array>} Attendance records array with student details
 */
const getAttendanceBySession = async (sessionId) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Session Validation
        // ---------------------------------------------------------------------
        // Session exist karti hai ya nahi check karo
        // Error throw karna better hai agar session nahi mili
        const [sessions] = await pool.query(
            `SELECT id, subject, location, start_time, status
             FROM sessions 
             WHERE id = ?`,
            [sessionId]
        );
        
        if (!sessions || sessions.length === 0) {
            throw new SessionNotFoundError();
        }
        
        // ---------------------------------------------------------------------
        // STEP 2: Fetch Attendance Records
        // ---------------------------------------------------------------------
        // Session ki saari attendance records fetch karo
        // Student details bhi join karo - name, student_id, email
        // ORDER BY marked_at DESC - latest attendance pehle
        const [attendanceRecords] = await pool.query(
            `SELECT 
                a.id,
                a.student_id,
                a.session_id,
                a.status,
                a.marked_at,
                a.created_at,
                u.name as student_name,
                u.student_id as student_roll_no,
                u.email as student_email
             FROM attendance a
             INNER JOIN users u ON a.student_id = u.id
             WHERE a.session_id = ?
             ORDER BY a.marked_at DESC`,
            [sessionId]
        );
        
        // ---------------------------------------------------------------------
        // STEP 3: Format and Return
        // ---------------------------------------------------------------------
        // Records ko formatted format mein return karo
        // Agar koi attendance nahi mili, toh empty array return karo (error nahi)
        return attendanceRecords || [];
        
    } catch (error) {
        // Custom errors directly throw karo
        if (error.name && error.statusCode) {
            throw error;
        }
        
        // Generic error handle karo
        throw new Error(`Failed to fetch attendance by session: ${error.message}`);
    }
};

/**
 * -----------------------------------------------------------------------------
 * GET ATTENDANCE BY STUDENT
 * -----------------------------------------------------------------------------
 * 
 * Ek particular student ki saari attendance history fetch karta hai
 * 
 * BUSINESS LOGIC:
 * ===============
 * 1. Student exist karta hai ya nahi validate karo
 * 2. Optional filters apply karo (sessionId, startDate, endDate)
 * 3. Attendance records fetch karo with session details
 * 4. Data ko formatted format mein return karo
 * 
 * @param {number|string} studentId - Student ka unique ID
 * @param {Object} filters - Optional filters object
 * @param {string} filters.sessionId - Specific session filter (optional)
 * @param {string} filters.startDate - Date range start (optional, ISO format)
 * @param {string} filters.endDate - Date range end (optional, ISO format)
 * @returns {Promise<Array>} Student attendance history array
 */
const getAttendanceByStudent = async (studentId, filters = {}) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Student Validation
        // ---------------------------------------------------------------------
        // Student exist karta hai ya nahi check karo
        const [students] = await pool.query(
            `SELECT id, name, student_id, email
             FROM users 
             WHERE id = ? AND role = 'student'`,
            [studentId]
        );
        
        if (!students || students.length === 0) {
            throw new StudentNotFoundError();
        }
        
        // ---------------------------------------------------------------------
        // STEP 2: Build Query with Filters
        // ---------------------------------------------------------------------
        // Base query - attendance records with session details
        let query = `
            SELECT 
                a.id,
                a.student_id,
                a.session_id,
                a.status,
                a.marked_at,
                a.created_at,
                s.subject,
                s.location,
                s.start_time as session_start_time,
                s.end_time as session_end_time,
                s.status as session_status,
                u.name as faculty_name
            FROM attendance a
            INNER JOIN sessions s ON a.session_id = s.id
            LEFT JOIN users u ON s.faculty_id = u.id
            WHERE a.student_id = ?
        `;
        
        const queryParams = [studentId];
        
        // Optional: Session filter
        if (filters.sessionId) {
            query += ` AND a.session_id = ?`;
            queryParams.push(filters.sessionId);
        }
        
        // Optional: Date range filters
        if (filters.startDate) {
            query += ` AND DATE(a.marked_at) >= ?`;
            queryParams.push(filters.startDate);
        }
        
        if (filters.endDate) {
            query += ` AND DATE(a.marked_at) <= ?`;
            queryParams.push(filters.endDate);
        }
        
        // Order by marked_at DESC - latest attendance pehle
        query += ` ORDER BY a.marked_at DESC`;
        
        // ---------------------------------------------------------------------
        // STEP 3: Execute Query
        // ---------------------------------------------------------------------
        const [attendanceRecords] = await pool.query(query, queryParams);
        
        // ---------------------------------------------------------------------
        // STEP 4: Format and Return
        // ---------------------------------------------------------------------
        // Records return karo
        // Agar koi attendance nahi mili, toh empty array return karo
        return attendanceRecords || [];
        
    } catch (error) {
        // Custom errors directly throw karo
        if (error.name && error.statusCode) {
            throw error;
        }
        
        // Generic error handle karo
        throw new Error(`Failed to fetch attendance by student: ${error.message}`);
    }
};

/**
 * -----------------------------------------------------------------------------
 * GET ATTENDANCE REPORT
 * -----------------------------------------------------------------------------
 * 
 * Ek session ka detailed attendance report generate karta hai
 * 
 * BUSINESS LOGIC:
 * ===============
 * 1. Session details fetch karo
 * 2. Total enrolled students count karo (assume all students enrolled)
 * 3. Marked attendance count karo (present + late)
 * 4. Attendance statistics calculate karo:
 *    - Total students
 *    - Present count
 *    - Late count
 *    - Absent count (total - marked)
 *    - Attendance percentage
 * 5. Student-wise attendance list generate karo
 * 
 * NOTE: Report format (CSV/PDF) handling yahan nahi hai
 * Report data object return karo, formatting controllers mein ho sakta hai
 * 
 * @param {number|string} sessionId - Session ka unique ID
 * @param {string} format - Report format ('json', 'csv', 'pdf') - currently only 'json' supported
 * @returns {Promise<Object>} Attendance report object
 */
const getAttendanceReport = async (sessionId, format = 'json') => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Session Details Fetch
        // ---------------------------------------------------------------------
        // Session ki complete details fetch karo
        const [sessions] = await pool.query(
            `SELECT 
                s.id,
                s.subject,
                s.location,
                s.start_time,
                s.end_time,
                s.status,
                s.created_at,
                u.name as faculty_name,
                u.email as faculty_email
             FROM sessions s
             LEFT JOIN users u ON s.faculty_id = u.id
             WHERE s.id = ?`,
            [sessionId]
        );
        
        if (!sessions || sessions.length === 0) {
            throw new SessionNotFoundError();
        }
        
        const session = sessions[0];
        
        // ---------------------------------------------------------------------
        // STEP 2: Total Students Count
        // ---------------------------------------------------------------------
        // Total enrolled students count
        // Assumption: Saare students enrolled hain (production mein enrollment table hoga)
        const [studentCountResult] = await pool.query(
            `SELECT COUNT(*) as total_students
             FROM users
             WHERE role = 'student'`
        );
        
        const totalStudents = studentCountResult[0]?.total_students || 0;
        
        // ---------------------------------------------------------------------
        // STEP 3: Attendance Statistics
        // ---------------------------------------------------------------------
        // Marked attendance count by status
        const [attendanceStats] = await pool.query(
            `SELECT 
                status,
                COUNT(*) as count
             FROM attendance
             WHERE session_id = ?
             GROUP BY status`,
            [sessionId]
        );
        
        // Statistics calculate karo
        let presentCount = 0;
        let lateCount = 0;
        
        attendanceStats.forEach(stat => {
            if (stat.status === ATTENDANCE_STATUS.PRESENT) {
                presentCount = stat.count;
            } else if (stat.status === ATTENDANCE_STATUS.LATE) {
                lateCount = stat.count;
            }
        });
        
        const markedCount = presentCount + lateCount;
        const absentCount = totalStudents - markedCount;
        const attendancePercentage = totalStudents > 0 
            ? ((markedCount / totalStudents) * 100).toFixed(2) 
            : 0;
        
        // ---------------------------------------------------------------------
        // STEP 4: Student-wise Attendance List
        // ---------------------------------------------------------------------
        // All students ki list with attendance status
        const [studentAttendanceList] = await pool.query(
            `SELECT 
                u.id as student_id,
                u.name as student_name,
                u.student_id as student_roll_no,
                u.email as student_email,
                COALESCE(a.status, ?) as attendance_status,
                a.marked_at as attendance_marked_at
             FROM users u
             LEFT JOIN attendance a ON u.id = a.student_id AND a.session_id = ?
             WHERE u.role = 'student'
             ORDER BY u.roll_no ASC`,
            [ATTENDANCE_STATUS.ABSENT, sessionId]
        );
        
        // ---------------------------------------------------------------------
        // STEP 5: Build Report Object
        // ---------------------------------------------------------------------
        const report = {
            session: {
                id: session.id,
                subject: session.subject,
                location: session.location,
                startTime: session.start_time,
                endTime: session.end_time,
                status: session.status,
                createdAt: session.created_at,
                faculty: {
                    name: session.faculty_name,
                    email: session.faculty_email
                }
            },
            statistics: {
                totalStudents: totalStudents,
                present: presentCount,
                late: lateCount,
                absent: absentCount,
                marked: markedCount,
                attendancePercentage: parseFloat(attendancePercentage)
            },
            studentAttendance: studentAttendanceList,
            generatedAt: new Date().toISOString()
        };
        
        // ---------------------------------------------------------------------
        // STEP 6: Format Handling (Future: CSV/PDF support)
        // ---------------------------------------------------------------------
        // Currently only JSON format support
        // CSV/PDF formatting controllers ya separate utility functions mein ho sakta hai
        if (format === 'csv') {
            // CSV generation logic (future implementation)
            // Currently return JSON data - controller will handle CSV conversion
            return report;
        }
        
        if (format === 'pdf') {
            // PDF generation logic (future implementation)
            // Currently return JSON data - controller will handle PDF conversion
            return report;
        }
        
        // Default: JSON format
        return report;
        
    } catch (error) {
        // Custom errors directly throw karo
        if (error.name && error.statusCode) {
            throw error;
        }
        
        // Generic error handle karo
        throw new Error(`Failed to generate attendance report: ${error.message}`);
    }
};

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Module exports - CommonJS syntax
 * 
 * Controllers mein aise import hoga:
 * const attendanceService = require('../services/attendance.service');
 * 
 * Usage:
 * await attendanceService.markAttendance(studentId, sessionId, qrData, timestamp);
 * await attendanceService.getAttendanceBySession(sessionId);
 * await attendanceService.getAttendanceByStudent(studentId, filters);
 * await attendanceService.getAttendanceReport(sessionId, format);
 */
module.exports = {
    markAttendance,
    getAttendanceBySession,
    getAttendanceByStudent,
    getAttendanceReport
};

