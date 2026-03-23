/**
 * =============================================================================
 * AUTHENTICATION SERVICE - QR-based Attendance Tracking System
 * =============================================================================
 * 
 * Yeh file Service layer ka part hai jo Clean Architecture follow karti hai.
 * Authentication aur user management ki saari business logic yahan hoti hai.
 * 
 * REQUEST FLOW SAMJHO:
 * ====================
 * Controller → Service (Yeh file) → Database → Service → Controller
 *                         ↑
 *                    (Business Logic)
 * 
 * SERVICE LAYER KA KAAM KYA HAI?
 * ===============================
 * 1. User authentication (login) - password verification, token generation
 * 2. User registration - password hashing, user creation
 * 3. Security operations - password hashing, JWT token generation
 * 4. Database operations - user queries (SELECT, INSERT)
 * 5. Data validation - email format, password strength, uniqueness checks
 * 6. Error handling - meaningful error messages throw karna
 * 
 * SERVICE LAYER MEIN KYA NAHI HAI?
 * =================================
 * - HTTP request/response handling (Express req/res)
 * - Routes definition
 * - Middleware logic
 * - View rendering
 * 
 * IMPORTANT SECURITY NOTES:
 * ========================
 * - Passwords kabhi plain text mein store nahi hote - bcrypt hash karke store
 * - JWT tokens user identification aur authorization ke liye use hote hain
 * - Password comparison bcrypt.compare() se hoti hai - secure comparison
 * - Email uniqueness check zaroori hai - duplicate emails allow nahi
 * - Password never return hota response mein - security risk hai
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

const { pool, ROLE } = require('../config');

/**
 * bcrypt Library Import
 * Password hashing aur comparison ke liye
 * bcrypt industry standard hai password hashing ke liye - secure aur slow (intentionally)
 * Slow hone se brute force attacks slow ho jate hain
 */
const bcrypt = require('bcrypt');

/**
 * jsonwebtoken Library Import
 * JWT token generation aur verification ke liye
 * JWT (JSON Web Token) stateless authentication ke liye use hota hai
 */
const jwt = require('jsonwebtoken');

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * JWT Secret Key
 * Token signing ke liye secret key chahiye - environment variable se aata hai
 * Production mein strong, random secret key use karni chahiye
 * Agar JWT_SECRET set nahi hai toh server start nahi hona chahiye
 */
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('\u274c FATAL: JWT_SECRET environment variable is not set. Set it in .env file.');
  process.exit(1);
}

/**
 * JWT Token Expiry Time
 * Token kitne time tak valid rahega
 * Default: 24 hours (24 * 60 * 60 seconds)
 * Security ke liye tokens expiry ke saath banane chahiye
 */
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * bcrypt Salt Rounds
 * Password hashing ke liye salt rounds
 * Higher rounds = more secure but slower
 * 10 rounds industry standard hai - balance between security aur performance
 */
const BCRYPT_SALT_ROUNDS = 10;
let approvalSchemaReady = false;
let approvalStatusSupported = false;
let pendingPasswordHashSupported = false;

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
 * User Not Found Error
 * Jab user database mein exist nahi karta
 */
class UserNotFoundError extends Error {
    constructor(message = 'User not found. Invalid email address.') {
        super(message);
        this.name = 'UserNotFoundError';
        this.statusCode = 404;
    }
}

/**
 * Invalid Credentials Error
 * Jab email ya password galat hai
 * Security: Generic message dete hain - user exist karta hai ya nahi reveal nahi karte
 */
class InvalidCredentialsError extends Error {
    constructor(message = 'Invalid credentials. Email or password is incorrect.') {
        super(message);
        this.name = 'InvalidCredentialsError';
        this.statusCode = 401;
    }
}

/**
 * User Already Exists Error
 * Jab user registration karte waqt email already exist karta hai
 */
class UserAlreadyExistsError extends Error {
    constructor(message = 'User already exists. Email address is already registered.') {
        super(message);
        this.name = 'UserAlreadyExistsError';
        this.statusCode = 409; // Conflict
    }
}

/**
 * Validation Error
 * Jab input data invalid hai (email format, password strength, etc.)
 */
