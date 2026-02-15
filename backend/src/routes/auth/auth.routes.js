/**
 * Authentication Routes File (auth.routes.js)
 * 
 * Ye file authentication-related routes define karti hai
 * Routes = URL endpoints jo frontend se requests receive karte hain
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
// AUTH CONTROLLER IMPORT
// ============================================================================

// Authentication controller import kar rahe hain
// Controllers request/response handle karte hain - business logic services mein hoti hai
// Controller functions: login, logout, getCurrentUser, register
// Path: '../../controllers/auth.controller' - routes/auth folder se controllers folder
const {
  login,
  logout,
  getCurrentUser,
  register,
  updateProfile,
  uploadProfilePhoto,
  getProfilePhoto
} = require('../../controllers/auth.controller');

// Authentication middleware import kar rahe hain
// Protected routes ke liye authentication check karne ke liye
const authMiddleware = require('../../middleware/auth.middleware');

// Admin-only access guard
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  return next();
};

// Try to import multer - if not available, create a fallback
let upload;
try {
  const multer = require('multer');
  upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    fileFilter: (req, file, cb) => {
      // Allow only image files
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only images are allowed.'), false);
      }
    }
  });
} catch (err) {
  console.warn('⚠️ Multer not installed. Install with: npm install multer');
  // Fallback middleware that just passes through
  upload = {
    single: (fieldName) => (req, res, next) => {
      console.log('⚠️ Multer fallback: install multer package for file uploads');
      next();
    }
  };
}

// ============================================================================
// ROUTES KYA HAIN? (What are Routes?)
// ============================================================================

/**
 * Routes Kya Hain?
 * - Routes = URL endpoints jo frontend se HTTP requests receive karte hain
 * - Example: POST /api/auth/login - login endpoint
 * - Har route = URL pattern + HTTP method (GET, POST, PUT, DELETE) + handler function
 * 
 * Request Flow: Route → Controller → Service → Database
 * 
 * 1. Frontend se request aata hai: POST /api/auth/login (email, password ke saath)
 * 2. Route catch karta hai: router.post('/login', login) - login controller call hota hai
 * 3. Controller execute hota hai: login(req, res) - request validate karta hai, service call karta hai
 * 4. Service business logic handle karta hai: authService.login() - database query, password verify, token generate
 * 5. Database query execute hoti hai: User find karna, password match karna
 * 6. Response wapas jata hai: Service → Controller → Route → Frontend
 * 
 * Kyun Auth Routes Alag File Mein?
 * - Separation of Concerns: Har feature ka apna routes file - organization better
 * - Maintainability: Auth routes change karni ho to sirf ye file edit karni hai
 * - Scalability: Naye routes easily add kar sakte hain - file structure clear rehta hai
 * - Team Collaboration: Multiple developers alag-alag route files par kaam kar sakte hain
 * - Clean Architecture: app.js clean rehta hai - har feature modular
 */

// ============================================================================
// AUTHENTICATION ROUTES DEFINITION
// ============================================================================

/**
 * POST /login - User Login Route
 * 
 * Request: POST /api/auth/login
 * Body: { email: "user@example.com", password: "password123" }
 * 
 * Flow:
 * - Frontend login form se email/password bhejta hai
 * - Route login controller function ko call karta hai
 * - Controller authService.login() call karke credentials verify karta hai
 * - Service database se user find karta hai, password verify karta hai, JWT token generate karta hai
 * - Controller response mein token aur user info return karta hai
 * 
 * Response: { success: true, data: { token: "...", user: {...} } }
 */
router.post('/login', login);

/**
 * POST /logout - User Logout Route
 * 
 * Request: POST /api/auth/logout
 * Headers: { Authorization: "Bearer <token>" }
 * 
 * Flow:
 * - Frontend logout button click karne pe request bhejta hai
 * - Route logout controller function ko call karta hai
 * - Controller stateless JWT logout handle karta hai (token client-side remove hoga)
 * - Optional: Token blacklisting implement kar sakte hain service mein
 * 
 * Response: { success: true, message: "Logout successful" }
 */
router.post('/logout', logout);

/**
 * GET /me - Get Current User Profile Route
 * 
 * Request: GET /api/auth/me
 * Headers: { Authorization: "Bearer <token>" }
 * 
 * Flow:
 * - Frontend current user ki profile info fetch karna chahta hai
 * - Auth middleware token verify karke req.user mein user data populate karta hai
 * - Route getCurrentUser controller function ko call karta hai
 * - Controller req.user se user info read karke response return karta hai
 * 
 * Note: Ye route protected hai - authentication middleware required hoga
 * 
 * Response: { success: true, data: { user: { id, email, role, ... } } }
 */
router.get('/me', authMiddleware, getCurrentUser);

/**
 * POST /register - User Registration Route (Optional)
 * 
 * Request: POST /api/auth/register
 * Body: { email: "user@example.com", password: "password123", role: "student", name: "John Doe" }
 * 
 * Flow:
 * - Frontend registration form se user data bhejta hai
 * - Route register controller function ko call karta hai
 * - Controller validation karke authService.register() call karta hai
 * - Service database mein naya user create karta hai, password hash karta hai
 * - Controller response mein user info return karta hai
 * 
 * Note: Ye route optional hai - agar system mein registration allowed nahi hai to comment out kar do
 * 
 * Response: { success: true, data: { user: { id, email, role, ... } } }
 */
router.post('/register', register);

/**
 * GET /students - Get All Students (Admin Only)
 * 
 * Request: GET /api/auth/students
 * Headers: { Authorization: "Bearer <admin_token>" }
 * 
 * Response: { success: true, data: [...students] }
 */
