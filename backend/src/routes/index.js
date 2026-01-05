/**
 * Routes Index File (index.js)
 * 
 * Ye file routes folder ka central hub hai - sab route modules ko ek jagah se export karta hai
 * Index file pattern use karte hain - clean imports aur better code organization ke liye
 */

// ============================================================================
// KYUN ROUTES INDEX FILE ZAROORI HAI? (Why Routes Index File is Important)
// ============================================================================

/**
 * Routes Index File Kya Hai?
 * - Index.js file routes folder ka entry point hoti hai
 * - Sab route modules ko import karke re-export karti hai - single import point banati hai
 * - Routes folder ki internal structure ko encapsulate karti hai - app.js ko detail nahi pata
 * 
 * Kyun Use Karte Hain?
 * 
 * 1. Clean Imports in app.js:
 *    Before (without index.js):
 *    const authRoutes = require('./routes/auth/auth.routes');
 *    const sessionRoutes = require('./routes/session/session');
 *    const attendanceRoutes = require('./routes/attendance/attendance');
 * 
 *    After (with index.js):
 *    const { authRoutes, sessionRoutes, attendanceRoutes } = require('./routes');
 *    Ya phir:
 *    const routes = require('./routes');
 *    app.use('/api/auth', routes.authRoutes);
 * 
 * 2. Simplified Route Imports:
 *    - app.js mein ek hi import statement - cleaner code
 *    - Multiple require statements ki jagah single import
 *    - Path complexity kam ho jati hai - './routes' instead of multiple paths
 * 
 * 3. Better Organization:
 *    - Ek jagah se sab routes import - clear structure
 *    - Developers ko pata rehta hai ki routes folder mein kya-kya available hai
 *    - Routes folder ki structure easily visible hoti hai
 * 
 * 4. Clean Architecture Support:
 *    - Layer separation - app.js ko routes folder ki internal structure nahi pata
 *    - Routes folder ka internal organization change ho to sirf index.js update karna padega
 *    - app.js file clean rehta hai - route imports ek jagah se
 * 
 * 5. Easy Refactoring:
 *    - Route files rename/restructure karni ho to sirf index.js update karo
 *    - app.js mein changes nahi karni padegi
 *    - Future mein route files move karni ho to centralized update
 * 
 * 6. Scalability:
 *    - Naye routes add karne mein easy - index.js mein add karo, app.js clean rehta hai
 *    - Route organization better hoti hai
 *    - Multiple routes easily manage kar sakte hain
 * 
 * New Routes Add Karne Ke Liye:
 * - Naya route file create karo (e.g., user.routes.js)
 * - Index.js mein import karo: const userRoutes = require('./user/user.routes');
 * - Index.js mein export karo: module.exports = { ..., userRoutes };
 * - app.js mein use karo: app.use('/api/user', routes.userRoutes);
 * - app.js mein koi change nahi karni padegi route import paths mein
 */

// ============================================================================
// AUTH ROUTES IMPORT
// ============================================================================

// Authentication routes import kar rahe hain
// auth.routes.js file authentication-related endpoints define karti hai
// Login, logout, getCurrentUser, register jaisi routes is file mein hain
// Path: './auth/auth.routes' - routes folder se auth subfolder
const authRoutes = require('./auth/auth.routes');

// ============================================================================
// SESSION ROUTES IMPORT
// ============================================================================

// Session routes import kar rahe hain
// session.js file attendance session-related endpoints define karti hai
// Create session, close session, get active sessions, get session details jaisi routes is file mein hain
// Path: './session/session' - routes folder se session subfolder
const sessionRoutes = require('./session/session');

// ============================================================================
// ATTENDANCE ROUTES IMPORT
// ============================================================================

// Attendance routes import kar rahe hain
// attendance.js file attendance-related endpoints define karti hai
// Mark attendance (QR scan), get attendance by session, get attendance by student, reports jaisi routes is file mein hain
// Path: './attendance/attendance' - routes folder se attendance subfolder
const attendanceRoutes = require('./attendance/attendance');

// ============================================================================
// CENTRALIZED EXPORT
// ============================================================================

/**
 * Sab routes ko ek structured object mein export kar rahe hain
 * 
 * Usage in app.js:
 * 
 * Method 1: Destructuring Import (Recommended)
 * const { authRoutes, sessionRoutes, attendanceRoutes } = require('./routes');
 * app.use('/api/auth', authRoutes);
 * app.use('/api/session', sessionRoutes);
 * app.use('/api/attendance', attendanceRoutes);
 * 
 * Method 2: Single Object Import
 * const routes = require('./routes');
 * app.use('/api/auth', routes.authRoutes);
 * app.use('/api/session', routes.sessionRoutes);
 * app.use('/api/attendance', routes.attendanceRoutes);
 * 
 * Benefits:
 * - Single import statement in app.js
 * - Clean code - multiple require statements avoid
 * - Easy to maintain - sab routes ek jagah se
 * - Future routes easily add kar sakte hain
 */
module.exports = {
  authRoutes,           // Authentication routes - login, logout, getCurrentUser, register
  sessionRoutes,        // Session routes - create, close, get active, get by ID
  attendanceRoutes      // Attendance routes - mark attendance, get by session/student, reports
};

// ============================================================================
// IMPORTANT NOTES:
// ============================================================================
//
// 1. Import Pattern:
//    - Always import from subfolders: './auth/auth.routes', './session/session'
//    - File paths match actual file structure in routes folder
//    - Index.js routes folder mein hai, isliye relative paths use karte hain
//
// 2. Export Pattern:
//    - Sab routes ko named exports mein export karte hain
//    - Object destructuring se easily import kar sakte hain
//    - Clear naming - route type clearly visible (authRoutes, sessionRoutes)
//
// 3. Adding New Routes:
//    - Step 1: Naya route file create karo (e.g., user/user.routes.js)
//    - Step 2: Index.js mein import karo: const userRoutes = require('./user/user.routes');
//    - Step 3: Export object mein add karo: module.exports = { ..., userRoutes };
//    - Step 4: app.js mein use karo: app.use('/api/user', routes.userRoutes);
//    - app.js mein import path change nahi karni padegi - sab routes index.js se aayenge
//
// 4. File Structure:
//    routes/
//      ├── index.js (this file)
//      ├── auth/
//      │   └── auth.routes.js
//      ├── session/
//      │   └── session.js
//      └── attendance/
//          └── attendance.js
//
// 5. Benefits:
//    - Clean app.js - single route import
//    - Easy maintenance - routes centralized
//    - Better organization - routes folder structure clear
//    - Scalable - new routes easily add
//    - Clean architecture - layer separation maintained
//
// 6. Best Practices:
//    - Keep index.js simple - only imports and exports
//    - No business logic in index.js
//    - Consistent naming - route files clearly named
//    - Document new routes when adding
//
// ============================================================================