class ValidationError extends Error {
    constructor(message = 'Validation failed. Please check your input data.') {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * VALIDATE EMAIL FORMAT
 * -----------------------------------------------------------------------------
 * 
 * Email format validate karta hai using regex
 * Basic validation - production mein advanced validation libraries use kar sakte hain
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid, false otherwise
 */
const validateEmailFormat = (email) => {
    // Email regex pattern
    // Basic pattern hai - production mein zyada strict validation kar sakte hain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * -----------------------------------------------------------------------------
 * VALIDATE PASSWORD STRENGTH
 * -----------------------------------------------------------------------------
 * 
 * Password strength validate karta hai
 * Minimum requirements check karta hai - production mein zyada strict ho sakta hai
 * 
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, message: string }
 */
const validatePasswordStrength = (password) => {
    // Minimum length check
    if (password.length < 6) {
        return {
            valid: false,
            message: 'Password must be at least 6 characters long.'
        };
    }
    
    // Optional: Additional checks (uppercase, lowercase, numbers, special chars)
    // Currently minimum length check sufficient hai - can be enhanced
    
    return {
        valid: true,
        message: 'Password is valid.'
    };
};

/**
 * -----------------------------------------------------------------------------
 * GENERATE JWT TOKEN
 * -----------------------------------------------------------------------------
 * 
 * JWT token generate karta hai user authentication ke liye
 * Token mein userId aur role include hota hai - authorization checks ke liye
 * 
 * @param {number|string} userId - User ka unique ID
 * @param {string} role - User ka role (student, faculty, admin)
 * @returns {string} JWT token
 */
const generateJWTToken = (userId, role) => {
    // JWT payload - token mein ye data include hoga
    const payload = {
        id: userId,
        role: role
    };
    
    // Token options
    const options = {
        expiresIn: JWT_EXPIRY, // Token expiry time
        issuer: 'attendance-tracker', // Token issuer
        subject: userId.toString() // Subject (usually user ID)
    };
    
    // Token generate karo
    // jwt.sign() payload ko secret key se sign karke token banata hai
    const token = jwt.sign(payload, JWT_SECRET, options);
    
    return token;
};

/**
 * -----------------------------------------------------------------------------
 * PREPARE USER RESPONSE
 * -----------------------------------------------------------------------------
 * 
 * User object se password remove karke safe user data return karta hai
 * Password kabhi bhi response mein nahi jana chahiye - security risk hai
 * 
 * @param {Object} user - User object from database
 * @returns {Object} User object without password
 */
const prepareUserResponse = (user) => {
    // Destructure user object - password exclude karke
    const { password, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
};

const ensureApprovalSchema = async () => {
    if (approvalSchemaReady) return;

    try {
        const [tableRows] = await pool.query(
            `SELECT TABLE_NAME FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'approved_users'`
        );

        if (!tableRows || tableRows.length === 0) {
            await pool.query(
                `CREATE TABLE IF NOT EXISTS approved_users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    contact_number VARCHAR(20) NOT NULL,
                    role ENUM('student', 'faculty') NOT NULL DEFAULT 'student',
                    student_id VARCHAR(100) NULL,
                    teacher_id VARCHAR(100) NULL,
                    department VARCHAR(100) NULL,
                    semester INT NULL,
                    section VARCHAR(50) NULL,
                    approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
                    pending_password_hash VARCHAR(255) NULL,
                    is_registered BOOLEAN DEFAULT FALSE,
                    registered_user_id INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_approved_email (email),
                    INDEX idx_approved_contact (contact_number),
                    INDEX idx_approved_role (role),
                    INDEX idx_approved_status (approval_status),
                    INDEX idx_approved_registered (is_registered)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
            );
            approvalStatusSupported = true;
            pendingPasswordHashSupported = true;
            approvalSchemaReady = true;
            return;
        }

        let [statusColumn] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'approved_users' AND COLUMN_NAME = 'approval_status'`
        );
        approvalStatusSupported = !!(statusColumn && statusColumn.length > 0);
        if (!approvalStatusSupported) {
            try {
                await pool.query(
                    `ALTER TABLE approved_users
                     ADD COLUMN approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'`
                );
                [statusColumn] = await pool.query(
                    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'approved_users' AND COLUMN_NAME = 'approval_status'`
                );
                approvalStatusSupported = !!(statusColumn && statusColumn.length > 0);
            } catch (alterStatusError) {
                approvalStatusSupported = false;
                console.warn('⚠️ Could not add approval_status column:', alterStatusError.message);
            }
        }

        let [passwordHashColumn] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'approved_users' AND COLUMN_NAME = 'pending_password_hash'`
        );
        pendingPasswordHashSupported = !!(passwordHashColumn && passwordHashColumn.length > 0);
        if (!pendingPasswordHashSupported) {
            try {
                await pool.query(
                    `ALTER TABLE approved_users
                     ADD COLUMN pending_password_hash VARCHAR(255) NULL`
                );
                [passwordHashColumn] = await pool.query(
                    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'approved_users' AND COLUMN_NAME = 'pending_password_hash'`
                );
                pendingPasswordHashSupported = !!(passwordHashColumn && passwordHashColumn.length > 0);
            } catch (alterPasswordColumnError) {
                pendingPasswordHashSupported = false;
                console.warn('⚠️ Could not add pending_password_hash column:', alterPasswordColumnError.message);
            }
        }
    } catch (schemaError) {
        // Legacy schema / restricted DB users should not block signup flow.
        approvalStatusSupported = false;
        pendingPasswordHashSupported = false;
        console.warn('⚠️ approved_users extended schema unavailable, running in legacy mode:', schemaError.message);
    } finally {
        approvalSchemaReady = true;
    }
};

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * LOGIN
 * -----------------------------------------------------------------------------
 * 
 * User login karta hai email aur password se
 * 
 * BUSINESS LOGIC FLOW:
 * ====================
 * 1. Email format validate karo
 * 2. User database mein find karo (email se)
 * 3. User exist nahi karta toh error throw karo
 * 4. Password compare karo (bcrypt.compare)
 * 5. Password match nahi karta toh error throw karo
 * 6. JWT token generate karo
 * 7. User data prepare karo (password exclude karke)
 * 8. Return { token, user }
 * 
 * @param {string} email - User ka email address
 * @param {string} password - User ka plain text password
 * @returns {Promise<Object>} { token: string, user: Object }
 */
const login = async (email, password) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Input Validation
        // ---------------------------------------------------------------------
        // Email aur password basic validation
        if (!email || !password) {
            throw new ValidationError('Email and password are required.');
        }
        
        // Email format validate karo
        if (!validateEmailFormat(email)) {
            throw new ValidationError('Invalid email format. Please enter a valid email address.');
        }
        
        // Email lowercase karo - database consistency ke liye
        const normalizedEmail = email.trim().toLowerCase();
        await ensureApprovalSchema();
        
        // ---------------------------------------------------------------------
        // STEP 2: Find User in Database
        // ---------------------------------------------------------------------
        // Email se user find karo (using LOWER for case-insensitive comparison)
        // Email unique hai - sirf ek user milega (if exists)
        const [users] = await pool.query(
            `SELECT id, name, email, password, role, is_active, created_at
             FROM users 
             WHERE LOWER(email) = LOWER(?)`,
            [normalizedEmail]
        );
        
        // User nahi mila - generic error message (security best practice)
        // Specific "user not found" message se attacker ko pata chal jayega ki email exist karta hai
        let user = users && users.length > 0 ? users[0] : null;

        if (!user) {
            const [approvalRows] = await pool.query(
                `SELECT * FROM approved_users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
                [normalizedEmail]
            );

            if (!approvalRows || approvalRows.length === 0) {
                throw new InvalidCredentialsError();
            }

            const approvalRow = approvalRows[0];
            const status = approvalStatusSupported ? approvalRow.approval_status : 'pending';

            if (status === 'rejected') {
                throw new ValidationError('Your signup request was rejected. Please contact admin.');
            }

            if (status !== 'approved') {
                throw new ValidationError('Your signup request is pending admin approval. Please wait.');
            }

            if (approvalRow.pending_password_hash) {
                const [insertResult] = await pool.query(
                    `INSERT INTO users (name, email, contact_number, password, role, student_id, teacher_id, department, semester, section, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        approvalRow.name,
                        approvalRow.email,
                        approvalRow.contact_number,
                        approvalRow.pending_password_hash,
                        approvalRow.role,
                        approvalRow.student_id || null,
                        approvalRow.teacher_id || null,
                        approvalRow.department || null,
                        approvalRow.semester || null,
                        approvalRow.section || null,
                    ]
                );

                if (approvalStatusSupported && pendingPasswordHashSupported) {
                    await pool.query(
                        `UPDATE approved_users
                         SET is_registered = TRUE, registered_user_id = ?, pending_password_hash = NULL, updated_at = NOW()
                         WHERE id = ?`,
                        [insertResult.insertId, approvalRow.id]
                    );
                } else {
                    await pool.query(
                        `UPDATE approved_users
                         SET is_registered = TRUE, registered_user_id = ?, updated_at = NOW()
                         WHERE id = ?`,
                        [insertResult.insertId, approvalRow.id]
                    );
                }

                const [createdUsers] = await pool.query(
                    `SELECT id, name, email, password, role, is_active, created_at
                     FROM users
                     WHERE id = ? LIMIT 1`,
                    [insertResult.insertId]
                );
                user = createdUsers && createdUsers.length > 0 ? createdUsers[0] : null;
            }

            if (!user) {
                throw new ValidationError('Your account is approved but registration is incomplete. Please sign up again or contact admin.');
            }
        }

        // is_active check: agar admin ne account deactivate kar diya hai toh login block
        if (user.is_active === 0 || user.is_active === false) {
            throw new ValidationError(
                'Your account has been deactivated. Please contact the administrator.'
            );
        }
        
        // ---------------------------------------------------------------------
        // STEP 3: Password Verification
        // ---------------------------------------------------------------------
        // bcrypt.compare() se password verify karo
        // bcrypt.compare() plain text password ko hashed password se compare karta hai
        // Time-safe comparison hai - timing attacks prevent karta hai
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        // Password match nahi karta - generic error message
        // Specific "wrong password" message se attacker ko pata chal jayega ki email correct hai
        if (!isPasswordValid) {
            throw new InvalidCredentialsError();
        }
        
        // ---------------------------------------------------------------------
        // STEP 4: Generate JWT Token
        // ---------------------------------------------------------------------
        // Successful authentication pe JWT token generate karo
        // Token mein userId aur role include hoga - future requests mein use hoga
        const token = generateJWTToken(user.id, user.role);
        
        // ---------------------------------------------------------------------
        // STEP 5: Prepare Response
        // ---------------------------------------------------------------------
        // User data se password remove karo - security ke liye
        const userResponse = prepareUserResponse(user);
        
        // Return token aur user data
        return {
            token: token,
            user: userResponse
        };
        
    } catch (error) {
        // Agar custom error hai (InvalidCredentialsError, etc.), toh directly throw karo
        // Custom errors already proper format mein hain
        if (error.name && error.statusCode) {
            throw error;
        }
        
        // Agar database error hai ya koi aur unexpected error
        // Toh generic error throw karo with details
        throw new Error(`Login failed: ${error.message}`);
    }
};

/**
 * -----------------------------------------------------------------------------
 * REGISTER
 * -----------------------------------------------------------------------------
 * 
 * Naya user register karta hai
 * 
 * BUSINESS LOGIC FLOW:
 * ====================
 * 1. Required fields validate karo (name, email, password)
 * 2. Email format validate karo
 * 3. Email uniqueness check karo (already exist toh nahi)
 * 4. Password strength validate karo
 * 5. Password hash karo (bcrypt.hash)
 * 6. User database mein insert karo
 * 7. Created user data fetch karo (password exclude karke)
 * 8. Return user data
 * 
 * @param {Object} userData - User data object
 * @param {string} userData.name - User ka name
 * @param {string} userData.email - User ka email
 * @param {string} userData.password - User ka plain text password
 * @param {string} userData.role - User ka role (optional, default 'student')
 * @returns {Promise<Object>} Created user object (without password)
 */
const register = async (userData) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Input Validation
        // ---------------------------------------------------------------------
        // Destructure userData
        const { name, email, contactNumber, password, role, studentId, teacherId, ...extraFields } = userData;
        
        // Required fields check
        if (!name || !email || !contactNumber || !password) {
            throw new ValidationError('Name, email, contact number, and password are required.');
        }
        
        // Name validation
        if (name.trim().length === 0) {
            throw new ValidationError('Name cannot be empty.');
        }
        
        // Contact number validation - basic check
        if (!/^\d{10}$|^\+\d{1,3}\d{9,}$/.test(contactNumber.trim())) {
            throw new ValidationError('Invalid contact number. Please enter a valid 10-digit number.');
        }
        
        // Email format validation
        if (!validateEmailFormat(email)) {
            throw new ValidationError('Invalid email format. Please enter a valid email address.');
        }
        
        // Password strength validation
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            throw new ValidationError(passwordValidation.message);
        }
        
        // Email normalize karo - lowercase for consistency
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = name.trim();
        const normalizedContact = contactNumber.trim();
        
        // Role validation - valid roles check karo
        const validRoles = [ROLE.STUDENT, ROLE.FACULTY, ROLE.ADMIN];
        const userRole = role || ROLE.STUDENT; // Default role 'student'
        
        if (role && !validRoles.includes(role)) {
            throw new ValidationError(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);
        }
        
        // =====================================================================
        // ADMIN APPROVAL CHECK - User ko approve hona chahiye
        // =====================================================================
        // Jab user signup karega, admin ne phele us user ko approve karna zaroori hai
        // Email aur contact number match karna zaroori hai approved_users se
        // Sirf registered se pehle users ki check karenke (is_registered = FALSE)
        
        const approvedUser = await getApprovedUser(normalizedEmail, normalizedContact);
        
        if (!approvedUser) {
            if ([ROLE.STUDENT, ROLE.FACULTY].includes(userRole)) {
                const signupRequest = await submitSignupRequest({
                    name: normalizedName,
                    email: normalizedEmail,
                    contactNumber: normalizedContact,
                    role: userRole,
                    studentId,
                    teacherId,
                    department: extraFields.department,
                    semester: extraFields.semester,
                    section: extraFields.section,
                    password,
                });

                return {
                    request_submitted: true,
                    approval_status: signupRequest.status,
                    request_id: signupRequest.requestId,
                };
            }

            throw new ValidationError(
                'User approval not found. Please contact the administrator to get your email and contact number approved before registration.'
            );
        }

        if (approvedUser.approval_status && approvedUser.approval_status !== 'approved') {
            const statusLabel = approvedUser.approval_status === 'rejected' ? 'rejected' : 'pending admin review';
            throw new ValidationError(`Your signup request is ${statusLabel}. Please contact the administrator.`);
        }
        
        // Approved user ke role se match karna chahiye (optional - extra security)
        // Agar admin student ki tarah approve kiya but faculty signup karna chahte hain
        if (approvedUser.role && userRole !== approvedUser.role) {
            throw new ValidationError(
                `Your account is approved as a ${approvedUser.role}. You cannot register with a different role.`
            );
        }

        // Student ID validation - student role ke liye zaroori
        if (userRole === ROLE.STUDENT && !studentId) {
            throw new ValidationError('Student ID is required for student registration.');
        }

        // Faculty ID validation - faculty role ke liye zaroori
        if (userRole === ROLE.FACULTY && !teacherId) {
            throw new ValidationError('Faculty ID is required for faculty registration.');
        }
        
        // Check duplicate IDs (with proper null handling and case-insensitive matching)
        if (userRole === ROLE.STUDENT && studentId) {
            const normalizedStudentId = studentId.trim().toUpperCase();
            const [existingStudents] = await pool.query(
                `SELECT id FROM users WHERE UPPER(student_id) = ? AND role = ?`,
                [normalizedStudentId, ROLE.STUDENT]
            );
            if (existingStudents && existingStudents.length > 0) {
                throw new UserAlreadyExistsError('This Student ID is already registered.');
            }
        }

        if (userRole === ROLE.FACULTY && teacherId) {
            const normalizedTeacherId = teacherId.trim().toUpperCase();
            const [existingFaculty] = await pool.query(
                `SELECT id FROM users WHERE UPPER(teacher_id) = ? AND role = ?`,
                [normalizedTeacherId, ROLE.FACULTY]
            );
            if (existingFaculty && existingFaculty.length > 0) {
                throw new UserAlreadyExistsError('This Faculty ID is already registered.');
            }
        }
        
        // ---------------------------------------------------------------------
        // STEP 2: Check Email Uniqueness
        // ---------------------------------------------------------------------
        // Email already exist karta hai ya nahi check karo (using LOWER for case-insensitive comparison)
        // Unique constraint database level pe bhi honi chahiye - defense in depth
        const [existingUsers] = await pool.query(
            `SELECT id FROM users WHERE LOWER(email) = LOWER(?)`,
            [normalizedEmail]
        );
        
        // Agar email already exist karta hai, toh error throw karo
        if (existingUsers && existingUsers.length > 0) {
            throw new UserAlreadyExistsError();
        }
        
        // ---------------------------------------------------------------------
        // STEP 3: Hash Password
        // ---------------------------------------------------------------------
        // Password ko bcrypt se hash karo
        // bcrypt.hash() plain text password ko secure hash mein convert karta hai
        // Salt automatically generate hota hai - same password ka different hash hoga
        // Hash database mein store hoga - plain text password kabhi store nahi hota
        
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        
        // Normalize student ID and teacher ID for consistent storage
        const normalizedStudentId = userRole === ROLE.STUDENT ? studentId?.trim().toUpperCase() : null;
        const normalizedTeacherId = userRole === ROLE.FACULTY ? teacherId?.trim().toUpperCase() : null;
        
        // ---------------------------------------------------------------------
        // STEP 4: Insert User into Database
        // ---------------------------------------------------------------------
        // User record database mein insert karo
        // Password hashed form mein store hoga
        const [result] = await pool.query(
            `INSERT INTO users (name, email, contact_number, password, role, student_id, teacher_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                normalizedName,
                normalizedEmail,
                normalizedContact,
                hashedPassword,
                userRole,
                normalizedStudentId,
                normalizedTeacherId
            ]
        );
        
        // Inserted user ka ID mil gaya
        const userId = result.insertId;
        
        // =====================================================================
        // Mark Approved User as Registered
        // =====================================================================
        // Jab user successfully signup kar jaye, approved_users record ko update karo
        // is_registered = TRUE aur registered_user_id = userId
        
        try {
            await markApprovedUserAsRegistered(approvedUser.id, userId);
        } catch (markError) {
            // Agar approved user update fail ho toh warning de do, but user create ho gaya hai
            console.warn('⚠️ Warning: Could not mark approved user as registered:', markError.message);
        }
        
        // ---------------------------------------------------------------------
        // STEP 5: Fetch Created User Data
        // ---------------------------------------------------------------------
        // Created user data fetch karo (password exclude karke)
        // INSERT ke baad SELECT karna better hai - database se exact data milega
        const [users] = await pool.query(
            `SELECT id, name, email, contact_number, role, student_id, teacher_id, created_at
             FROM users 
             WHERE id = ?`,
            [userId]
        );
        
        // User fetch ho gaya
        const createdUser = users[0];
        
        // ---------------------------------------------------------------------
        // STEP 6: Prepare Response
        // ---------------------------------------------------------------------
        // User data return karo (password already excluded hai query se)
        // Extra safety ke liye prepareUserResponse() use kar sakte hain
        return prepareUserResponse(createdUser);
        
    } catch (error) {
        // Custom errors directly throw karo
        if (error.name && error.statusCode) {
            throw error;
        }
        
        // Database unique constraint error handle karo
        // MySQL duplicate entry error (email unique constraint violation)
        if (error.code === 'ER_DUP_ENTRY') {
            throw new UserAlreadyExistsError();
        }
        
        // Generic error handle karo
        throw new Error(`Registration failed: ${error.message}`);
    }
};

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Module exports - CommonJS syntax
 * 
 * Controllers mein aise import hoga:
 * const authService = require('../services/auth.service');
 * 
 * Usage:
 * await authService.login(email, password);
 * await authService.register(userData);
 */
/**
 * Update User Profile
 * 
 * @param {number} userId - User ID
 * @param {Object} updateData - Profile data to update
 * @returns {Promise<Object>} Updated user object
 */
const updateProfile = async (userId, updateData) => {
    try {
        const { pool } = require('../config/database');
        
        // Fields that can be updated
        const allowedFields = ['name', 'phone', 'contactNumber', 'department', 'semester', 'section'];
        const updates = [];
        const values = [];
        
        // Build dynamic update query
        Object.keys(updateData).forEach(key => {
            // Convert camelCase to snake_case for database
            let dbKey = key;
            if (key === 'contactNumber' || key === 'phone') {
                dbKey = 'contact_number';
            }
            
            if (allowedFields.includes(key) && updateData[key] !== undefined && updateData[key] !== null) {
                updates.push(`${dbKey} = ?`);
                values.push(updateData[key]);
            }
        });
        
        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }
        
        // Add userId to values array
        values.push(userId);
        
        const updateQuery = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        // Update user in database
        await pool.query(updateQuery, values);
        
        // Fetch updated user data
        const [users] = await pool.query(
            `SELECT id, name, email, contact_number, role, student_id, teacher_id, 
                    department, semester, section, created_at, updated_at
             FROM users 
             WHERE id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            throw new Error('User not found');
        }
        
        const userResponse = prepareUserResponse(users[0]);
        
        return userResponse;
        
    } catch (error) {
        console.error('❌ Update profile error:', error);
        throw new Error(`Profile update failed: ${error.message}`);
    }
};

/**
 * Fetch User Profile by ID
 *
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User object (without password)
 */
const getUserById = async (userId) => {
    try {
        const { pool } = require('../config/database');

        const [users] = await pool.query(
            `SELECT id, name, email, contact_number, role, student_id, teacher_id,
                    department, semester, section, created_at, updated_at
             FROM users
             WHERE id = ?`,
            [userId]
        );

        if (!users || users.length === 0) {
            throw new UserNotFoundError('User not found.');
        }

        return prepareUserResponse(users[0]);
    } catch (error) {
        if (error.name && error.statusCode) {
            throw error;
        }

        throw new Error(`Failed to fetch user: ${error.message}`);
    }
};

/**
 * Upload User Profile Photo
 * Stores user's profile photo as binary data in database
 * 
 * @param {number} userId - User ID
 * @param {Buffer} photoBuffer - Photo file buffer
 * @param {string} mimeType - Photo MIME type (e.g., 'image/jpeg')
 * @returns {Object} Updated user profile
 */
const uploadProfilePhoto = async (userId, photoBuffer, mimeType) => {
    try {
        if (!photoBuffer || photoBuffer.length === 0) {
            throw new Error('Photo buffer is empty');
        }
        
        if (!mimeType) {
            throw new Error('MIME type is required');
        }
        
        // Store photo in database
        const updateQuery = `
            UPDATE users 
            SET profile_photo = ?, photo_mime_type = ?, updated_at = NOW() 
            WHERE id = ?
        `;
        
        try {
            await pool.query(updateQuery, [photoBuffer, mimeType, userId]);
        } catch (dbError) {
            console.error('Database error:', dbError);
            throw new Error(`Database update failed: ${dbError.message}`);
        }
        
        // Fetch updated user
        const [users] = await pool.query(
            `SELECT id, name, email, contact_number, role, student_id, teacher_id, 
                    department, semester, section, created_at, updated_at
             FROM users 
             WHERE id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            throw new Error('User not found');
        }
        
        return prepareUserResponse(users[0]);
    } catch (error) {
        console.error('❌ Error uploading photo:', error.message);
        throw new Error(`Failed to upload photo: ${error.message}`);
    }
};

/**
 * Get User Profile Photo
 * Retrieves user's profile photo from database
 * 
 * @param {number} userId - User ID
 * @returns {Object} { photo: Buffer, mimeType: string } or null if no photo
 */
const getProfilePhoto = async (userId) => {
    try {
        const [users] = await pool.query(
            `SELECT profile_photo, photo_mime_type FROM users WHERE id = ?`,
            [userId]
        );
        
        if (users.length === 0 || !users[0].profile_photo) {
            return null;
        }
        
        return {
            photo: users[0].profile_photo,
            mimeType: users[0].photo_mime_type || 'image/jpeg'
        };
    } catch (error) {
        console.error('❌ Error fetching photo:', error.message);
        throw new Error(`Failed to fetch photo: ${error.message}`);
    }
};

// =============================================================================
// APPROVED USERS MANAGEMENT SERVICE FUNCTIONS
// =============================================================================

/**
 * Check if user is approved for registration
 * Admin ne phele se user ko approve kiya hona chahiye
 * Email aur contact number match karna zaroori hai
 * 
 * @param {string} email - User email
 * @param {string} contactNumber - User phone number
 * @returns {Promise<Object>} Approved user data or null
 */
const getApprovedUser = async (email, contactNumber) => {
    try {
        await ensureApprovalSchema();
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedContact = contactNumber.trim();

        let query = `SELECT * FROM approved_users
                     WHERE LOWER(email) = LOWER(?) AND contact_number = ? AND is_registered = FALSE`;
        if (approvalStatusSupported) {
            query += ` AND approval_status = 'approved'`;
        }

        const [approvedUsers] = await pool.query(query, [normalizedEmail, normalizedContact]);
        
        return approvedUsers && approvedUsers.length > 0 ? approvedUsers[0] : null;
    } catch (error) {
        throw new Error(`Error checking approved users: ${error.message}`);
    }
};

/**
 * Mark approved user as registered after signup
 * Jab user successfully signup kar jaye, approved_users record ko update karo
 * 
 * @param {number} approvedUserId - ID from approved_users table
 * @param {number} registeredUserId - ID from users table
 * @returns {Promise<void>}
 */
const markApprovedUserAsRegistered = async (approvedUserId, registeredUserId) => {
    try {
        await pool.query(
            `UPDATE approved_users 
             SET is_registered = TRUE, registered_user_id = ?, updated_at = NOW()
             WHERE id = ?`,
            [registeredUserId, approvedUserId]
        );
    } catch (error) {
        throw new Error(`Error marking user as registered: ${error.message}`);
    }
};

/**
 * Get all approved users (Admin function)
 * Admin approved users ki list dekh sakte hain
 * 
 * @param {Object} filters - Search filters (role, is_registered, search)
 * @returns {Promise<Array>} List of approved users
 */
const getAllApprovedUsers = async (filters = {}) => {
    try {
        await ensureApprovalSchema();
        const { role, isRegistered, search, approvalStatus } = filters;
        
        let query = 'SELECT * FROM approved_users WHERE 1=1';
        const params = [];
        
        if (role && role !== 'all') {
            query += ' AND role = ?';
            params.push(role);
        }
        
        if (typeof isRegistered === 'boolean') {
            query += ' AND is_registered = ?';
            params.push(isRegistered);
        }

        if (approvalStatusSupported && approvalStatus && approvalStatus !== 'all') {
            query += ' AND approval_status = ?';
            params.push(approvalStatus);
        }
        
        if (search && search.trim()) {
            const like = `%${search.trim()}%`;
            query += ' AND (name LIKE ? OR email LIKE ? OR contact_number LIKE ?)';
            params.push(like, like, like);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [approvedUsers] = await pool.query(query, params);
        return approvedUsers || [];
    } catch (error) {
        throw new Error(`Error fetching approved users: ${error.message}`);
    }
};

/**
 * Add new approved user (Admin function)
 * Admin naya user approve karta hai signup se pehle
 * Email aur contact number must match karna hoga signup mein
 * 
 * @param {Object} userData - User data to approve
 * @returns {Promise<Object>} Created approved user
 */
const addApprovedUser = async (userData) => {
    try {
        await ensureApprovalSchema();
        const { name, email, contactNumber, role, studentId, teacherId, department, semester, section } = userData;
        
        // Validation
        if (!name || !email || !contactNumber) {
            throw new ValidationError('Name, email, and contact number are required.');
        }
        
        if (!['student', 'faculty'].includes(role)) {
            throw new ValidationError('Role must be either student or faculty.');
        }
        
        // Validate contact number
        if (!/^\d{10}$|^\+\d{1,3}\d{9,}$/.test(contactNumber.trim())) {
            throw new ValidationError('Invalid contact number. Please enter a valid 10-digit number.');
        }
        
        // Normalize data
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = name.trim();
        const normalizedContact = contactNumber.trim();
        const normalizedStudentId = studentId ? studentId.trim().toUpperCase() : null;
        const normalizedTeacherId = teacherId ? teacherId.trim().toUpperCase() : null;
        
        // Role-specific validation
        if (role === 'student' && !studentId) {
            throw new ValidationError('Student ID is required for student role.');
        }
        
        if (role === 'faculty' && !teacherId) {
            throw new ValidationError('Teacher ID is required for faculty role.');
        }
        
        // Check if email already approved
        const [existingEmail] = await pool.query(
            `SELECT id FROM approved_users WHERE LOWER(email) = LOWER(?)`,
            [normalizedEmail]
        );
        
        if (existingEmail && existingEmail.length > 0) {
            throw new ValidationError('This email is already approved.');
        }
        
        // Check if contact number already approved
        const [existingContact] = await pool.query(
            `SELECT id FROM approved_users WHERE contact_number = ?`,
            [normalizedContact]
        );
        
        if (existingContact && existingContact.length > 0) {
            throw new ValidationError('This contact number is already approved.');
        }
        
        // Insert approved user
        let result;
        if (approvalStatusSupported) {
            [result] = await pool.query(
                `INSERT INTO approved_users 
                 (name, email, contact_number, role, student_id, teacher_id, department, semester, section, approval_status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', NOW())`,
                [
                    normalizedName,
                    normalizedEmail,
                    normalizedContact,
                    role,
                    normalizedStudentId,
                    normalizedTeacherId,
                    department || null,
                    semester || null,
                    section || null
                ]
            );
        } else {
            [result] = await pool.query(
                `INSERT INTO approved_users 
                 (name, email, contact_number, role, student_id, teacher_id, department, semester, section, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    normalizedName,
                    normalizedEmail,
                    normalizedContact,
                    role,
                    normalizedStudentId,
                    normalizedTeacherId,
                    department || null,
                    semester || null,
                    section || null
                ]
            );
        }
        
        // Fetch and return created approved user
        const [approvedUsers] = await pool.query(
            `SELECT * FROM approved_users WHERE id = ?`,
            [result.insertId]
        );
        
        return approvedUsers[0];
    } catch (error) {
        if (error.name && error.statusCode) {
            throw error;
        }
        throw new Error(`Failed to add approved user: ${error.message}`);
    }
};

/**
 * Delete approved user (Admin function)
 * Admin ne galti se approve kiya ya cancel karna hai to delete kar sakte hain
 * Sirf un users ko delete karo jinhe signup nahi kiya (is_registered = FALSE)
 * 
 * @param {number} approvedUserId - ID from approved_users table
 * @returns {Promise<Object>} Deletion status
 */
const deleteApprovedUser = async (approvedUserId) => {
    try {
        await ensureApprovalSchema();
        // Check if user hasn't registered yet
        const [approvedUsers] = await pool.query(
            `SELECT is_registered FROM approved_users WHERE id = ?`,
            [approvedUserId]
        );
        
        if (approvedUsers.length === 0) {
            throw new ValidationError('Approved user not found.');
        }
        
        if (approvedUsers[0].is_registered) {
            throw new ValidationError('Cannot delete user who has already registered.');
        }
        
        // Delete the approved user record
        await pool.query(
            `DELETE FROM approved_users WHERE id = ?`,
            [approvedUserId]
        );
        
        return { success: true, message: 'Approved user deleted successfully.' };
    } catch (error) {
        if (error.name && error.statusCode) {
            throw error;
        }
        throw new Error(`Failed to delete approved user: ${error.message}`);
    }
};

const submitSignupRequest = async (requestData) => {
    try {
        await ensureApprovalSchema();

        const {
            name,
            email,
            contactNumber,
            contact_number,
            role = ROLE.STUDENT,
            studentId,
            student_id,
            teacherId,
            teacher_id,
            department,
            semester,
            section,
            password
        } = requestData;

        const resolvedContactNumber = (contactNumber || contact_number || '').toString();
        const resolvedStudentId = studentId || student_id;
        const resolvedTeacherId = teacherId || teacher_id;

        if (!name || !email || !resolvedContactNumber || !password) {
            throw new ValidationError('Name, email, contact number, and password are required.');
        }

        if (!validateEmailFormat(email)) {
            throw new ValidationError('Invalid email format.');
        }

        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            throw new ValidationError(passwordValidation.message);
        }

        if (!['student', 'faculty'].includes(role)) {
            throw new ValidationError('Role must be student or faculty.');
        }

        if (role === 'student' && !resolvedStudentId) {
            throw new ValidationError('Student ID is required for student role.');
        }

        if (role === 'faculty' && !resolvedTeacherId) {
            throw new ValidationError('Teacher ID is required for faculty role.');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedContact = resolvedContactNumber.trim();
        const normalizedName = name.trim();
        const normalizedStudentId = resolvedStudentId ? resolvedStudentId.trim().toUpperCase() : null;
        const normalizedTeacherId = resolvedTeacherId ? resolvedTeacherId.trim().toUpperCase() : null;
        const normalizedDepartment = typeof department === 'string' && department.trim() ? department.trim() : null;
        const normalizedSection = typeof section === 'string' && section.trim() ? section.trim() : null;
        const rawSemester = semester === undefined || semester === null ? '' : String(semester).trim();
        const semesterMatch = rawSemester.match(/\d+/);
        const normalizedSemester = semesterMatch ? Number.parseInt(semesterMatch[0], 10) : null;
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        const [existingUser] = await pool.query(
            `SELECT id FROM users WHERE LOWER(email) = LOWER(?)`,
            [normalizedEmail]
        );

        if (existingUser && existingUser.length > 0) {
            throw new ValidationError('This email is already registered. Please login instead.');
        }

        const [existingApproval] = await pool.query(
            `SELECT * FROM approved_users WHERE LOWER(email) = LOWER(?) OR contact_number = ? LIMIT 1`,
            [normalizedEmail, normalizedContact]
        );

        if (existingApproval && existingApproval.length > 0) {
            const row = existingApproval[0];

            if (row.is_registered) {
                throw new ValidationError('This account is already registered. Please login.');
            }

            if (approvalStatusSupported && row.approval_status === 'approved') {
                throw new ValidationError('Your account is already approved. Please complete registration.');
            }

            if ((approvalStatusSupported && row.approval_status === 'pending') || !approvalStatusSupported) {
                throw new ValidationError('Your signup request is already pending admin approval.');
            }

            const updateValuesWithPassword = [
                normalizedName,
                normalizedEmail,
                normalizedContact,
                role,
                normalizedStudentId,
                normalizedTeacherId,
                normalizedDepartment,
                normalizedSemester,
                normalizedSection,
                hashedPassword,
                row.id,
            ];

            try {
                await pool.query(
                    `UPDATE approved_users
                     SET name = ?, email = ?, contact_number = ?, role = ?, student_id = ?, teacher_id = ?,
                         department = ?, semester = ?, section = ?, approval_status = 'pending',
                         pending_password_hash = ?, updated_at = NOW(), is_registered = FALSE, registered_user_id = NULL
                     WHERE id = ?`,
                    updateValuesWithPassword
                );
            } catch (updateError) {
                if (updateError.code !== 'ER_BAD_FIELD_ERROR') {
                    throw updateError;
                }

                await pool.query(
                    `UPDATE approved_users
                     SET name = ?, email = ?, contact_number = ?, role = ?, student_id = ?, teacher_id = ?,
                         department = ?, semester = ?, section = ?, updated_at = NOW(),
                         is_registered = FALSE, registered_user_id = NULL
                     WHERE id = ?`,
                    [
                        normalizedName,
                        normalizedEmail,
                        normalizedContact,
                        role,
                        normalizedStudentId,
                        normalizedTeacherId,
                        normalizedDepartment,
                        normalizedSemester,
                        normalizedSection,
                        row.id,
                    ]
                );
            }

            return { requestId: row.id, status: 'pending' };
        }

        let insertResult;
        try {
            [insertResult] = await pool.query(
                `INSERT INTO approved_users
                 (name, email, contact_number, role, student_id, teacher_id, department, semester, section, approval_status, pending_password_hash, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
                [
                    normalizedName,
                    normalizedEmail,
                    normalizedContact,
                    role,
                    normalizedStudentId,
                    normalizedTeacherId,
                    normalizedDepartment,
                    normalizedSemester,
                    normalizedSection,
                    hashedPassword
                ]
            );
        } catch (insertError) {
            if (insertError.code !== 'ER_BAD_FIELD_ERROR') {
                throw insertError;
            }

            [insertResult] = await pool.query(
                `INSERT INTO approved_users
                 (name, email, contact_number, role, student_id, teacher_id, department, semester, section, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    normalizedName,
                    normalizedEmail,
                    normalizedContact,
                    role,
                    normalizedStudentId,
                    normalizedTeacherId,
                    normalizedDepartment,
                    normalizedSemester,
                    normalizedSection
                ]
            );
        }

        return { requestId: insertResult.insertId, status: 'pending' };
    } catch (error) {
        if (error.name && error.statusCode) {
            throw error;
        }
        throw new Error(`Failed to submit signup request: ${error.message}`);
    }
};

const updateApprovedUserStatus = async (approvedUserId, nextStatus) => {
    try {
        await ensureApprovalSchema();

        if (!approvalStatusSupported) {
            throw new ValidationError('Approval status workflow is not available on this database schema yet.');
        }

        if (!['approved', 'rejected'].includes(nextStatus)) {
            throw new ValidationError('Status must be either approved or rejected.');
        }

        const [rows] = await pool.query(
            `SELECT * FROM approved_users WHERE id = ? LIMIT 1`,
            [approvedUserId]
        );

        if (!rows || rows.length === 0) {
            throw new ValidationError('Approved user not found.');
        }

        const row = rows[0];

        if (row.is_registered) {
            throw new ValidationError('This user is already registered. Status cannot be changed.');
        }

        if (nextStatus === 'rejected') {
            await pool.query(
                `UPDATE approved_users SET approval_status = 'rejected', pending_password_hash = NULL, updated_at = NOW() WHERE id = ?`,
                [approvedUserId]
            );
            return { id: approvedUserId, approval_status: 'rejected', is_registered: false };
        }

        if (row.pending_password_hash) {
            const [existingUsers] = await pool.query(
                `SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
                [row.email]
            );

            if (existingUsers && existingUsers.length > 0) {
                throw new ValidationError('A user account already exists with this email.');
            }

            const [inserted] = await pool.query(
                `INSERT INTO users (name, email, contact_number, password, role, student_id, teacher_id, department, semester, section, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    row.name,
                    row.email,
                    row.contact_number,
                    row.pending_password_hash,
                    row.role,
                    row.student_id || null,
                    row.teacher_id || null,
                    row.department || null,
                    row.semester || null,
                    row.section || null
                ]
            );

            await pool.query(
                `UPDATE approved_users
                 SET approval_status = 'approved', is_registered = TRUE, registered_user_id = ?, pending_password_hash = NULL, updated_at = NOW()
                 WHERE id = ?`,
                [inserted.insertId, approvedUserId]
            );

            return { id: approvedUserId, approval_status: 'approved', is_registered: true, registered_user_id: inserted.insertId };
        }

        await pool.query(
            `UPDATE approved_users SET approval_status = 'approved', updated_at = NOW() WHERE id = ?`,
            [approvedUserId]
        );

        return { id: approvedUserId, approval_status: 'approved', is_registered: false };
    } catch (error) {
        if (error.name && error.statusCode) {
            throw error;
        }
        throw new Error(`Failed to update approval status: ${error.message}`);
    }
};

module.exports = {
    login,
    register,
    updateProfile,
    getUserById,
    uploadProfilePhoto,
    getProfilePhoto,
    getApprovedUser,
    markApprovedUserAsRegistered,
    getAllApprovedUsers,
    addApprovedUser,
    deleteApprovedUser,
    submitSignupRequest,
    updateApprovedUserStatus
};

