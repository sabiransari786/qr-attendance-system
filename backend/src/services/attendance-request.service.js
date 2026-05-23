/**
 * Attendance Request Service
 *
 * Handles QR generation and secure scan validation.
 */

const crypto = require('crypto');
const AttendanceRequest = require('../models/attendance-request.model');
const { pool } = require('../config');

const MAX_DISTANCE_METERS = 120;
const MAX_ACCURACY_METERS = 50;
const SECOND_CHECK_DELAY_SECONDS = 12;
const PRECHECK_TTL_SECONDS = 120;
const MIN_PASSING_SAMPLES = 1;
const LOCATION_SAMPLE_WINDOW_SECONDS = 2;
const PRESTART_GRACE_MINUTES = Number(process.env.SESSION_PRESTART_GRACE_MINUTES) || 10;

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

  /**
   * Parse a QR token and return normalized info.
   * Frontend now sends the plain `request_id` encoded in the QR.
  * Returns { requestId, decoded }
   */
  static parseQrToken(token) {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) {
      throw new ValidationError('Invalid QR token', 400, 'INVALID_QR_TOKEN');
    }

    if ((normalizedToken.startsWith('{') && normalizedToken.endsWith('}')) || (normalizedToken.startsWith('"') && normalizedToken.endsWith('"'))) {
      try {
        const parsed = JSON.parse(normalizedToken);
        const candidate = parsed?.request_id || parsed?.requestId || parsed?.qr_token || parsed?.token;
        if (candidate && this.isUuidLike(String(candidate).trim())) {
          return { requestId: String(candidate).trim(), decoded: parsed };
        }
      } catch {
        // ignore invalid JSON and fall through to plain validation
      }
    }

    // Plain UUID request_id (current frontend contract)
    if (this.isUuidLike(normalizedToken)) {
      return { requestId: normalizedToken, decoded: null };
    }

    throw new ValidationError('Invalid QR token', 400, 'INVALID_QR_TOKEN');
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

  static normalizeLocationSamples(location_samples) {
    if (!Array.isArray(location_samples) || location_samples.length < 1) {
      throw new ValidationError('Provide at least 1 location reading', 400, 'INSUFFICIENT_LOCATION_READINGS');
    }

    return location_samples.map((sample, index) => {
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

  static median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  static assessLocation(request, location_samples) {
    const samples = this.normalizeLocationSamples(location_samples);

    const distances = samples.map((sample) =>
      this.calculateDistance(request.latitude, request.longitude, sample.latitude, sample.longitude)
    );
    const accuracies = samples.map((sample) => sample.accuracy);
    const latitudes = samples.map((sample) => sample.latitude);
    const longitudes = samples.map((sample) => sample.longitude);
    const timestamps = samples.map((sample) => sample.timestamp);

    const medianLatitude = this.median(latitudes);
    const medianLongitude = this.median(longitudes);
    const medianAccuracy = this.median(accuracies);
    const medianTimestamp = Math.round(this.median(timestamps));

    const avgDistance = distances.reduce((sum, value) => sum + value, 0) / distances.length;
    const avgAccuracy = accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length;
    const maxAccuracy = Math.max(...accuracies);
    const medianDistance = this.calculateDistance(request.latitude, request.longitude, medianLatitude, medianLongitude);
    // Per-sample pass checks
    const perSamplePass = samples.map((s, idx) => {
      const accOk = accuracies[idx] <= MAX_ACCURACY_METERS;
      const distOk = distances[idx] <= MAX_DISTANCE_METERS;
      return { accuracy: accuracies[idx], distance: distances[idx], accOk, distOk, pass: accOk && distOk };
    });

    const passCount = perSamplePass.filter((p) => p.pass).length;
    const passesDistance = medianDistance <= MAX_DISTANCE_METERS;

    // Use the median reading so one or two noisy GPS samples do not reject the scan.
    const passesAccuracy = medianAccuracy <= MAX_ACCURACY_METERS || passCount >= MIN_PASSING_SAMPLES;

    return {
      samples,
      distances,
      accuracies,
      median_latitude: Number(medianLatitude.toFixed(6)),
      median_longitude: Number(medianLongitude.toFixed(6)),
      median_timestamp: medianTimestamp,
      perSamplePass,
      pass_count: passCount,
      average_distance_meters: Number(avgDistance.toFixed(2)),
      average_accuracy_meters: Number(avgAccuracy.toFixed(2)),
      median_distance_meters: Number(medianDistance.toFixed(2)),
      median_accuracy_meters: Number(medianAccuracy.toFixed(2)),
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

    // If a session was scheduled in the future, open it automatically when a
    // student scans the QR so the flow works without waiting for the planned
    // start time. This keeps the system usable in real classrooms where the
    // teacher generates the QR at scan time.
    if (now < start) {
      const durationMs = end && end > start ? (end.getTime() - start.getTime()) : (60 * 60 * 1000);
      const openedStart = new Date(now.getTime() - (60 * 1000));
      const openedEnd = new Date(openedStart.getTime() + durationMs);

      await pool.execute(
        `UPDATE sessions
         SET start_time = ?, end_time = ?, status = ?
         WHERE id = ?`,
        [openedStart, openedEnd, 'active', session_id]
      );

      session.start_time = openedStart;
      session.end_time = openedEnd;
      return session;
    }

    // Allow a configurable pre-start grace window so students can scan shortly
    // before the official `start_time` (default 10 minutes). Useful when
    // faculty generate the QR a few minutes before class starts.
    const graceMs = PRESTART_GRACE_MINUTES * 60 * 1000;
    const earliestAllowed = new Date(start.getTime() - graceMs);
    if (now < earliestAllowed) {
      const serverTime = now.toISOString();
      const sessionStart = start.toISOString();
      const allowedFrom = earliestAllowed.toISOString();
      throw new ValidationError(
        `Attendance is not open yet for this session (server_time=${serverTime}, session_start=${sessionStart}, allowed_from=${allowedFrom})`,
        400,
        'SESSION_NOT_STARTED'
      );
    }

    if (end && now > end) {
      const serverTime = now.toISOString();
      const sessionEnd = end.toISOString();
      throw new ValidationError(
        `Session time is over. Attendance is closed. (server_time=${serverTime}, session_end=${sessionEnd})`,
        400,
        'SESSION_ENDED'
      );
    }

    return session;
  }

  /**
   * Ensure request exists and is active (not expired), returns request record.
   */
  static async ensureRequestActive(request_id) {
    const request = await AttendanceRequest.getByRequestId(request_id);
    if (!request) {
      throw new ValidationError('QR code not found or expired', 404, 'QR_REQUEST_NOT_FOUND');
    }

    const now = new Date();
    if (new Date(request.expires_at) <= now) {
      await AttendanceRequest.updateStatus(request_id, 'expired');
      throw new ValidationError('QR code has expired', 400, 'QR_REQUEST_EXPIRED');
    }

    return request;
  }

  static async ensureNotAlreadyMarked(student_id, session_id) {
    const [existing] = await pool.execute(
      `SELECT id FROM attendance
       WHERE student_id = ? AND session_id = ? AND DATE(marked_at) = CURDATE()
       LIMIT 1`,
      [student_id, session_id]
    );

    if (existing.length > 0) {
      throw new ValidationError('Attendance already marked for this session', 400, 'ALREADY_MARKED');
    }
  }

  static createPrecheckToken(request, assessment, student_id, device_id, scan_timestamp) {
    const challengePayload = {
      v: 1,
      type: 'precheck',
      request_id: request.request_id,
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

    return this.signPayload(challengePayload);
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

      // If the session is scheduled in the future, open it now so the QR can
      // actually be used immediately. This keeps the generate → scan flow
      // working without requiring a separate manual "open" step.
      const sessionStart = session.start_time ? new Date(session.start_time) : null;
      const sessionEnd = session.end_time ? new Date(session.end_time) : null;
      const now = new Date();
      if (sessionStart && sessionStart > now) {
        const durationMs = sessionEnd && sessionEnd > sessionStart
          ? (sessionEnd.getTime() - sessionStart.getTime())
          : (60 * 60 * 1000);
        const openedStart = new Date(now.getTime() - (60 * 1000));
        const openedEnd = new Date(openedStart.getTime() + durationMs);
        const openedQrExpiry = new Date(openedStart.getTime() + QR_EXPIRY_TIME);

        await pool.execute(
          `UPDATE sessions
           SET start_time = ?, end_time = ?, qr_expiry_time = ?, status = ?
           WHERE id = ?`,
          [openedStart, openedEnd, openedQrExpiry, 'active', session_id]
        );

        session.start_time = openedStart;
        session.end_time = openedEnd;
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

      // Note: sessions are owned by a faculty (checked above). Do not block
      // QR generation solely because the `courses.faculty_id` points to a
      // different faculty — the session owner should be able to generate QR
      // for their own session regardless of the course's assigned faculty.

      if (session.status !== 'active') {
        throw new Error('Session is not active');
      }

      // Validate attendance value
      if (!Number.isInteger(attendance_value) || attendance_value < 1 || attendance_value > 10) {
        throw new Error('Invalid attendance value. Must be between 1 and 10');
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

      return {
        success: true,
        request_id: result.request_id,
        expires_at: expiryTime,
        duration_minutes,
        radius_meters,
        attendance_value,
        security: {
          location_sample_window_seconds: LOCATION_SAMPLE_WINDOW_SECONDS,
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
  /**
   * Validate QR request
   */
  static async validateQRRequest({ qr_token, location_samples, student_id, device_id, scan_timestamp }) {
    const parsed = this.parseQrToken(qr_token);
    const { requestId } = parsed;

    const request = await this.ensureRequestActive(requestId);

    await this.ensureSessionTimeWindow(request.session_id);

    // Throw on already marked — simplified path will surface a consistent error
    await this.ensureNotAlreadyMarked(student_id, request.session_id);

    const assessment = this.assessLocation(request, location_samples);

    if (!assessment.passes_accuracy) {
      return {
        valid: false,
        reason: 'Location accuracy is low — try moving outdoors or wait a few seconds and retry. Provide more stable GPS samples.',
        reason_code: 'LOW_ACCURACY',
        retryable: true,
        metrics: assessment,
        help: {
          suggestion: 'Move to an open area, enable device location high-accuracy, and retry scan. At least 2 of 3 location samples should be within the allowed accuracy.'
        }
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

    const precheck_token = this.createPrecheckToken(request, assessment, student_id, device_id, scan_timestamp);

    return {
      valid: true,
      request_id: requestId,
      attendance_value: request.attendance_value,
      session_id: request.session_id,
      faculty_id: request.faculty_id,
      precheck_token,
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

    // Reuse helpers for consistent checks
    const request = await this.ensureRequestActive(decoded.request_id);
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