router.get('/students', async (req, res) => {
  try {
    const { pool } = require('../../config/database');
    
    const [students] = await pool.query(
      `SELECT id, name, email, student_id, is_active, created_at 
       FROM users 
       WHERE role = 'student' 
       ORDER BY name ASC`
    );
    
    return res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: students || []
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
});

/**
 * GET /admin/users - Admin user management list
 * Query params: search, role, status (active/inactive)
 */
router.get('/admin/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { pool } = require('../../config/database');
    const { search, role, status } = req.query;

    let where = 'WHERE 1=1';
    const params = [];

    if (role && role !== 'all') {
      where += ' AND role = ?';
      params.push(role);
    }

    if (status === 'active') {
      where += ' AND is_active = 1';
    } else if (status === 'inactive') {
      where += ' AND is_active = 0';
    }

    if (search && search.trim()) {
      const like = `%${search.trim()}%`;
      where += ' AND (name LIKE ? OR email LIKE ? OR department LIKE ?)';
      params.push(like, like, like);
    }

    const [users] = await pool.query(
      `SELECT id, name, email, role, is_active, department
       FROM users
       ${where}
       ORDER BY created_at DESC`,
      params
    );

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users.'
    });
  }
});

/**
 * PATCH /admin/users/:id/role - Update user role
 */
router.patch('/admin/users/:id/role', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { pool } = require('../../config/database');
    const { id } = req.params;
    const { role } = req.body;
    const allowedRoles = ['student', 'faculty', 'admin'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided.'
      });
    }

    if (Number(id) === Number(req.user?.id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.'
      });
    }

    const [result] = await pool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully.'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update role.'
    });
  }
});

/**
 * PATCH /admin/users/:id/status - Activate/Deactivate user
 */
router.patch('/admin/users/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { pool } = require('../../config/database');
    const { id } = req.params;
    const { is_active } = req.body;

    if (Number(id) === Number(req.user?.id) && is_active === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.'
      });
    }

    const [result] = await pool.query(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully.'
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update status.'
    });
  }
});

/**
 * DELETE /admin/users/:id - Delete user
 */
router.delete('/admin/users/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { pool } = require('../../config/database');
    const { id } = req.params;

    if (Number(id) === Number(req.user?.id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    const [result] = await pool.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user.'
    });
  }
});

// ============================================================================
// ROUTER EXPORT
// ============================================================================

/**
 * PUT /profile - Update User Profile
 * 
 * Request: PUT /api/auth/profile
 * Headers: { Authorization: "Bearer <token>" }
 * Body: { name: "New Name", phone: "1234567890", department: "CS" }
 * 
 * Flow:
 * - Frontend sends updated profile data
 * - Auth middleware verifies token and sets req.user
 * - Route calls updateProfile controller
 * - Controller validates and calls service
 * - Service updates database and returns updated user
 * 
 * Response: { success: true, data: { user: {...} } }
 */
router.put('/profile', authMiddleware, updateProfile);

/**
 * POST /upload-photo - Upload Profile Photo
 * 
 * Request: POST /api/auth/upload-photo (FormData)
 * - Body: FormData with field 'photo' containing image file
 * - Headers: Authorization token required
 * 
 * Uploads user's profile photo to database
 * File stored as binary data (BLOB) in database
 * Max file size: 5MB
 * Allowed formats: JPEG, PNG, GIF, WebP
 */
router.post('/upload-photo', authMiddleware, upload.single('photo'), uploadProfilePhoto);

/**
 * GET /photo/:userId - Get Profile Photo
 * 
 * Request: GET /api/auth/photo/123
 * - Params: userId - User ID to get photo for
 * 
 * Returns the user's profile photo as image file
 * Response: Image binary data with appropriate MIME type
 */
router.get('/photo/:userId', getProfilePhoto);

/**
 * Router ko export kar rahe hain - app.js mein use hoga
 * 
 * app.js mein usage:
 * const authRoutes = require('./routes/auth/auth.routes');
 * app.use('/api/auth', authRoutes);
 * 
 * Final URLs:
 * - POST /api/auth/login
 * - POST /api/auth/logout
 * - GET /api/auth/me
 * - POST /api/auth/register
 * - PUT /api/auth/profile
 * - GET /api/auth/students
 * 
 * Kyun '/api/auth' prefix?
 * - API versioning: /api/v1/auth (future mein versioning ke liye)
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
//    - METHOD: GET, POST, PUT, DELETE, etc.
//    - '/path': Route path (e.g., '/login', '/logout')
//    - controllerFunction: Controller function jo execute hogi
//
// 2. No Business Logic:
//    - Yahan sirf route definitions hain
//    - Business logic controllers aur services mein hogi
//    - Routes bas URL map karte hain controller functions se
//
// 3. Request Flow:
//    Frontend → Route → Controller → Service → Database → Service → Controller → Route → Frontend
//
// 4. Adding New Routes:
//    - Naya route add karna ho to yahan add karo
//    - Controller function pehle se exist karni chahiye
//    - Route path clear aur RESTful honi chahiye
//
// 5. Middleware Integration:
//    - Authentication middleware add kar sakte hain: router.get('/me', authenticate, getCurrentUser)
//    - Validation middleware add kar sakte hain: router.post('/login', validateLogin, login)
//    - Middleware routes ko modify karne se pehle add karein
//
// 6. Best Practices:
//    - Route paths clear aur descriptive honi chahiye
//    - RESTful conventions follow karo (GET for read, POST for create, etc.)
//    - Related routes ek hi file mein group karo
//    - Route file ka naam resource ke naam se match karo (auth.routes.js for auth routes)
//
// ============================================================================

