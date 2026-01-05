/**
 * Constants Configuration File (constants.js)
 * 
 * Ye file application ke saare fixed values (constants) ko store karti hai
 * Magic strings/numbers ko constants mein convert karke code maintainable banate hain
 * Ek jagah se sab constants manage karte hain - consistency aur reusability ke liye
 */

// ============================================================================
// CONSTANTS KYUN ZAROORI HAIN? (Why Constants are Important)
// ============================================================================

/**
 * Constants Kya Hain?
 * - Constants fixed values hote hain jo application mein multiple jagah use hote hain
 * - User roles ('student', 'faculty', 'admin'), status values ('present', 'absent'), etc.
 * - Uppercase naming convention use karte hain - easily identify karne ke liye
 * - Once defined, values change nahi hoti - that's why "constant"
 * 
 * Magic Strings/Numbers Kyun Bad Practice Hai?
 * - Magic strings code mein directly hardcoded strings hote hain
 * - Example: if (user.role === 'student') - yahan 'student' magic string hai
 * - Problems:
 *   1. Typos: 'studnet' (typo) vs 'student' - runtime error milega, compile time nahi
 *   2. Inconsistency: Ek jagah 'student', doosri jagah 'Student' - comparison fail ho jayega
 *   3. Hard to refactor: Value change karni ho to saare files mein dhundna padega
 *   4. No autocomplete: IDE autocomplete nahi dega - manually type karna padega
 *   5. No validation: Wrong value use karne se error dheere pata chalega
 * 
 * Constants Kaise Help Karte Hain?
 * - Single source of truth - ek jagah define, har jagah use
 * - Typos prevent - IDE autocomplete se typos kam hote hain
 * - Consistency - har jagah same value use hogi
 * - Easy refactoring - ek jagah change karo, sab jagah reflect hoga
 * - Better IDE support - autocomplete, type checking, find all references
 * - Code readability - ROLE.STUDENT se clearly pata chal jata hai ki ye role hai
 * - Documentation - constants file itself documentation ka kaam karti hai
 * 
 * Kahan Use Hote Hain?
 * - Controllers: Request validation, response formatting mein
 * - Services: Business logic, database queries mein
 * - Models: Data validation, schema definitions mein
 * - Middleware: Authentication, authorization checks mein
 * - Routes: Route parameter validation mein
 */

// ============================================================================
// USER ROLES CONSTANTS
// ============================================================================

/**
 * User Roles - application mein different types ke users hote hain
 * Har role ki apni permissions aur access levels hoti hain
 * Database mein bhi ye values store hoti hain - consistency ke liye constants use karte hain
 * 
 * Usage Examples:
 * - Authentication: if (user.role === ROLE.STUDENT) { ... }
 * - Authorization: if (req.user.role === ROLE.ADMIN) { allow access }
 * - Database queries: WHERE role = ROLE.FACULTY
 */
const ROLE = {
  // Student role - college students jo attendance mark karte hain
  STUDENT: 'student',

  // Faculty role - teachers/professors jo sessions create karte hain aur attendance manage karte hain
  FACULTY: 'faculty',

  // Admin role - system administrators jo sab kuch manage kar sakte hain
  ADMIN: 'admin'
};

// ============================================================================
// ATTENDANCE STATUS CONSTANTS
// ============================================================================

/**
 * Attendance Status - student ki attendance ki status define karti hai
 * Ye values database mein store hoti hain aur reports generate karne mein use hoti hain
 * 
 * Usage Examples:
 * - Mark attendance: { studentId: 1, status: ATTENDANCE_STATUS.PRESENT }
 * - Query: WHERE status = ATTENDANCE_STATUS.LATE
 * - Reports: Count attendance by status
 */
const ATTENDANCE_STATUS = {
  // Present - student session mein present tha
  PRESENT: 'present',

  // Late - student late aaya (session start hone ke baad)
  LATE: 'late',

  // Absent - student session mein present nahi tha
  ABSENT: 'absent'
};

// ============================================================================
// SESSION STATUS CONSTANTS
// ============================================================================

