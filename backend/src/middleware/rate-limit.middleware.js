/**
 * Rate Limiting Middleware (rate-limit.middleware.js)
 *
 * Protects critical endpoints from abuse:
 *  - Attendance marking: max 5 requests per student IP per minute
 *  - QR generation:      max 10 requests per faculty IP per minute
 *  - Auth endpoints:     max 20 requests per IP per 15 minutes
 */

const rateLimit = require('express-rate-limit');

/**
 * Creates a rate limiter with a custom message.
 * @param {number} windowMs  - Time window in milliseconds
 * @param {number} max       - Maximum requests per window per IP
 * @param {string} message   - Human-readable error message
 */
const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,  // Return RateLimit-* headers
    legacyHeaders: false,   // Disable X-RateLimit-* headers
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message
      });
    }
  });

/**
 * Attendance marking limiter
 * Prevents a single IP from spamming the /attendance/mark endpoint.
 * Limit: 5 requests per IP per minute.
 */
const attendanceMarkLimiter = createLimiter(
  60 * 1000,   // 1 minute window
  5,
  'Too many attendance requests from this IP. Please wait a moment before trying again.'
);

/**
 * QR generation limiter
 * Prevents faculty from accidentally or intentionally generating excessive QR codes.
 * Limit: 10 requests per IP per minute.
 */
const qrGenerateLimiter = createLimiter(
  60 * 1000,  // 1 minute window
  10,
  'Too many QR generation requests. Please wait before generating a new QR code.'
);

/**
 * Auth endpoint limiter (login / register)
 * Brute-force protection for login.
 * Limit: 20 requests per IP per 15 minutes.
 */
const authLimiter = createLimiter(
  15 * 60 * 1000,  // 15 minute window
  20,
  'Too many authentication attempts from this IP. Please try again after 15 minutes.'
);

module.exports = { attendanceMarkLimiter, qrGenerateLimiter, authLimiter };
