/**
 * QR Request Routes
 * 
 * Handles routes for QR code generation and validation
 * All faculty-only routes require authentication
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const { requireFaculty, requireStudent } = require('../../middleware/auth.middleware');
const { qrGenerateLimiter } = require('../../middleware/rate-limit.middleware');
const {
  generateQRRequest,
  validateQRRequest,
  getAttendanceCount,
  getFacultyRequests,
  recordAcceptance
} = require('../../controllers/qr-request.controller');

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/qr-request/generate
 * Generate QR code for attendance
 * 
 * Faculty only — authentication + role + rate limit enforced
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
router.post('/generate', qrGenerateLimiter, authMiddleware, requireFaculty, generateQRRequest);

/**
 * POST /api/qr-request/validate
 * Validate QR request — student scans QR and this verifies location + expiry.
 * Requires authentication (student) to prevent anonymous abuse.
 *
 * Body: {
 *   request_id: UUID
 *   student_latitude: number
 *   student_longitude: number
 * }
 */
router.post('/validate', authMiddleware, requireStudent, validateQRRequest);

/**
 * GET /api/qr-request/:request_id/attendance-count
 * Get live attendance count for a request.
 * Faculty only — only the QR owner should see live counts.
 */
router.get('/:request_id/attendance-count', authMiddleware, requireFaculty, getAttendanceCount);

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
