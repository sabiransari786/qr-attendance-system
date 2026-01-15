/**
 * Middleware Barrel File (index.js)
 *
 * Barrel file ka role:
 *  - Saare middleware ko ek central entry-point se export karna
 *  - Taaki imports clean aur maintainable rahein:
 *      const { authMiddleware, validate, errorMiddleware } = require('./middleware');
 *
 * Direct file imports vs barrel file:
 *  - Direct:    require('./middleware/auth.middleware');
 *  - Barrel:    require('./middleware');
 *  - Benefit:   Less repetition, better scalability, ek jagah se sab manage ho jata hai.
 */

// Auth middleware - JWT based authentication ke liye
const authMiddleware = require('./auth.middleware');

// Validation middleware - request data (body/params/query) ko validate karne ke liye
const validate = require('./validation.middleware');

// Global error handling middleware - centralized error responses ke liye
const errorMiddleware = require('./error.middleware');

/**
 * Clean, structured exports:
 *  - Consistent naming
 *  - Easy destructuring from routes / app setup
 *
 * Usage Example:
 *  const { authMiddleware, validate, errorMiddleware } = require('./middleware');
 */
module.exports = {
  authMiddleware,
  validate,
  errorMiddleware
};