/**
 * Attendance Request Controller
 * 
 * Handles QR code generation requests from faculty
 */

const AttendanceRequestService = require('../services/attendance-request.service');

/**
 * Generate QR Code Request
 * 
 * POST /api/qr-request/generate
 * 
 * Body: {
 *   session_id: number
 *   attendance_value: 1|2|3
 *   latitude: number
 *   longitude: number
 *   radius_meters: 10|20|50
 *   duration_minutes: number (1, 2, 5, or custom)
 * }
 * 
 * Returns: {
 *   success: true
 *   request_id: UUID (encode in QR)
 *   expires_at: timestamp
 *   duration_minutes: number
 * }
 */
const generateQRRequest = async (req, res, next) => {
  try {
    const faculty_id = req.user.id;
    const {
      session_id,
      attendance_value,
      latitude,
      longitude,
      radius_meters,
      duration_minutes
    } = req.body;

    // Validation
    if (!session_id || !attendance_value || latitude === undefined || longitude === undefined || !radius_meters || !duration_minutes) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: session_id, attendance_value, latitude, longitude, radius_meters, duration_minutes'
      });
    }

    const result = await AttendanceRequestService.generateQRRequest({
      faculty_id,
      session_id,
      attendance_value: parseInt(attendance_value),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius_meters: parseInt(radius_meters),
      duration_minutes: parseInt(duration_minutes)
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Validate QR Request
 * 
 * POST /api/qr-request/validate
 * 
 * Body: {
 *   request_id: UUID
 *   student_latitude: number
 *   student_longitude: number
 * }
 * 
 * Returns: {
 *   valid: true|false
 *   reason: string (if invalid)
 *   attendance_value: number (if valid)
 *   distance: number (if valid)
 * }
 */
const validateQRRequest = async (req, res, next) => {
  try {
    const { qr_token, location_samples, device_id, scan_timestamp } = req.body;

    if (!qr_token || !Array.isArray(location_samples)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: qr_token, location_samples'
      });
    }

    const result = await AttendanceRequestService.validateQRRequest({
      qr_token,
      location_samples,
      student_id: req.user.id,
      device_id,
      scan_timestamp
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh dynamic QR token for active request
 *
 * POST /api/qr-request/:request_id/refresh
 */
const refreshQRToken = async (req, res, next) => {
  try {
    const { request_id } = req.params;
    const faculty_id = req.user.id;

    if (!request_id) {
      return res.status(400).json({
        success: false,
        message: 'request_id is required'
      });
    }

    const result = await AttendanceRequestService.refreshDynamicQrToken(request_id, faculty_id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Attendance Count
 * 
 * GET /api/qr-request/:request_id/attendance-count
 * 
 * Returns: {
 *   count: number
 * }
 */
const getAttendanceCount = async (req, res, next) => {
  try {
    const { request_id } = req.params;

    if (!request_id) {
      return res.status(400).json({
        success: false,
        message: 'request_id is required'
      });
    }

    const count = await AttendanceRequestService.getAttendanceCount(request_id);

    res.json({
      request_id,
      count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Faculty Requests
 * 
 * GET /api/qr-request/faculty/requests
 * 
 * Returns: array of requests with attendance counts
 */
const getFacultyRequests = async (req, res, next) => {
  try {
    const faculty_id = req.user.id;

    const requests = await AttendanceRequestService.getFacultyRequests(faculty_id);

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record Acceptance
 * 
 * POST /api/qr-request/:request_id/accept
 * 
 * Returns: {
 *   request_id: string
 *   count: number
 * }
 */
const recordAcceptance = async (req, res, next) => {
  try {
    const { request_id } = req.params;

    if (!request_id) {
      return res.status(400).json({
        success: false,
        message: 'request_id is required'
      });
    }

    const count = await AttendanceRequestService.recordAcceptance(request_id);

    res.json({
      request_id,
      count
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateQRRequest,
  validateQRRequest,
  refreshQRToken,
  getAttendanceCount,
  getFacultyRequests,
  recordAcceptance
};
