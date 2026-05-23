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
 *   attendance_value: 1-10
 *   latitude: number
 *   longitude: number
 *   radius_meters: 10|20|50
 *   duration_minutes: number (1, 2, 5, or custom)
 * }
 * 
 * Returns: {
 *   success: true
 *   request_id: UUID (encode this plain value in the QR)
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
    if (!session_id || attendance_value === undefined || latitude === undefined || longitude === undefined || !radius_meters || !duration_minutes) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: session_id, attendance_value, latitude, longitude, radius_meters, duration_minutes'
      });
    }

    const attendancePoints = parseInt(attendance_value, 10);
    if (!Number.isInteger(attendancePoints) || attendancePoints < 1 || attendancePoints > 10) {
      return res.status(400).json({
        success: false,
        message: 'attendance_value must be an integer between 1 and 10'
      });
    }

    const result = await AttendanceRequestService.generateQRRequest({
      faculty_id,
      session_id,
      attendance_value: attendancePoints,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius_meters: parseInt(radius_meters),
      duration_minutes: parseInt(duration_minutes)
    });

    res.json(Object.assign({ success: true }, result));
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
 *   qr_token: string
 *   location_samples: Array<{ latitude, longitude, accuracy, timestamp }>
 *   device_id?: string
 *   scan_timestamp?: number
 * }
 * 
 * Returns: {
 *   valid: true|false
 *   reason: string (if invalid)
 *   request_id: string (if valid)
 *   session_id: number (if valid)
 *   attendance_value: number (if valid)
 *   precheck_token: string (if valid)
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

    if (result && result.valid === false) {
      return res.json(Object.assign({ success: false }, result));
    }

    return res.json(Object.assign({ success: true }, result));
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
      success: true,
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
 * Record Acceptance for live count
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
      success: true,
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
  getAttendanceCount,
  getFacultyRequests,
  recordAcceptance
};
