/**
 * Attendance Request Service
 *
 * Handles QR generation and secure scan validation.
 */

const crypto = require('crypto');
const AttendanceRequest = require('../models/attendance-request.model');
const { pool } = require('../config');

const QR_TOKEN_VALIDITY_SECONDS = 45;
const QR_REFRESH_INTERVAL_SECONDS = 12;
const MAX_QR_SCAN_WINDOW_SECONDS = 60;
const MAX_DISTANCE_METERS = 120;
const MAX_ACCURACY_METERS = 30;
const SECOND_CHECK_DELAY_SECONDS = 12;
const PRECHECK_TTL_SECONDS = 120;
const LOCATION_SAMPLE_COUNT = 3;

class ValidationError extends Error {
  constructor(message, statusCode = 400, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

class AttendanceRequestService {
  static getSigningSecret() {
    return process.env.ATTENDANCE_QR_SECRET || process.env.JWT_SECRET || 'qr-attendance-fallback-secret';
  }

  static base64UrlEncode(input) {
    const b64 = Buffer.from(input).toString('base64');
    return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  static base64UrlDecode(input) {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, 'base64').toString('utf8');
  }

  static signPayload(payload) {
    const payloadJson = JSON.stringify(payload);
    const encodedPayload = this.base64UrlEncode(payloadJson);
    const signature = crypto
      .createHmac('sha256', this.getSigningSecret())
      .update(encodedPayload)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${encodedPayload}.${signature}`;
  }

  static verifySignedPayload(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      throw new ValidationError('Invalid QR token format', 400, 'INVALID_QR_TOKEN');
    }

    const [encodedPayload, signature] = token.split('.');
    const expected = crypto
      .createHmac('sha256', this.getSigningSecret())
      .update(encodedPayload)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expected) {
      throw new ValidationError('Invalid QR signature', 400, 'INVALID_QR_SIGNATURE');
    }

    try {
      return JSON.parse(this.base64UrlDecode(encodedPayload));
    } catch (error) {
      throw new ValidationError('Invalid QR payload', 400, 'INVALID_QR_PAYLOAD');
    }
  }

  static isUuidLike(value) {
    if (!value || typeof value !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  static issueDynamicQrToken(request_id) {
    const issuedAt = Date.now();
    const payload = {
      v: 1,
      type: 'qr',
      request_id,
      ts: issuedAt,
      nonce: crypto.randomBytes(8).toString('hex')
    };

    return {
      qr_token: this.signPayload(payload),
      token_issued_at: new Date(issuedAt).toISOString(),
      token_expires_at: new Date(issuedAt + QR_TOKEN_VALIDITY_SECONDS * 1000).toISOString(),
      refresh_after_seconds: QR_REFRESH_INTERVAL_SECONDS,
      token_validity_seconds: QR_TOKEN_VALIDITY_SECONDS
    };
  }

  static normalizeLocationSamples(location_samples) {
    if (!Array.isArray(location_samples) || location_samples.length < LOCATION_SAMPLE_COUNT) {
      throw new ValidationError('Provide at least 3 location readings', 400, 'INSUFFICIENT_LOCATION_READINGS');
    }

    return location_samples.slice(0, LOCATION_SAMPLE_COUNT).map((sample, index) => {
      const latitude = Number(sample?.latitude);
      const longitude = Number(sample?.longitude);
      const accuracy = Number(sample?.accuracy);
      const timestamp = Number(sample?.timestamp || Date.now());

      if (
        !Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(accuracy) || !Number.isFinite(timestamp)
      ) {
        throw new ValidationError(`Invalid location sample at index ${index}`, 400, 'INVALID_LOCATION_SAMPLE');
      }

      return { latitude, longitude, accuracy, timestamp };
    });
  }

  static assessLocation(request, location_samples) {
    const samples = this.normalizeLocationSamples(location_samples);

    const distances = samples.map((sample) =>
      this.calculateDistance(request.latitude, request.longitude, sample.latitude, sample.longitude)
    );
    const accuracies = samples.map((sample) => sample.accuracy);

    const avgDistance = distances.reduce((sum, value) => sum + value, 0) / distances.length;
    const avgAccuracy = accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length;
    const maxAccuracy = Math.max(...accuracies);

    const passesAccuracy = avgAccuracy <= MAX_ACCURACY_METERS && maxAccuracy <= MAX_ACCURACY_METERS;
    const passesDistance = avgDistance <= MAX_DISTANCE_METERS;

    return {
      samples,
      distances,
      accuracies,
      average_distance_meters: Number(avgDistance.toFixed(2)),
      average_accuracy_meters: Number(avgAccuracy.toFixed(2)),
      max_accuracy_meters: Number(maxAccuracy.toFixed(2)),
      passes_accuracy: passesAccuracy,
      passes_distance: passesDistance,
      passes_all: passesAccuracy && passesDistance
    };
  }

  static async ensureSessionTimeWindow(session_id) {
    const [sessions] = await pool.execute(
      `SELECT id, status, start_time, end_time
       FROM sessions
       WHERE id = ?
       LIMIT 1`,
      [session_id]
    );

    const session = sessions[0];
    if (!session) {
      throw new ValidationError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    if (session.status !== 'active') {
      throw new ValidationError('Session is not active', 400, 'SESSION_NOT_ACTIVE');
    }

    const now = new Date();
    const start = new Date(session.start_time);
    const end = session.end_time ? new Date(session.end_time) : null;

    if (now < start) {
      throw new ValidationError('Attendance is not open yet for this session', 400, 'SESSION_NOT_STARTED');
    }

    if (end && now > end) {
      throw new ValidationError('Session time is over. Attendance is closed.', 400, 'SESSION_ENDED');
    }

    return session;
  }

  /**
   * Generate QR request with location validation
   */
  static async generateQRRequest(data) {
    const {
      faculty_id,
      session_id,
      attendance_value,
      latitude,
      longitude,
      radius_meters,
      duration_minutes
    } = data;

    try {
      // Fetch session + linked course details
      const [sessions] = await pool.execute(
        `SELECT s.id, s.faculty_id, s.status, s.course_id, s.department_id,
                c.faculty_id AS course_faculty_id, c.department_id AS course_dept_id
         FROM sessions s
         LEFT JOIN courses c ON s.course_id = c.id
         WHERE s.id = ?`,
        [session_id]
      );
      const session = sessions[0];

      if (!session) {
        throw new Error('Session not found');
      }

      // Security: Faculty can only generate QR for sessions they own
      if (Number(session.faculty_id) !== Number(faculty_id)) {
        throw new Error('You can only generate QR for your own sessions');
      }

      // -----------------------------------------------------------------------
      // DEPARTMENT VALIDATION
      // Faculty sirf apne department ke courses/sessions ka QR generate kar sakta hai
      // -----------------------------------------------------------------------
      // Fetch faculty's department name and resolve it to departments.id
      const [faculties] = await pool.execute(
        `SELECT u.id, u.department, d.id AS dept_id
         FROM users u
         LEFT JOIN departments d ON d.name = u.department
         WHERE u.id = ? AND u.role = 'faculty'`,
        [faculty_id]
      );
      const faculty = faculties[0];

      if (!faculty) {
        throw new Error('Faculty record not found');
      }

      // If the session has a department set, it must match the faculty's department
      if (session.department_id && faculty.dept_id) {
        if (Number(session.department_id) !== Number(faculty.dept_id)) {
          throw new Error(
            `Department mismatch: This session belongs to a different department. ` +
            `You can only generate QR for sessions in your own department (${faculty.department}).`
          );
        }
      }

      // If the session has a linked course, that course's department must also match
      if (session.course_id && session.course_dept_id && faculty.dept_id) {
        if (Number(session.course_dept_id) !== Number(faculty.dept_id)) {
          throw new Error(
            `Course department mismatch: This course does not belong to your department (${faculty.department}).`
          );
        }
      }

      // If session has a course, the course must be assigned to this faculty
      if (session.course_id && session.course_faculty_id !== null &&
          Number(session.course_faculty_id) !== Number(faculty_id)) {
        throw new Error('This course is not assigned to you');
      }

      if (session.status !== 'active') {
        throw new Error('Session is not active');
      }

      // Validate attendance value
      if (![1, 2, 3].includes(attendance_value)) {
        throw new Error('Invalid attendance value. Must be 1, 2, or 3');
      }

      // Validate radius (geofence still includes accuracy + time checks later)
      if (!Number.isInteger(radius_meters) || radius_meters < 20 || radius_meters > 120) {
        throw new Error('Invalid radius. Must be between 20 and 120 meters');
      }

      // Validate duration
      if (![1, 2, 5].includes(duration_minutes) && duration_minutes < 1) {
        throw new Error('Invalid duration. Must be 1, 2, 5 minutes or custom (>0)');
      }

      // Validate location
      if (!this.isValidLocation(latitude, longitude)) {
        throw new Error('Invalid location coordinates');
      }

      // Invalidate previous active requests for this session
      await AttendanceRequest.invalidateSessionRequests(session_id, faculty_id);

      // Calculate request expiry time (session-wide scan window)
      const now = new Date();
      const expiryTime = new Date(now.getTime() + duration_minutes * 60000);

      // Create new request
      const requestData = {
        faculty_id,
        session_id,
        attendance_value,
        latitude,
        longitude,
        radius_meters,
        expires_at: expiryTime
      };

      const result = await AttendanceRequest.create(requestData);

      const tokenBundle = this.issueDynamicQrToken(result.request_id);

      return {
        success: true,
        request_id: result.request_id,
        expires_at: expiryTime,
        duration_minutes,
        radius_meters,
        attendance_value,
        ...tokenBundle,
        security: {
          location_sample_count: LOCATION_SAMPLE_COUNT,
          max_accuracy_meters: MAX_ACCURACY_METERS,
          max_distance_meters: MAX_DISTANCE_METERS,
          second_check_delay_seconds: SECOND_CHECK_DELAY_SECONDS
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh dynamic QR token for an active request.
   */
  static async refreshDynamicQrToken(request_id, faculty_id) {
    const request = await AttendanceRequest.getByRequestIdAndFaculty(request_id, faculty_id);
    if (!request) {
      throw new ValidationError('Active QR request not found', 404, 'QR_REQUEST_NOT_FOUND');
    }

    return {
      success: true,
      request_id,
      expires_at: request.expires_at,
      ...this.issueDynamicQrToken(request_id)
    };
  }

  /**
   * Validate QR request
   */
  static async validateQRRequest({ qr_token, location_samples, student_id, device_id, scan_timestamp }) {
    const normalizedToken = String(qr_token || '').trim();
    let requestId = null;
    let tokenTimestamp = null;
    let isLegacyQr = false;

    if (normalizedToken.includes('.')) {
      const decoded = this.verifySignedPayload(normalizedToken);
      if (decoded.type !== 'qr' || !decoded.request_id || !decoded.ts) {
        throw new ValidationError('Invalid QR token', 400, 'INVALID_QR_TOKEN');
      }
      requestId = decoded.request_id;
      tokenTimestamp = Number(decoded.ts);
    } else if (this.isUuidLike(normalizedToken)) {
      // Backward compatibility for previously generated static QR values.
      requestId = normalizedToken;
      isLegacyQr = true;
    } else {
      throw new ValidationError('Invalid QR token', 400, 'INVALID_QR_TOKEN');
    }

    if (!isLegacyQr) {
      const ageMs = Date.now() - tokenTimestamp;
      if (ageMs < 0 || ageMs > MAX_QR_SCAN_WINDOW_SECONDS * 1000) {
        return {
          valid: false,
          reason: 'QR code has expired. Ask faculty to refresh.',
          reason_code: 'QR_EXPIRED'
        };
      }
    }

    const request = await AttendanceRequest.getByRequestId(requestId);
    if (!request) {
      return {
        valid: false,
        reason: 'QR code not found or expired',
        reason_code: 'QR_REQUEST_NOT_FOUND'
      };
    }

    const now = new Date();
    if (new Date(request.expires_at) <= now) {
      await AttendanceRequest.updateStatus(decoded.request_id, 'expired');
      return {
        valid: false,
        reason: 'QR code has expired',
        reason_code: 'QR_REQUEST_EXPIRED'
      };
    }

    await this.ensureSessionTimeWindow(request.session_id);

    const [existing] = await pool.execute(
      `SELECT id FROM attendance
       WHERE student_id = ? AND session_id = ? AND DATE(marked_at) = CURDATE()
       LIMIT 1`,
      [student_id, request.session_id]
    );

    if (existing.length > 0) {
      return {
        valid: false,
        reason: 'Attendance already marked for this session',
        reason_code: 'ALREADY_MARKED'
      };
    }

    const assessment = this.assessLocation(request, location_samples);

    if (!assessment.passes_accuracy) {
      return {
        valid: false,
        reason: 'Fetching accurate location, please wait...',
        reason_code: 'LOW_ACCURACY',
        retryable: true,
        metrics: assessment
      };
    }

    if (!assessment.passes_distance) {
      return {
        valid: false,
        reason: `Average distance ${assessment.average_distance_meters}m is outside allowed range`,
        reason_code: 'OUTSIDE_GEOFENCE',
        metrics: assessment
      };
    }

    const challengePayload = {
      v: 1,
      type: 'precheck',
      request_id: requestId,
      session_id: request.session_id,
      student_id,
      device_id: device_id || null,
      issued_at: Date.now(),
      scan_timestamp: scan_timestamp || Date.now(),
      first_check: {
        average_distance_meters: assessment.average_distance_meters,
        average_accuracy_meters: assessment.average_accuracy_meters
      }
    };

    return {
      valid: true,
      request_id: decoded.request_id,
      attendance_value: request.attendance_value,
      session_id: request.session_id,
      faculty_id: request.faculty_id,
      precheck_token: this.signPayload(challengePayload),
      second_check_after_seconds: SECOND_CHECK_DELAY_SECONDS,
      metrics: assessment
    };
  }

  /**
   * Final verification before attendance mark.
   */
  static async validateSecondCheck({
    precheck_token,
    student_id,
    session_id,
    device_id,
    location_samples,
    timestamp
  }) {
    const decoded = this.verifySignedPayload(precheck_token);

    if (decoded.type !== 'precheck') {
      throw new ValidationError('Invalid verification challenge', 400, 'INVALID_PRECHECK_TOKEN');
    }

    if (Number(decoded.student_id) !== Number(student_id)) {
      throw new ValidationError('Challenge does not belong to this user', 403, 'PRECHECK_USER_MISMATCH');
    }

    if (Number(decoded.session_id) !== Number(session_id)) {
      throw new ValidationError('Challenge does not match this session', 400, 'PRECHECK_SESSION_MISMATCH');
    }

    if (decoded.device_id && device_id && decoded.device_id !== device_id) {
      throw new ValidationError('Device mismatch detected', 403, 'DEVICE_MISMATCH');
    }

    const ttlMs = PRECHECK_TTL_SECONDS * 1000;
    if (!decoded.issued_at || Date.now() - Number(decoded.issued_at) > ttlMs) {
      throw new ValidationError('Verification window expired. Scan again.', 400, 'PRECHECK_EXPIRED');
    }

    const minDelayMs = SECOND_CHECK_DELAY_SECONDS * 1000;
    const referenceTs = Number(decoded.scan_timestamp || decoded.issued_at);
    const currentTs = Number(timestamp || Date.now());
    if (currentTs - referenceTs < minDelayMs) {
      throw new ValidationError('Second location check attempted too early', 400, 'SECOND_CHECK_TOO_EARLY');
    }

    const request = await AttendanceRequest.getByRequestId(decoded.request_id);
    if (!request) {
      throw new ValidationError('QR request is no longer active', 400, 'QR_REQUEST_INACTIVE');
    }

    await this.ensureSessionTimeWindow(request.session_id);

    const secondAssessment = this.assessLocation(request, location_samples);
    if (!secondAssessment.passes_accuracy) {
      throw new ValidationError('Second location check failed: low accuracy', 400, 'SECOND_CHECK_LOW_ACCURACY');
    }

    if (!secondAssessment.passes_distance) {
      throw new ValidationError('Second location check failed: outside geofence', 400, 'SECOND_CHECK_DISTANCE_FAIL');
    }

    return {
      passed: true,
      request_id: decoded.request_id,
      first_check: decoded.first_check,
      second_check: {
        average_distance_meters: secondAssessment.average_distance_meters,
        average_accuracy_meters: secondAssessment.average_accuracy_meters
      }
    };
  }

  /**
   * Get attendance count for a request
   */
  static async getAttendanceCount(request_id) {
    try {
      // Get session_id from the QR request
      const [rows] = await pool.execute(
        'SELECT session_id FROM attendance_request WHERE request_id = ?',
        [request_id]
      );
      if (!rows[0]) return 0;
      const session_id = rows[0].session_id;

      // Count actual attendance records (present or late) for this session — today only
      const [countRows] = await pool.execute(
        "SELECT COUNT(*) as cnt FROM attendance WHERE session_id = ? AND status IN ('present', 'late') AND DATE(marked_at) = CURDATE()",
        [session_id]
      );
      return countRows[0]?.cnt || 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Record attendance acceptance
   */
  static async recordAcceptance(request_id) {
    try {
      await AttendanceRequest.incrementAcceptedCount(request_id);
      return await AttendanceRequest.getAcceptedCount(request_id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get faculty's recent requests
   */
  static async getFacultyRequests(faculty_id) {
    try {
      return await AttendanceRequest.getByFacultyId(faculty_id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate location coordinates
   */
  static isValidLocation(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in meters
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Convert to meters
    return Number(distance.toFixed(2));
  }
}

module.exports = AttendanceRequestService;
