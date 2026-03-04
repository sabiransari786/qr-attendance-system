/**
 * Configuration Index File (index.js)
 * 
 * Ye file config folder ka central hub hai - sab configuration files ko ek jagah se export karta hai
 * Index file pattern use karte hain - clean imports aur better code organization ke liye
 */

// ============================================================================
// KYUN INDEX FILE ZAROORI HAI? (Why Index File is Important)
// ============================================================================

/**
 * Index File Kya Hai?
 * - Index.js file ek folder ka entry point hoti hai
 * - Sab files ko import karke re-export karti hai - single import point banati hai
 * - Folder structure ko encapsulate karti hai - internal structure hide hoti hai
 * 
 * Kyun Use Karte Hain?
 * - Clean Imports: const { ROLE, pool, config } = require('./config');
 *   Instead of: const { ROLE } = require('./config/constants');
 *               const { pool } = require('./config/database');
 *               const config = require('./config/env');
 * 
 * - Simplified Paths: './config' instead of './config/constants', './config/database', etc.
 *   Folder structure change hone par sirf index.js update karna padega, baaki files nahi
 * 
 * - Better Organization: Ek folder se sab kuch import - clear structure
 *   Developers ko pata rehta hai ki config folder se kya-kya available hai
 * 
 * - Clean Architecture: Layer separation - config folder internal details hide karta hai
 *   Controllers/Services ko nahi pata ki configuration kahan se aati hai
 * 
 * - Easier Refactoring: Files rename/restructure karni ho to sirf index.js update karo
 *   Baaki files mein changes nahi karni padegi
 * 
 * Kaise Use Hota Hai?
 * - app.js: const { connectDatabase } = require('./config');
 * - Controllers: const { ROLE } = require('../config');
 * - Services: const { pool, config } = require('../config');
 * - Middleware: const { ATTENDANCE_STATUS } = require('../config');
 * 
 * Benefits:
 * - Single import statement - cleaner code
 * - Shorter paths - less typing, fewer errors
 * - Better IDE support - autocomplete sab kuch ek jagah se
 * - Maintainability - changes centralized hote hain
 */

// ============================================================================
// DATABASE CONFIGURATION IMPORT
// ============================================================================

// Database configuration import kar rahe hain
// database.js file se pool (connection pool) aur connectDatabase function export hoti hai
// Pool services mein database queries execute karne ke liye use hota hai
// connectDatabase function app.js mein app start pe call hoti hai
const { pool, connectDatabase } = require('./database');

// ============================================================================
// ENVIRONMENT VARIABLES IMPORT
// ============================================================================

// Environment variables configuration import kar rahe hain
// env.js file se config object export hota hai jisme sab environment variables hote hain
// PORT, NODE_ENV, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, etc. sab values is object mein hain
// Controllers aur services mein configuration values access karne ke liye use hota hai
const config = require('./env');

// ============================================================================
// CONSTANTS IMPORT
// ============================================================================

// Constants import kar rahe hain
// constants.js file se ROLE, ATTENDANCE_STATUS, SESSION_STATUS, QR_EXPIRY_TIME export hote hain
// Controllers, services, middleware mein fixed values use karne ke liye in constants ka use hota hai
// Magic strings avoid karne ke liye - consistency aur maintainability ke liye zaroori hai
const {
  ROLE,
  ATTENDANCE_STATUS,
  SESSION_STATUS,
  QR_EXPIRY_TIME
} = require('./constants');

// ============================================================================
// CENTRALIZED EXPORT
// ============================================================================

/**
 * Sab configurations ko ek object mein export kar rahe hain
 * 
 * Usage Examples:
 * 
 * 1. Single Import (Recommended):
 *    const { ROLE, pool, config, connectDatabase } = require('./config');
 * 
 * 2. Multiple Imports:
 *    const { ROLE, ATTENDANCE_STATUS } = require('./config');
 *    const { pool, connectDatabase } = require('./config');
 * 
 * 3. In app.js:
 *    const { connectDatabase } = require('./config');
 *    connectDatabase(); // Database connection initialize
 * 
 * 4. In Services:
 *    const { pool, config, ROLE } = require('../config');
 *    const [users] = await pool.query('SELECT * FROM users WHERE role = ?', [ROLE.STUDENT]);
 * 
 * 5. In Controllers:
 *    const { ATTENDANCE_STATUS, ROLE } = require('../config');
 *    if (status === ATTENDANCE_STATUS.PRESENT) { ... }
 * 
 * 6. In Middleware:
 *    const { ROLE } = require('../config');
 *    if (req.user.role === ROLE.ADMIN) { ... }
 */
module.exports = {
  // Database exports
  pool,              // MySQL connection pool - database queries execute karne ke liye
  connectDatabase,   // Database connection initialization function - app start pe call hoti hai

  // Environment configuration
  config,            // Environment variables object - PORT, NODE_ENV, DB_* values, etc.

  // Constants
  ROLE,                      // User roles: STUDENT, FACULTY, ADMIN
  ATTENDANCE_STATUS,         // Attendance statuses: PRESENT, LATE, ABSENT
  SESSION_STATUS,            // Session statuses: ACTIVE, CLOSED
  QR_EXPIRY_TIME            // QR code expiry time in milliseconds (15 minutes)
};

// ============================================================================
// IMPORTANT NOTES:
// ============================================================================
//
// 1. Import Pattern:
//    - Always import from './config' (not './config/database', './config/env', etc.)
//    - Destructuring use karo: const { ROLE, pool } = require('./config');
//    - Only import what you need - tree shaking benefits
//
// 2. File Structure:
//    - Internal file structure change hone par sirf index.js update karo
//    - External files (controllers, services) mein changes nahi karni padegi
//
// 3. Usage Locations:
//    - app.js: Database connection initialize karne ke liye
//    - Controllers: Constants use karne ke liye (ROLE, ATTENDANCE_STATUS)
//    - Services: Database pool aur constants use karne ke liye
//    - Middleware: Constants use karne ke liye (authorization checks)
//
// 4. Benefits:
//    - Single source of imports - cleaner code
//    - Better maintainability - changes centralized
//    - Clean architecture - internal structure hidden
//    - Easier refactoring - only index.js needs updates
//
// 5. Best Practices:
//    - Always use this index.js file for imports
//    - Don't import directly from database.js, env.js, constants.js
//    - Use destructuring to import only what you need
//    - Keep this file simple - only imports and exports, no logic
//
// ============================================================================

