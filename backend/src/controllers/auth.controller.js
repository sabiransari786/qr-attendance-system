/**
 * =============================================================================
 * AUTHENTICATION CONTROLLER - QR-based Attendance Tracking System
 * =============================================================================
 * 
 * Yeh file Controller layer ka part hai jo Clean Architecture follow karti hai.
 * Authentication aur authorization related saari requests yahan handle hoti hain.
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
 * - Business logic (jaise password hashing, JWT token generation)
 * - Database queries (SELECT, INSERT, UPDATE, DELETE)
 * - Security logic (token validation, password comparison)
 * - Complex validation rules
 * 
 * Yeh sab Service layer mein hoga kyunki:
 * - Separation of Concerns maintain hoti hai
 * - Code reusable banta hai
 * - Testing easy ho jati hai (mock kar sakte hain service ko)
 * - Controller thin/lightweight rehta hai
 * - Security logic ek jagah centralize rehti hai
 * 
 * IMPORTANT NOTES:
 * ================
 * - Authentication middleware (auth.middleware.js) req.user ko populate karti hai
 * - JWT tokens Service layer mein generate hote hain
 * - Password hashing Service layer mein hoti hai (bcrypt)
 * - Token blacklisting/refresh logic Service layer mein hogi
 * 
 * =============================================================================
 */

// =============================================================================
// DEPENDENCIES IMPORT KARO
// =============================================================================

/**
 * Auth Service ko import kar rahe hain
 * Saari business logic, security operations, aur database operations
 * isi service mein honge
 * 
 * Service layer mein yeh sab hoga:
 * - User registration with password hashing
 * - User login with password verification
 * - JWT token generation aur validation
 * - Database queries for user operations
 * - Session management (if needed)
 * 
 * Controller sirf isko call karega, khud kuch nahi karega
 */

const authService = require('../services/auth.service');

// =============================================================================
// CONTROLLER FUNCTIONS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * LOGIN CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: POST /api/auth/login
 * 
 * Kya karta hai yeh function?
 * - User login karne ke liye use hota hai
 * - Email aur password se user authenticate hota hai
 * - Successful login pe JWT token milta hai
 * - Token frontend mein store hoga (localStorage/cookies)
 * 
 * Request Body mein kya aana chahiye:
 * - email: User ka email address (unique identifier)
 * - password: User ka plain text password (client se aayega)
 * 
 * IMPORTANT SECURITY NOTES:
 * - Password yahan plain text mein aayega (HTTPS pe hi bhejna chahiye)
 * - Password hashing Service layer mein hogi (yahan NAHI)
 * - Password comparison Service layer mein hogi (yahan NAHI)
 * - JWT token generation Service layer mein hogi (yahan NAHI)
 * - Invalid credentials pe service error throw karegi
 * 
 * Response mein kya milega:
 * - JWT token (frontend mein store karne ke liye)
 * - User data (id, name, email, role wagairah)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function (error handling ke liye)
 */
const login = async (req, res, next) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Request body se login credentials extract karo
        // ---------------------------------------------------------------------
        // Destructuring use kar rahe hain - clean aur readable hai
        const { email, password } = req.body;

        // ---------------------------------------------------------------------
        // STEP 2: Basic Validation - Required fields check karo
        // ---------------------------------------------------------------------
        // Yeh sirf basic check hai - "field hai ya nahi"
        // Complex validation (jaise email format, password strength)
        // Service layer mein hogi
        
        // Email check - bina email ke login kaise hoga
        if (!email) {
            // 400 Bad Request - Client ne required data nahi bheja
            return res.status(400).json({
                success: false,
                message: 'Email is required. Please enter your email address.'
            });
        }

        // Password check - bina password ke login kaise hoga
        if (!password) {
            // 400 Bad Request - Password missing hai
            return res.status(400).json({
                success: false,
                message: 'Password is required. Please enter your password.'
            });
        }

        // ---------------------------------------------------------------------
        // STEP 3: Service Layer ko call karo
        // ---------------------------------------------------------------------
        // Dekho - yahan humne koi security logic nahi likhi
        // Bas data extract kiya, validate kiya (basic), aur service ko de diya
        // 
        // Service layer mein yeh sab hoga:
        // - User find karna database mein (email se)
        // - Password compare karna (bcrypt.compare)
        // - Agar credentials valid nahi toh error throw
        // - JWT token generate karna
        // - User data prepare karna (password exclude karke)
        // - Return { token, user }
        const result = await authService.login(email, password);

        req.activityLogContext = {
            userId: result.user?.id,
            userRole: result.user?.role,
            action: 'AUTH_LOGIN',
            entityType: 'user',
            entityId: result.user?.id ? String(result.user.id) : null
        };

        // ---------------------------------------------------------------------
        // STEP 4: Success Response bhejo
        // ---------------------------------------------------------------------
        // 200 OK - Login successful
        // Token aur user data dono bhej rahe hain
        // Frontend token ko store kar lega aur next requests mein use karega
        return res.status(200).json({
            success: true,
            message: 'Login successful! Welcome back.',
            data: {
                token: result.token,      // JWT token - frontend store karega
                user: result.user         // User details - name, email, role wagairah
            }
        });

    } catch (error) {
        // ---------------------------------------------------------------------
        // ERROR HANDLING
        // ---------------------------------------------------------------------
        // Koi bhi error aaye - service se ya kahi se bhi
        // Hum use next() se global error handler ko pass kar denge
        // 
        // Common errors jo service se aayengi:
        // - User not found (404)
        // - Invalid credentials (401)
        // - Account locked/disabled (403)
        // - Database errors (500)
        // 
        // Global error handler proper error response format karega
        next(error);
    }
};

