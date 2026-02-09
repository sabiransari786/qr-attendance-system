/**
 * QR Request Routes
 * 
 * Handles routes for QR code generation and validation
 * All faculty-only routes require authentication
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const {
  generateQRRequest,
  validateQRRequest,
  getAttendanceCount,
  getFacultyRequests,
  recordAcceptance
} = require('../../controllers/qr-request.controller');

/**
 * Middleware: Ensure only faculty can access these routes
 */
const requireFaculty = (req, res, next) => {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({
      success: false,
      message: 'Only faculty members can access this resource'
    });
  }
  next();
};

/**
 * Middleware: Ensure only students can access these routes
 */
const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Only students can access this resource'
    });
  }
  next();
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/qr-request/generate
 * Generate QR code for attendance
 * 
 * Faculty only
 * Requires: Authentication + Faculty role
 * 
 * Body: {
 *   session_id: int
 *   attendance_value: 1|2|3
 *   latitude: number
 *   longitude: number
 *   radius_meters: 10|20|50
 *   duration_minutes: number
 * }
 */
router.post('/generate', authMiddleware, requireFaculty, generateQRRequest);

/**
 * POST /api/qr-request/validate
 * Validate QR request (used by students)
 * This is public - no auth required
 * 
 * Body: {
 *   request_id: UUID
 *   student_latitude: number
 *   student_longitude: number
 * }
 */
router.post('/validate', validateQRRequest);

/**
 * GET /api/qr-request/:request_id/attendance-count
 * Get live attendance count for a request
 * Public endpoint for live polling
 */
router.get('/:request_id/attendance-count', getAttendanceCount);

/**
 * POST /api/qr-request/:request_id/accept
 * Record attendance acceptance for live count
 * 
 * Student only
 * Requires: Authentication + Student role
 */
router.post('/:request_id/accept', authMiddleware, requireStudent, recordAcceptance);

/**
 * GET /api/qr-request/faculty/requests
 * Get faculty's recent requests
 * 
 * Faculty only
 * Requires: Authentication + Faculty role
 */
router.get('/faculty/requests', authMiddleware, requireFaculty, getFacultyRequests);

module.exports = router;
