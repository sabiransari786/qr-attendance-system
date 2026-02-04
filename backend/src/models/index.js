/**
 * Models Barrel File (index.js)
 *
 * Barrel file ka role:
 *  - Saare Mongoose models ko ek single entry-point se export karna
 *  - Taaki controllers/services me imports clean aur readable rahein:
 *      const { User, Session, Attendance } = require('../models');
 *
 * Direct imports vs barrel file:
 *  - Direct:  require('../models/user.model');
 *  - Barrel:  require('../models');
 *  - Benefit: Less repetition, centralized management, easy scalability.
 */

// User model - system ke saare users (student/teacher/admin) ke liye
const User = require('./user.model');

// Session model - QR based class/lecture sessions ke liye
const Session = require('./session.model');

// Attendance model - har student ki attendance records ke liye
const Attendance = require('./attendance.model');

/**
 * Clean, structured exports:
 *  - Consistent naming
 *  - Easy destructuring in controllers/services
 *
 * Usage Example:
 *  const { User, Session, Attendance } = require('../models');
 */
module.exports = {
  User,
  Session,
  Attendance
};