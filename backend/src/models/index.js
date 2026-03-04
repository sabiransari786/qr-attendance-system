/**
 * Models Barrel File (index.js)
 *
 * Barrel file ka role:
 *  - Saare models ko ek single entry-point se export karna
 *  - Taaki controllers/services me imports clean aur readable rahein:
 *      const { AttendanceRequest } = require('../models');
 *
 * NOTE: user.model.js, session.model.js, attendance.model.js are legacy Mongoose
 * schemas. The actual app uses MySQL via mysql2/promise (pool) directly in services.
 * Only AttendanceRequest model uses MySQL pool correctly and is actively used.
 */

// Attendance Request model - QR code generation requests ke liye (uses MySQL pool)
const AttendanceRequest = require('./attendance-request.model');

module.exports = {
  AttendanceRequest
};