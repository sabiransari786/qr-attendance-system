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
console.log("AUTH SERVICE LOADED");
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
 * Default value development ke liye hai - production mein set karna zaroori hai
 */
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-change-in-production';

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
        
        // ---------------------------------------------------------------------
        // STEP 2: Find User in Database
        // ---------------------------------------------------------------------
        // Email se user find karo
        // Email unique hai - sirf ek user milega (if exists)
        const [users] = await pool.query(
            `SELECT id, name, email, password, role, created_at
             FROM users 
             WHERE email = ?`,
            [normalizedEmail]
        );
        
        // User nahi mila - generic error message (security best practice)
        // Specific "user not found" message se attacker ko pata chal jayega ki email exist karta hai
        if (!users || users.length === 0) {
            throw new InvalidCredentialsError();
        }
        
        const user = users[0];
        
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
        const { name, email, password, role, ...extraFields } = userData;
        
        // Required fields check
        if (!name || !email || !password) {
            throw new ValidationError('Name, email, and password are required.');
        }
        
        // Name validation
        if (name.trim().length === 0) {
            throw new ValidationError('Name cannot be empty.');
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
        
        // Role validation - valid roles check karo
        const validRoles = [ROLE.STUDENT, ROLE.FACULTY, ROLE.ADMIN];
        const userRole = role || ROLE.STUDENT; // Default role 'student'
        
        if (role && !validRoles.includes(role)) {
            throw new ValidationError(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);
        }
        
        // ---------------------------------------------------------------------
        // STEP 2: Check Email Uniqueness
        // ---------------------------------------------------------------------
        // Email already exist karta hai ya nahi check karo
        // Unique constraint database level pe bhi honi chahiye - defense in depth
        const [existingUsers] = await pool.query(
            `SELECT id FROM users WHERE email = ?`,
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
        
        // ---------------------------------------------------------------------
        // STEP 4: Insert User into Database
        // ---------------------------------------------------------------------
        // User record database mein insert karo
        // Password hashed form mein store hoga
        const [result] = await pool.query(
            `INSERT INTO users (name, email, password, role, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [normalizedName, normalizedEmail, hashedPassword, userRole]
        );
        
        // Inserted user ka ID mil gaya
        const userId = result.insertId;
        
        // ---------------------------------------------------------------------
        // STEP 5: Fetch Created User Data
        // ---------------------------------------------------------------------
        // Created user data fetch karo (password exclude karke)
        // INSERT ke baad SELECT karna better hai - database se exact data milega
        const [users] = await pool.query(
            `SELECT id, name, email, role, created_at
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
module.exports = {
    login,
    register
};