/**
 * -----------------------------------------------------------------------------
 * LOGOUT CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: POST /api/auth/logout
 * 
 * Kya karta hai yeh function?
 * - User logout karne ke liye use hota hai
 * - Stateless logout hai (JWT tokens stateless hote hain)
 * - Client side pe token remove kar dena hota hai
 * 
 * IMPORTANT CONCEPT - STATELESS LOGOUT:
 * =====================================
 * JWT tokens stateless hote hain - matlab server unhe store nahi karta
 * Isliye "traditional logout" jaisa kuch nahi hota
 * 
 * Two approaches:
 * 1. Simple Stateless (Yeh approach use kar rahe hain):
 *    - Client apna token delete kar deta hai
 *    - Server kuch kuch nahi karta
 *    - Token technically valid rehta hai lekin client ke paas nahi
 * 
 * 2. Token Blacklisting (Advanced):
 *    - Logout pe token ko blacklist mein daal dete hain
 *    - Har request pe blacklist check karte hain
 *    - Yeh Redis/database mein store hota hai
 *    - Iske liye service layer mein logic hogi
 * 
 * Current Implementation: Simple stateless logout
 * Agar blacklisting chahiye toh service layer mein implement karna hoga
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const logout = async (req, res, next) => {
    try {
        // ---------------------------------------------------------------------
        // STATELESS LOGOUT - Simple Approach
        // ---------------------------------------------------------------------
        // JWT tokens stateless hain, toh server side pe kuch karna nahi hota
        // Client apna token delete kar dega (localStorage/cookies se)
        // 
        // Agar token blacklisting implement karni hai, toh:
        // 1. req.user se token extract karo (middleware ne diya hoga)
        // 2. authService.logout(token) call karo
        // 3. Service layer token ko blacklist mein daal dega
        // 
        // Currently: Simple success response bhej rahe hain
        // Client side pe token remove karna frontend ki responsibility hai

        // Optional: Agar blacklisting use kar rahe ho, toh yahan service call karo
        // const token = req.headers.authorization?.split(' ')[1];
        // if (token) {
        //     await authService.logout(token);
        // }

        // ---------------------------------------------------------------------
        // Success Response bhejo
        // ---------------------------------------------------------------------
        // 200 OK - Logout successful (server side pe kuch nahi karna)
        req.activityLogContext = {
            userId: req.user?.id,
            userRole: req.user?.role,
            action: 'AUTH_LOGOUT',
            entityType: 'user',
            entityId: req.user?.id ? String(req.user.id) : null
        };

        return res.status(200).json({
            success: true,
            message: 'Logout successful! Your session token has been removed.'
        });

    } catch (error) {
        // Error handling - global handler ko pass karo
        next(error);
    }
};

/**
 * -----------------------------------------------------------------------------
 * GET CURRENT USER CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: GET /api/auth/me
 * 
 * Kya karta hai yeh function?
 * - Currently logged-in user ki information laata hai
 * - Frontend use karega check karne ke liye ki user logged in hai ya nahi
 * - User profile page mein bhi use hoga
 * 
 * IMPORTANT - AUTHENTICATION MIDDLEWARE:
 * ======================================
 * Yeh route protected hai - authentication middleware laga hoga
 * Middleware (auth.middleware.js) ne pehle hi:
 * - Token validate kar liya hoga
 * - req.user ko populate kar diya hoga (user ki details ke saath)
 * - Agar invalid token ho toh middleware ne error bhej diya hoga
 * 
 * req.user mein kya milega:
 * - id: User ka unique ID
 * - name: User ka name
 * - email: User ka email
 * - role: User ka role (student, teacher, admin)
 * - Aur koi extra fields jo middleware ne add ki hongi
 * 
 * Service layer ki zarurat nahi:
 * - Middleware ne already user data de diya hai
 * - Database query ki zarurat nahi (already fetched)
 * - Bas req.user ko return kar do
 * 
 * @param {Object} req - Express request object (req.user already populated)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getCurrentUser = async (req, res, next) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: req.user se logged-in user ki info nikalo
        // ---------------------------------------------------------------------
        // Authentication middleware (auth.middleware.js) ne already:
        // - Token validate kar liya hai
        // - User ko database se fetch kar liya hai
        // - req.user mein user data daal diya hai
        // 
        // Agar yahan tak request pahunchi hai, matlab:
        // - User authenticated hai
        // - Token valid hai
        // - req.user populated hai
        
        const user = req.user;

        // ---------------------------------------------------------------------
        // STEP 2: Basic Check - User exists hai ya nahi
        // ---------------------------------------------------------------------
        // Yeh edge case hai - middleware ne check kar liya hoga
        // Lekin defensive programming - safety check
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated. Please login again.'
            });
        }

        // ---------------------------------------------------------------------
        // STEP 3: User Data return karo
        // ---------------------------------------------------------------------
        // Database se fresh user data fetch karo taaki profile fields mil sakein
        const fullUser = await authService.getUserById(user.id);

        return res.status(200).json({
            success: true,
            message: 'User data fetched successfully.',
            data: fullUser
        });

    } catch (error) {
        // Error handling - global handler ko pass karo
        next(error);
    }
};

/**
 * -----------------------------------------------------------------------------
 * REGISTER CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: POST /api/auth/register
 * 
 * Kya karta hai yeh function?
 * - Naya user register karne ke liye use hota hai
 * - Student, Teacher, ya Admin register ho sakta hai (role based)
 * - Account ban jane ke baad user login kar sakta hai
 * 
 * Request Body mein kya aana chahiye:
 * - name: User ka full name
 * - email: User ka email address (unique hona chahiye)
 * - password: User ka password (plain text, service hash karega)
 * - role: User ka role (optional, default 'student')
 * - Aur koi extra fields jo schema mein honge (phone, studentId, etc.)
 * 
 * IMPORTANT NOTES:
 * - Email uniqueness check Service layer mein hogi (yahan NAHI)
 * - Password hashing Service layer mein hogi (bcrypt)
 * - Password strength validation Service layer mein hogi
 * - User creation database mein Service layer karega
 * 
 * Response mein kya milega:
 * - Created user ki information (password exclude hoga)
 * - Optional: JWT token (agar auto-login chahiye)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const register = async (req, res, next) => {
    try {
        // ---------------------------------------------------------------------
        // STEP 1: Request body se user data extract karo
        // ---------------------------------------------------------------------
        // Destructuring use kar rahe hain - required fields extract kar rahe hain
        // Extra fields bhi aa sakte hain jo schema mein allowed hain
        const { name, email, password, contact_number, role, student_id, teacher_id, ...extraFields } = req.body;

        // ---------------------------------------------------------------------
        // STEP 2: Basic Validation - Required fields check karo
        // ---------------------------------------------------------------------
        // Yeh sirf basic check hai - "field hai ya nahi"
        // Complex validation (email format, password strength, email uniqueness)
        // Service layer mein hogi

        // Name check - naam toh chahiye hi
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Name is required. Please enter your full name.'
            });
        }

        // Email check - email unique identifier hai
        if (!email || email.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Email is required. Please enter your email address.'
            });
        }

        // Password check - password security ke liye important hai
        if (!password || password.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Password is required. Please enter a strong password.'
            });
        }

        // Contact number check - contact number required hai
        if (!contact_number || contact_number.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Contact number is required. Please enter a valid 10-digit number.'
            });
        }

        // Optional: Basic password length check (Service layer mein detailed validation hogi)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        // Department required for students and faculty
        const userRole = role || 'student';
        if (userRole !== 'admin' && (!req.body.department || req.body.department.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'Department/Branch is required. Please select your branch.'
            });
        }

        // ---------------------------------------------------------------------
        // STEP 3: User Data Object prepare karo
        // ---------------------------------------------------------------------
        // Service ko clean data object bhejna hai
        // Extra fields bhi include kar sakte hain (schema mein allowed ho toh)
        const userData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),  // Email lowercase karo for consistency
            contactNumber: contact_number?.trim(),  // Convert snake_case to camelCase
            password: password,                  // Plain text - service hash karega
            role: role || 'student',            // Default role 'student' agar nahi diya
            studentId: student_id ? student_id.trim().toUpperCase() : undefined,  // Normalize to uppercase
            teacherId: teacher_id ? teacher_id.trim().toUpperCase() : undefined,  // Normalize to uppercase
            ...extraFields                       // Koi extra fields ho toh include karo
        };

        // ---------------------------------------------------------------------
        // STEP 4: Service Layer ko call karo
        // ---------------------------------------------------------------------
        // Dekho - yahan humne koi business logic nahi likhi
        // Bas data extract kiya, validate kiya (basic), aur service ko de diya
        // 
        // Service layer mein yeh sab hoga:
        // - Email uniqueness check (database mein exist karta hai ya nahi)
        // - Email format validation (regex)
        // - Password strength validation (length, complexity)
        // - Password hashing (bcrypt.hash)
        // - User record database mein create karna
        // - Password exclude karke user data return karna
        // - Optional: JWT token generate karna (auto-login ke liye)
        const newUser = await authService.register(userData);

        // ---------------------------------------------------------------------
        // STEP 5: Success Response bhejo
        // ---------------------------------------------------------------------
        // 201 Created - Nayi user account ban gayi
        // User data return karo (password exclude hoga - service ne handle kiya hoga)
        return res.status(201).json({
            success: true,
            message: 'Registration successful! You can now login with your credentials.',
            data: newUser
        });

    } catch (error) {
        // ---------------------------------------------------------------------
        // ERROR HANDLING
        // ---------------------------------------------------------------------
        // Koi bhi error aaye - service se ya kahi se bhi
        // Hum use next() se global error handler ko pass kar denge
        // 
        // Common errors jo service se aayengi:
        // - Email already exists (409 Conflict)
        // - Invalid email format (400 Bad Request)
        // - Weak password (400 Bad Request)
        // - Database errors (500 Internal Server Error)
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
 * Routes file (auth.routes.js) mein aise import hoga:
 * const authController = require('./controllers/auth.controller');
 * 
 * Aur aise use hoga:
 * router.post('/login', authController.login);
 * router.post('/logout', authController.logout);
 * router.get('/me', authMiddleware, authController.getCurrentUser);
 * router.post('/register', authController.register);
 */
