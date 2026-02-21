/**
 * =============================================================================
 * ATTENDANCE CONTROLLER - QR-based Attendance Tracking System
 * =============================================================================
 * 
 * Yeh file Controller layer ka part hai jo Clean Architecture follow karti hai.
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
 * - Business logic (jaise QR validation, duplicate attendance check)
 * - Database queries (SELECT, INSERT, UPDATE, DELETE)
 * - Complex calculations ya data transformations
 * 
 * Yeh sab Service layer mein hoga kyunki:
 * - Separation of Concerns maintain hoti hai
 * - Code reusable banta hai
 * - Testing easy ho jati hai
 * - Controller thin/lightweight rehta hai
 * 
 * =============================================================================
 */

// =============================================================================
// DEPENDENCIES IMPORT KARO
// =============================================================================

/**
 * Attendance Service ko import kar rahe hain
 * Saari business logic aur database operations isi service mein honge
 * Controller sirf isko call karega, khud kuch nahi karega
 * 
 */
console.log("ATTENDANCE CONTROLLER LOADED");
const attendanceService = require('../services/attendance.service');

// =============================================================================
// CONTROLLER FUNCTIONS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * MARK ATTENDANCE CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: POST /api/attendance/mark
 * 
 * Kya karta hai yeh function?
 * - Student ki attendance mark karne ke liye use hota hai
 * - Student apna QR code scan karega, uska data yahan aayega
 * - Controller sirf data extract karke service ko de dega
 * 
 * Request Body mein kya aana chahiye:
 * - sessionId: Kis class/session ki attendance hai
 * - qrData: QR code scan karke jo data mila (encrypted/encoded ho sakta hai)
 * - timestamp: Kab scan kiya (client side timestamp)
 * 
 * req.user se kya milega:
 * - Authentication middleware ne logged-in student ki info daal di hogi
 * - Isme studentId, name, email wagairah hoga
 * 
 * IMPORTANT: QR validation, duplicate check, time window check - yeh sab
 * Service layer mein hoga, yahan NAHI likhna hai!
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function (error handling ke liye)
 */
const markAttendance = async (req, res, next) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Request body se required data extract karo
        // ---------------------------------------------------------------------
        // Destructuring use kar rahe hain - clean aur readable hai
        const { sessionId, qrData, timestamp } = req.body;

        // ---------------------------------------------------------------------
        // STEP 2: Logged-in student ki info nikalo
        // ---------------------------------------------------------------------
        // req.user authentication middleware ne populate kiya hai
        // Agar user login nahi hai toh auth middleware pehle hi rok dega
        const studentId = req.user?.id;

        // ---------------------------------------------------------------------
        // STEP 3: Basic Validation - Required fields check karo
        // ---------------------------------------------------------------------
        // Yeh sirf basic check hai - "field hai ya nahi"
        // Complex validation (jaise QR valid hai ya nahi) Service mein hogi
        
        // Student ID check - agar auth middleware ne user nahi diya toh problem hai
        if (!studentId) {
            // 401 Unauthorized - User authenticated nahi hai
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please login first.'
            });
        }

        // Session ID check - kis session ki attendance mark karni hai yeh toh batao
        if (!sessionId) {
            // 400 Bad Request - Client ne required data nahi bheja
            return res.status(400).json({
                success: false,
                message: 'Session ID is required. Kaunsi class ki attendance mark karni hai?'
            });
        }

        // qrData and timestamp are optional - qr-request system may not send them

        // ---------------------------------------------------------------------
        // STEP 4: Service Layer ko call karo
        // ---------------------------------------------------------------------
        // Dekho - yahan humne koi business logic nahi likhi
        // Bas data extract kiya, validate kiya (basic), aur service ko de diya
        // 
        // Service layer mein yeh sab hoga:
        // - QR code decode/decrypt karna
        // - QR code validity check (expired toh nahi)
        // - Session valid hai ya nahi check
        // - Duplicate attendance check (already marked toh nahi)
        // - Time window check (late toh nahi)
        // - Database mein attendance record insert karna
        const attendanceRecord = await attendanceService.markAttendance(
            studentId,
            sessionId,
            qrData,
            timestamp
        );

        // ---------------------------------------------------------------------
        // STEP 5: Success Response bhejo
        // ---------------------------------------------------------------------
        // 201 Created - Nayi attendance record ban gayi
        // Standard response structure use kar rahe hain: { success, data }
        return res.status(201).json({
            success: true,
            message: 'Attendance marked successfully! Haaziri lag gayi.',
            data: attendanceRecord
        });

    } catch (error) {
        // ---------------------------------------------------------------------
        // ERROR HANDLING
        // ---------------------------------------------------------------------
        // Koi bhi error aaye - service se ya kahi se bhi
        // Hum use next() se global error handler ko pass kar denge
        // Global error handler proper error response format karega
        // 
        // Yahan error handle NAHI kar rahe kyunki:
        // - Centralized error handling better hai
        // - Consistent error responses milte hain
        // - Error logging ek jagah hoti hai
        next(error);
    }
};