/**
 * Session Status - QR code session ki current state define karti hai
 * Faculty sessions create karte hain, students QR scan karke attendance mark karte hain
 * Session status se pata chal jata hai ki session abhi active hai ya close ho chuki hai
 * 
 * Usage Examples:
 * - Create session: { status: SESSION_STATUS.ACTIVE }
 * - Close session: UPDATE sessions SET status = SESSION_STATUS.CLOSED
 * - Validate QR: if (session.status !== SESSION_STATUS.ACTIVE) { error }
 */
const SESSION_STATUS = {
  // Active - session abhi chal rahi hai, students attendance mark kar sakte hain
  ACTIVE: 'active',

  // Closed - session close ho chuki hai, attendance mark nahi kar sakte
  CLOSED: 'closed'
};

// ============================================================================
// QR CODE EXPIRY TIME CONSTANT
// ============================================================================

/**
 * QR Code Expiry Time - QR code kitne time tak valid rahega (milliseconds mein)
 * Security ke liye QR codes expire ho jate hain - unlimited validity se misuse ho sakta hai
 * Ye value milliseconds mein hai - JavaScript Date objects milliseconds mein kaam karte hain
 * 
 * Default: 15 minutes = 15 * 60 * 1000 milliseconds
 * - 15 minutes = 15
 * - Seconds in minute = 60
 * - Milliseconds in second = 1000
 * - Total = 15 * 60 * 1000 = 900,000 milliseconds
 * 
 * Usage Examples:
 * - Generate QR: { expiryTime: Date.now() + QR_EXPIRY_TIME }
 * - Validate QR: if (qr.expiryTime < Date.now()) { expired }
 * - Check expiry: const isExpired = qr.expiryTime < Date.now() + QR_EXPIRY_TIME
 */
const QR_EXPIRY_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

// ============================================================================
// EXPORT ALL CONSTANTS
// ============================================================================

/**
 * Sab constants ko ek structured object mein export kar rahe hain
 * 
 * Usage in other files:
 * const { ROLE, ATTENDANCE_STATUS, SESSION_STATUS, QR_EXPIRY_TIME } = require('./config/constants');
 * 
 * Examples:
 * - if (user.role === ROLE.STUDENT) { ... }
 * - const status = ATTENDANCE_STATUS.PRESENT;
 * - if (session.status === SESSION_STATUS.ACTIVE) { ... }
 * - const expiry = Date.now() + QR_EXPIRY_TIME;
 * 
 * Benefits:
 * - Organized structure - sab constants ek jagah
 * - Namespace protection - ROLE.STUDENT se clearly pata chal jata hai ki ye role constant hai
 * - Easy import - destructuring se specific constants import kar sakte hain
 * - Better IDE support - autocomplete aur type checking
 */
module.exports = {
  ROLE,
  ATTENDANCE_STATUS,
  SESSION_STATUS,
  QR_EXPIRY_TIME
};

// ============================================================================
// IMPORTANT NOTES:
// ============================================================================
//
// 1. Naming Convention:
//    - Constants UPPERCASE mein hote hain (ROLE, ATTENDANCE_STATUS)
//    - Object properties UPPERCASE mein hote hain (STUDENT, PRESENT, ACTIVE)
//    - Values lowercase strings hain - database compatibility ke liye
//
// 2. Usage Best Practices:
//    - Kabhi bhi magic strings use mat karo - constants use karo
//    - Comparison mein constants use karo: if (role === ROLE.STUDENT)
//    - Database queries mein constants use karo: WHERE role = ROLE.FACULTY
//
// 3. Adding New Constants:
//    - Naya constant add karna ho to yahan add karo
//    - Related constants ko same object mein group karo
//    - Comments add karo - kya constant represent karti hai
//
// 4. Where to Use:
//    - Controllers: Request validation, response formatting
//    - Services: Business logic, database queries
//    - Middleware: Authorization checks
//    - Models: Data validation
//
// 5. Database Integration:
//    - Database schema mein bhi same values use karo
//    - ENUM types mein constants ke values use karo (MySQL)
//    - Consistency maintain karo - constants aur database values match honi chahiye
//
// 6. Refactoring:
//    - Value change karni ho to sirf yahan change karo
//    - Find all references IDE feature use karo - sab jagah update kar do
//    - Test karo - constants change karne se existing functionality affect nahi honi chahiye
//
// ============================================================================