/**
 * -----------------------------------------------------------------------------
 * UPDATE PROFILE CONTROLLER
 * -----------------------------------------------------------------------------
 * 
 * Route: PUT /api/auth/profile
 * 
 * Updates user profile information
 * Requires authentication
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateProfile = async (req, res, next) => {
    try {
        // Get user ID from authenticated user (set by auth middleware)
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        // Extract update data from request body
        const updateData = req.body;
        
        // Basic validation
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No data provided to update'
            });
        }
        
        // Call service to update profile
        const updatedUser = await authService.updateProfile(userId, updateData);
        
        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
        
    } catch (error) {
        console.error('❌ Update profile error:', error);
        next(error);
    }
};

/**
 * Upload Profile Photo
 * POST /api/auth/upload-photo
 * 
 * Uploads a profile photo for the authenticated user
 * Can accept file from multer or direct binary data from frontend
 */
const uploadProfilePhoto = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - User ID not found'
            });
        }
        
        let photoBuffer = null;
        let mimeType = null;
        
        // Check if multer processed the file
        if (req.file) {
            photoBuffer = req.file.buffer;
            mimeType = req.file.mimetype;
        } 
        // Check if frontend sent base64 encoded data in body
        else if (req.body.photo && req.body.mimeType) {
            // Handle base64 encoded photo from frontend
            try {
                const base64Data = req.body.photo.split(',')[1] || req.body.photo;
                photoBuffer = Buffer.from(base64Data, 'base64');
                mimeType = req.body.mimeType;
            } catch (error) {
                console.error('Failed to decode base64 photo:', error);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid photo format'
                });
            }
        }
        
        if (!photoBuffer || photoBuffer.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No photo provided'
            });
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (photoBuffer.length > maxSize) {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds maximum limit of 5MB'
            });
        }
        
        // Validate MIME type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(mimeType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'
            });
        }
        
        // Call service to upload photo
        const updatedUser = await authService.uploadProfilePhoto(userId, photoBuffer, mimeType);
        
        return res.status(200).json({
            success: true,
            message: 'Profile photo uploaded successfully',
            data: updatedUser
        });
        
    } catch (error) {
        console.error('❌ Upload photo error:', error);
        next(error);
    }
};

/**
 * Get Profile Photo
 * GET /api/auth/photo/:userId
 * 
 * Retrieves the profile photo for a user
 * Returns the image file directly
 */
const getProfilePhoto = async (req, res, next) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Call service to get photo
        const photoData = await authService.getProfilePhoto(userId);
        
        if (!photoData) {
            // Return a default placeholder response
            return res.status(404).json({
                success: false,
                message: 'No profile photo found for this user'
            });
        }
        
        // Send image file
        res.set('Content-Type', photoData.mimeType);
        res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        return res.send(photoData.photo);
        
    } catch (error) {
        console.error('❌ Get photo error:', error);
        next(error);
    }
};

module.exports = {
    login,
    logout,
    getCurrentUser,
    register,
    updateProfile,
    uploadProfilePhoto,
    getProfilePhoto
};