/**
 * -----------------------------------------------------------------------------
 * GET ATTENDANCE BY SESSION CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: GET /api/attendance/session/:sessionId
 * 
 * Kya karta hai yeh function?
 * - Ek particular session/class ki saari attendance records laata hai
 * - Teacher/Admin use karega dekhne ke liye ki class mein kaun kaun aaya
 * 
 * URL Parameter:
 * - sessionId: Kis session ki attendance chahiye
 * 
 * Example: GET /api/attendance/session/sess_12345
 * 
 * Response mein kya milega:
 * - Us session mein jitne students ne attendance mark ki, unki list
 * - Har record mein student info, timestamp, status wagairah
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAttendanceBySession = async (req, res, next) => {
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
        // Session ID toh honi chahiye - bina iske data kaise laayenge
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required. Kaunsi session ki attendance chahiye?'
            });
        }

        // ---------------------------------------------------------------------
        // STEP 3: Service Layer ko call karo
        // ---------------------------------------------------------------------
        // Service layer mein yeh hoga:
        // - Session exist karti hai ya nahi check
        // - Database se attendance records fetch karna
        // - Data ko proper format mein laana
        // - Student details populate karna (if needed)
        const attendanceList = await attendanceService.getAttendanceBySession(sessionId);

        // ---------------------------------------------------------------------
        // STEP 4: Success Response bhejo
        // ---------------------------------------------------------------------
        // 200 OK - Data successfully mil gaya
        return res.status(200).json({
            success: true,
            message: 'Attendance records fetched successfully.',
            data: attendanceList,
            // Optional: Total count bhi bhej do for frontend convenience
            count: attendanceList.length
        });

    } catch (error) {
        // Error ko global handler ko de do
        next(error);
    }
};

/**
 * -----------------------------------------------------------------------------
 * GET ATTENDANCE BY STUDENT CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: GET /api/attendance/student/:studentId
 * 
 * Kya karta hai yeh function?
 * - Ek particular student ki attendance history laata hai
 * - Student apni history dekh sakta hai
 * - Admin/Teacher bhi kisi student ki history dekh sakta hai
 * 
 * URL Parameter:
 * - studentId: Kis student ki attendance chahiye
 * 
 * Query Parameters (Optional Filters):
 * - sessionId: Specific session ki hi attendance (optional)
 * - startDate: Is date ke baad ki attendance (optional)
 * - endDate: Is date se pehle ki attendance (optional)
 * 
 * Example: GET /api/attendance/student/stu_123?startDate=2024-01-01&endDate=2024-01-31
 * 
 * Yeh filters Service layer mein apply honge, Controller sirf pass karega
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAttendanceByStudent = async (req, res, next) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: URL params se student ID nikalo
        // ---------------------------------------------------------------------
        const { studentId } = req.params;

        // ---------------------------------------------------------------------
        // STEP 2: Query parameters se optional filters nikalo
        // ---------------------------------------------------------------------
        // req.query mein URL ke ? ke baad wale parameters aate hain
        // Example: ?sessionId=123&startDate=2024-01-01
        // 
        // Yeh filters optional hain - agar nahi diye toh saari history aa jayegi
        const { sessionId, startDate, endDate } = req.query;

        // Filters ko ek object mein pack kar do - service ko pass karna easy hoga
        const filters = {
            sessionId: sessionId || null,      // Specific session filter
            startDate: startDate || null,      // Date range start
            endDate: endDate || null           // Date range end
        };

        // ---------------------------------------------------------------------
        // STEP 3: Basic Validation
        // ---------------------------------------------------------------------
        // Student ID toh mandatory hai
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required. Kis student ki attendance chahiye?'
            });
        }

        // ---------------------------------------------------------------------
        // STEP 4: Service Layer ko call karo
        // ---------------------------------------------------------------------
        // Service layer mein yeh hoga:
        // - Student exist karta hai ya nahi check
        // - Filters apply karke database query banana
        // - Date parsing aur validation
        // - Attendance records fetch karna
        // - Session details populate karna (if needed)
        const attendanceHistory = await attendanceService.getAttendanceByStudent(
            studentId,
            filters
        );

        // ---------------------------------------------------------------------
        // STEP 5: Success Response bhejo
        // ---------------------------------------------------------------------
        return res.status(200).json({
            success: true,
            message: 'Student attendance history fetched successfully.',
            data: attendanceHistory,
            count: attendanceHistory.length,
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
 * GET ATTENDANCE REPORT CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: GET /api/attendance/report/:sessionId
 * 
 * Kya karta hai yeh function?
 * - Ek session ka detailed attendance report generate karta hai
 * - Teacher/Admin ke liye useful hai
 * - Present, absent, late students ki summary
 * - Export ke liye different formats support kar sakta hai
 * 
 * URL Parameter:
 * - sessionId: Kis session ka report chahiye
 * 
 * Query Parameter (Optional):
 * - format: Report ka format (json, csv, pdf) - default json
 * 
 * Example: GET /api/attendance/report/sess_123?format=csv
 * 
 * Report mein kya kya ho sakta hai:
 * - Session details (subject, date, time, teacher)
 * - Total enrolled students
 * - Present count, Absent count, Late count
 * - Attendance percentage
 * - Individual student records with status
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAttendanceReport = async (req, res, next) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: URL params se session ID nikalo
        // ---------------------------------------------------------------------
        const { sessionId } = req.params;

        // ---------------------------------------------------------------------
        // STEP 2: Query parameter se format nikalo
        // ---------------------------------------------------------------------
        // Format optional hai - default 'json' hoga
        // Supported formats: json, csv, pdf (Service layer handle karega)
        const { format } = req.query;
        
        // Default format set karo agar nahi diya
        const reportFormat = format || 'json';

        // ---------------------------------------------------------------------
        // STEP 3: Basic Validation
        // ---------------------------------------------------------------------
        // Session ID mandatory hai report ke liye
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required. Kis session ka report chahiye?'
            });
        }

        // Optional: Format validation bhi kar sakte ho
        // Lekin yeh Service layer mein bhi ho sakta hai
        const supportedFormats = ['json', 'csv', 'pdf'];
        if (format && !supportedFormats.includes(format.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid format. Supported formats: ${supportedFormats.join(', ')}`
            });
        }

        // ---------------------------------------------------------------------
        // STEP 4: Service Layer ko call karo
        // ---------------------------------------------------------------------
        // Service layer mein yeh hoga:
        // - Session details fetch karna
        // - Enrolled students list laana
        // - Attendance records fetch karna
        // - Present/Absent/Late categorize karna
        // - Statistics calculate karna (percentage, counts)
        // - Format ke according data structure banana
        // - CSV/PDF generation (if requested)
        const report = await attendanceService.getAttendanceReport(
            sessionId,
            reportFormat.toLowerCase()
        );

        // ---------------------------------------------------------------------
        // STEP 5: Response bhejo based on format
        // ---------------------------------------------------------------------
        // Different formats ke liye different response handling
        
        // Agar CSV format hai toh file download ke liye headers set karo
        if (reportFormat.toLowerCase() === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${sessionId}.csv`);
            return res.status(200).send(report);
        }

        // Agar PDF format hai toh PDF headers set karo
        if (reportFormat.toLowerCase() === 'pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${sessionId}.pdf`);
            return res.status(200).send(report);
        }

        // Default JSON response
        return res.status(200).json({
            success: true,
            message: 'Attendance report generated successfully.',
            data: report
        });

    } catch (error) {
        // Error handling - centralized error handler ko pass karo
        next(error);
    }
};

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Module exports - CommonJS syntax use kar rahe hain
 * 
 * Routes file mein aise import hoga:
 * const attendanceController = require('./controllers/attendance.controller');
 * 
 * Aur aise use hoga:
 * router.post('/mark', attendanceController.markAttendance);
 * router.get('/session/:sessionId', attendanceController.getAttendanceBySession);
 * router.get('/student/:studentId', attendanceController.getAttendanceByStudent);
 * router.get('/report/:sessionId', attendanceController.getAttendanceReport);
 */
module.exports = {
    markAttendance,
    getAttendanceBySession,
    getAttendanceByStudent,
    getAttendanceReport
};

